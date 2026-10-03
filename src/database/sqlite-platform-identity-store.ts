import type { DatabaseSync } from 'node:sqlite';
import type { PlatformAdminAccount, PlatformActivation, PlatformIdentityStore, PlatformPasskey } from '../identity/index.ts';

type AdminRow = { id: string; username: string; active: number; created_at: string };
type ActivationRow = { admin_id: string; code_hash: string; expires_at: string; used_at: string | null };
type PasskeyRow = { credential_id: string; public_key: Uint8Array; counter: number; transports: string };
const admin = (row: AdminRow): PlatformAdminAccount => ({ id: row.id, username: row.username, active: row.active === 1, createdAt: row.created_at });
const activation = (row: ActivationRow): PlatformActivation => ({ adminId: row.admin_id, codeHash: row.code_hash,
  expiresAt: row.expires_at, usedAt: row.used_at });
const passkey = (row: PasskeyRow): PlatformPasskey => ({ id: row.credential_id, publicKey: new Uint8Array(row.public_key),
  counter: row.counter, transports: JSON.parse(row.transports) as string[] });

function atomic<T>(database: DatabaseSync, work: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try { const result = work(); database.exec('COMMIT'); return result; }
  catch (error) { try { database.exec('ROLLBACK'); } catch { /* preserve original failure */ } throw error; }
}

export function createSqlitePlatformIdentityStore(database: DatabaseSync): PlatformIdentityStore {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS platform_admins (
      id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      active INTEGER NOT NULL CHECK (active IN (0,1)), created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS platform_activation_codes (
      admin_id TEXT PRIMARY KEY REFERENCES platform_admins(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT
    );
    CREATE TABLE IF NOT EXISTS platform_passkeys (
      credential_id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
      public_key BLOB NOT NULL, counter INTEGER NOT NULL, transports TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS platform_sessions (
      token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS platform_registration_challenges (
      token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
      activation_code_hash TEXT NOT NULL, challenge TEXT NOT NULL, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS platform_login_challenges (
      token_hash TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE, challenge TEXT NOT NULL, expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_platform_events (
      id TEXT PRIMARY KEY, actor_admin_id TEXT, system_actor TEXT, target_admin_id TEXT,
      target_tenant_id TEXT, action TEXT NOT NULL, occurred_at TEXT NOT NULL,
      CHECK ((actor_admin_id IS NOT NULL) <> (system_actor IS NOT NULL))
    );
  `);
  const adminActivation = `SELECT a.id,a.username,a.active,a.created_at,c.admin_id,c.code_hash,c.expires_at,c.used_at`;
  return {
    async recoverAdmin(value) { return atomic(database, () => {
      const row = database.prepare('SELECT id FROM platform_admins WHERE username=?').get(value.username) as { id: string } | undefined;
      if (!row) return false;
      database.prepare('UPDATE platform_admins SET active=0 WHERE id=?').run(row.id);
      for (const table of ['platform_passkeys','platform_sessions','platform_registration_challenges']) database.prepare(`DELETE FROM ${table} WHERE admin_id=?`).run(row.id);
      database.prepare('DELETE FROM platform_login_challenges WHERE username=?').run(value.username);
      database.prepare(`INSERT INTO platform_activation_codes(admin_id,code_hash,expires_at,used_at) VALUES(?,?,?,NULL)
        ON CONFLICT(admin_id) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,used_at=NULL`).run(row.id,value.codeHash,value.expiresAt); return true;
    }); },
    async createFirstAdmin(value) { return atomic(database, () => {
      if (database.prepare('SELECT 1 FROM platform_admins LIMIT 1').get()) return 'already-exists';
      database.prepare('INSERT INTO platform_admins(id,username,active,created_at) VALUES(?,?,?,?)')
        .run(value.account.id,value.account.username,value.account.active ? 1 : 0,value.account.createdAt);
      database.prepare('INSERT INTO platform_activation_codes(admin_id,code_hash,expires_at,used_at) VALUES(?,?,?,?)')
        .run(value.activation.adminId,value.activation.codeHash,value.activation.expiresAt,value.activation.usedAt); return 'created';
    }); },
    async pendingActivation(username, codeHash) {
      const row = database.prepare(`${adminActivation} FROM platform_admins a JOIN platform_activation_codes c ON c.admin_id=a.id WHERE a.username=? AND c.code_hash=?`)
        .get(username,codeHash) as (AdminRow & ActivationRow) | undefined;
      return row ? { account: admin(row), activation: activation(row) } : null;
    },
    async saveRegistrationChallenge(value) { atomic(database, () => {
      database.prepare('DELETE FROM platform_registration_challenges WHERE admin_id=?').run(value.adminId);
      database.prepare('INSERT INTO platform_registration_challenges(token_hash,admin_id,activation_code_hash,challenge,expires_at) VALUES(?,?,?,?,?)')
        .run(value.tokenHash,value.adminId,value.activationHash,value.challenge,value.expiresAt);
    }); },
    async registrationForActivation(username, tokenHash) {
      const row = database.prepare(`${adminActivation},r.challenge,r.expires_at AS challenge_expires_at FROM platform_registration_challenges r
        JOIN platform_admins a ON a.id=r.admin_id JOIN platform_activation_codes c ON c.admin_id=a.id AND c.code_hash=r.activation_code_hash
        WHERE a.username=? AND r.token_hash=?`).get(username,tokenHash) as (AdminRow & ActivationRow & { challenge: string; challenge_expires_at: string }) | undefined;
      return row ? { account: admin(row), activation: activation(row), challenge: row.challenge, challengeExpiresAt: row.challenge_expires_at } : null;
    },
    async activateWithPasskey(value) { return atomic(database, () => {
      const row = database.prepare(`${adminActivation},r.expires_at AS challenge_expires_at FROM platform_registration_challenges r
        JOIN platform_admins a ON a.id=r.admin_id JOIN platform_activation_codes c ON c.admin_id=a.id AND c.code_hash=r.activation_code_hash
        WHERE a.username=? AND r.token_hash=?`).get(value.username,value.tokenHash) as (AdminRow & ActivationRow & { challenge_expires_at: string }) | undefined;
      if (!row || row.active || row.used_at || Date.parse(row.expires_at) <= Date.parse(value.now) || Date.parse(row.challenge_expires_at) <= Date.parse(value.now)) return false;
      database.prepare('UPDATE platform_admins SET active=1 WHERE id=?').run(row.id);
      database.prepare('UPDATE platform_activation_codes SET used_at=? WHERE admin_id=?').run(value.now,row.id);
      database.prepare('INSERT INTO platform_passkeys(credential_id,admin_id,public_key,counter,transports,created_at) VALUES(?,?,?,?,?,?)')
        .run(value.passkey.id,row.id,value.passkey.publicKey,value.passkey.counter,JSON.stringify(value.passkey.transports ?? []),value.now);
      database.prepare('DELETE FROM platform_registration_challenges WHERE token_hash=?').run(value.tokenHash);
      database.prepare('INSERT INTO platform_sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)').run(value.session.tokenHash,row.id,value.session.expiresAt); return true;
    }); },
    async saveAuthenticationChallenge(value) { atomic(database, () => {
      database.prepare('DELETE FROM platform_login_challenges WHERE username=?').run(value.username);
      database.prepare('INSERT INTO platform_login_challenges(token_hash,username,challenge,expires_at) VALUES(?,?,?,?)')
        .run(value.tokenHash,value.username,value.challenge,value.expiresAt);
    }); },
    async authenticationForLogin(username, tokenHash, credentialId) {
      const row = database.prepare(`SELECT a.id,a.username,a.active,a.created_at,p.credential_id,p.public_key,p.counter,p.transports,c.challenge,c.expires_at
        FROM platform_login_challenges c JOIN platform_admins a ON a.username=c.username AND a.active=1
        JOIN platform_passkeys p ON p.admin_id=a.id WHERE c.username=? AND c.token_hash=? AND p.credential_id=?`)
        .get(username,tokenHash,credentialId) as (AdminRow & PasskeyRow & { challenge: string; expires_at: string }) | undefined;
      return row ? { account: admin(row), passkey: passkey(row), challenge: row.challenge, expiresAt: row.expires_at } : null;
    },
    async completeAuthentication(value) { return atomic(database, () => {
      const row = database.prepare(`SELECT a.id,a.username,a.active,a.created_at,c.expires_at FROM platform_login_challenges c
        JOIN platform_admins a ON a.username=c.username AND a.active=1 JOIN platform_passkeys p ON p.admin_id=a.id AND p.credential_id=?
        WHERE c.username=? AND c.token_hash=?`).get(value.credentialId,value.username,value.tokenHash) as (AdminRow & { expires_at: string }) | undefined;
      if (!row || Date.parse(row.expires_at) <= Date.parse(value.now)) return false;
      database.prepare('UPDATE platform_passkeys SET counter=? WHERE credential_id=?').run(value.newCounter,value.credentialId);
      database.prepare('DELETE FROM platform_login_challenges WHERE token_hash=?').run(value.tokenHash);
      database.prepare('INSERT INTO platform_sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)').run(value.session.tokenHash,row.id,value.session.expiresAt); return true;
    }); },
    async session(tokenHash) {
      const row = database.prepare(`SELECT a.id,a.username,a.active,a.created_at,s.expires_at FROM platform_sessions s
        JOIN platform_admins a ON a.id=s.admin_id WHERE s.token_hash=?`).get(tokenHash) as (AdminRow & { expires_at: string }) | undefined;
      return row ? { account: admin(row), expiresAt: row.expires_at } : null;
    },
    async removeSession(tokenHash) { database.prepare('DELETE FROM platform_sessions WHERE token_hash=?').run(tokenHash); },
  };
}
