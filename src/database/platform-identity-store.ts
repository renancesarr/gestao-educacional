import type { Pool } from 'pg';
import { transaction } from './connection.ts';
import type { PlatformAdminAccount, PlatformActivation, PlatformIdentityStore, PlatformPasskey, PlatformSession } from '../identity/index.ts';

interface PlatformAdminRow { id: string; username: string; active: boolean; created_at: Date }
interface ActivationRow { admin_id: string; code_hash: string; expires_at: Date; used_at: Date | null }
interface PasskeyRow { credential_id: string; public_key: Buffer; counter: string; transports: string[] }
const admin = (row: PlatformAdminRow): PlatformAdminAccount => ({ id: row.id, username: row.username,
  active: row.active, createdAt: row.created_at.toISOString() });
const activation = (row: ActivationRow): PlatformActivation => ({ adminId: row.admin_id,
  codeHash: row.code_hash, expiresAt: row.expires_at.toISOString(), usedAt: row.used_at?.toISOString() ?? null });
const passkey = (row: PasskeyRow): PlatformPasskey => ({ id: row.credential_id, publicKey: new Uint8Array(row.public_key),
  counter: Number(row.counter), transports: row.transports });

export function postgresPlatformIdentityStore(pool: Pool): PlatformIdentityStore {
  return {
    async recoverAdmin(value) {
      return transaction(pool, async client => {
        const result = await client.query<{id:string}>(`UPDATE identity.platform_admins SET active=false
          WHERE username=$1 RETURNING id`, [value.username]);
        const row = result.rows[0];
        if (!row) return false;
        await client.query('DELETE FROM identity.platform_passkeys WHERE admin_id=$1', [row.id]);
        await client.query('DELETE FROM identity.platform_sessions WHERE admin_id=$1', [row.id]);
        await client.query('DELETE FROM identity.platform_registration_challenges WHERE admin_id=$1', [row.id]);
        await client.query('DELETE FROM identity.platform_login_challenges WHERE username=$1', [value.username]);
        await client.query(`INSERT INTO identity.platform_activation_codes(admin_id,code_hash,expires_at,used_at)
          VALUES ($1,$2,$3,NULL) ON CONFLICT (admin_id) DO UPDATE SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,used_at=NULL`,
          [row.id,value.codeHash,value.expiresAt]);
        return true;
      });
    },
    async createFirstAdmin(value) {
      return transaction(pool, async client => {
        await client.query('SELECT pg_advisory_xact_lock(73214902)');
        const existing = await client.query('SELECT 1 FROM identity.platform_admins LIMIT 1');
        if (existing.rowCount) return 'already-exists';
        await client.query(`INSERT INTO identity.platform_admins(id,username,active,created_at) VALUES ($1,$2,false,$3)`,
          [value.account.id, value.account.username, value.account.createdAt]);
        await client.query(`INSERT INTO identity.platform_activation_codes(admin_id,code_hash,expires_at) VALUES ($1,$2,$3)`,
          [value.activation.adminId, value.activation.codeHash, value.activation.expiresAt]);
        return 'created';
      });
    },
    async pendingActivation(username, codeHash) {
      const result = await pool.query<PlatformAdminRow & ActivationRow>(`SELECT a.id,a.username,a.active,a.created_at,
        c.admin_id,c.code_hash,c.expires_at,c.used_at FROM identity.platform_admins a
        JOIN identity.platform_activation_codes c ON c.admin_id=a.id
        WHERE a.username=$1 AND c.code_hash=$2`, [username, codeHash]);
      const row = result.rows[0];
      return row ? { account: admin(row), activation: activation(row) } : null;
    },
    async saveRegistrationChallenge(value) {
      await transaction(pool, async client => {
        await client.query('DELETE FROM identity.platform_registration_challenges WHERE admin_id=$1', [value.adminId]);
        await client.query(`INSERT INTO identity.platform_registration_challenges(token_hash,admin_id,activation_code_hash,challenge,expires_at)
          VALUES ($1,$2,$3,$4,$5)`, [value.tokenHash, value.adminId, value.activationHash, value.challenge, value.expiresAt]);
      });
    },
    async registrationForActivation(username, tokenHash) {
      const result = await pool.query<PlatformAdminRow & ActivationRow & { challenge: string; challenge_expires_at: Date }>(`SELECT
        a.id,a.username,a.active,a.created_at,c.admin_id,c.code_hash,c.expires_at,c.used_at,r.challenge,r.expires_at AS challenge_expires_at
        FROM identity.platform_registration_challenges r
        JOIN identity.platform_admins a ON a.id=r.admin_id
        JOIN identity.platform_activation_codes c ON c.admin_id=a.id AND c.code_hash=r.activation_code_hash
        WHERE a.username=$1 AND r.token_hash=$2`, [username, tokenHash]);
      const row = result.rows[0];
      return row ? { account: admin(row), activation: activation(row), challenge: row.challenge,
        challengeExpiresAt: row.challenge_expires_at.toISOString() } : null;
    },
    async activateWithPasskey(value) {
      return transaction(pool, async client => {
        const result = await client.query<PlatformAdminRow & ActivationRow & { challenge_expires_at: Date }>(`SELECT
          a.id,a.username,a.active,a.created_at,c.admin_id,c.code_hash,c.expires_at,c.used_at,r.expires_at AS challenge_expires_at
          FROM identity.platform_registration_challenges r
          JOIN identity.platform_admins a ON a.id=r.admin_id
          JOIN identity.platform_activation_codes c ON c.admin_id=a.id AND c.code_hash=r.activation_code_hash
          WHERE a.username=$1 AND r.token_hash=$2 FOR UPDATE OF a,c,r`, [value.username, value.tokenHash]);
        const row = result.rows[0];
        if (!row || row.active || row.used_at || row.expires_at.getTime() <= Date.parse(value.now) ||
            row.challenge_expires_at.getTime() <= Date.parse(value.now)) return false;
        await client.query('UPDATE identity.platform_admins SET active=true WHERE id=$1', [row.id]);
        await client.query('UPDATE identity.platform_activation_codes SET used_at=$2 WHERE admin_id=$1', [row.id, value.now]);
        await client.query(`INSERT INTO identity.platform_passkeys(credential_id,admin_id,public_key,counter,transports,created_at)
          VALUES ($1,$2,$3,$4,$5,$6)`, [value.passkey.id, row.id, Buffer.from(value.passkey.publicKey), value.passkey.counter,
          value.passkey.transports ?? [], value.now]);
        await client.query('DELETE FROM identity.platform_registration_challenges WHERE token_hash=$1', [value.tokenHash]);
        await client.query('INSERT INTO identity.platform_sessions(token_hash,admin_id,expires_at) VALUES ($1,$2,$3)',
          [value.session.tokenHash, value.session.adminId, value.session.expiresAt]);
        return true;
      });
    },
    async saveAuthenticationChallenge(value) {
      await transaction(pool, async client => {
        await client.query('DELETE FROM identity.platform_login_challenges WHERE username=$1', [value.username]);
        await client.query(`INSERT INTO identity.platform_login_challenges(token_hash,username,challenge,expires_at)
          VALUES ($1,$2,$3,$4)`, [value.tokenHash, value.username, value.challenge, value.expiresAt]);
      });
    },
    async authenticationForLogin(username, tokenHash, credentialId) {
      const result = await pool.query<PlatformAdminRow & PasskeyRow & { challenge: string; expires_at: Date }>(`SELECT
        a.id,a.username,a.active,a.created_at,p.credential_id,p.public_key,p.counter,p.transports,c.challenge,c.expires_at
        FROM identity.platform_login_challenges c
        JOIN identity.platform_admins a ON a.username=c.username AND a.active=true
        JOIN identity.platform_passkeys p ON p.admin_id=a.id
        WHERE c.username=$1 AND c.token_hash=$2 AND p.credential_id=$3`, [username, tokenHash, credentialId]);
      const row = result.rows[0];
      return row ? { account: admin(row), passkey: passkey(row), challenge: row.challenge,
        expiresAt: row.expires_at.toISOString() } : null;
    },
    async completeAuthentication(value) {
      return transaction(pool, async client => {
        const result = await client.query<PlatformAdminRow & { expires_at: Date }>(`SELECT
          a.id,a.username,a.active,a.created_at,c.expires_at FROM identity.platform_login_challenges c
          JOIN identity.platform_admins a ON a.username=c.username AND a.active=true
          JOIN identity.platform_passkeys p ON p.admin_id=a.id AND p.credential_id=$3
          WHERE c.username=$1 AND c.token_hash=$2 FOR UPDATE OF a,p,c`, [value.username, value.tokenHash, value.credentialId]);
        const row = result.rows[0];
        if (!row || row.expires_at.getTime() <= Date.parse(value.now)) return false;
        await client.query('UPDATE identity.platform_passkeys SET counter=$2 WHERE credential_id=$1', [value.credentialId, value.newCounter]);
        await client.query('DELETE FROM identity.platform_login_challenges WHERE token_hash=$1', [value.tokenHash]);
        await client.query('INSERT INTO identity.platform_sessions(token_hash,admin_id,expires_at) VALUES ($1,$2,$3)',
          [value.session.tokenHash, row.id, value.session.expiresAt]);
        return true;
      });
    },
    async session(tokenHash) {
      const result = await pool.query<PlatformAdminRow & { expires_at: Date }>(`SELECT a.id,a.username,a.active,a.created_at,s.expires_at
        FROM identity.platform_sessions s JOIN identity.platform_admins a ON a.id=s.admin_id
        WHERE s.token_hash=$1`, [tokenHash]);
      const row = result.rows[0];
      return row ? { account: admin(row), expiresAt: row.expires_at.toISOString() } : null;
    },
    async removeSession(tokenHash) { await pool.query('DELETE FROM identity.platform_sessions WHERE token_hash=$1', [tokenHash]); },
  };
}
