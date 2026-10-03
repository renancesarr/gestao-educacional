import type { DatabaseSync } from 'node:sqlite';
import type { Account, IdentityStore } from '../identity/index.ts';

interface AccountRow {
  id: string;
  tenant_id: string;
  code: string;
  institution_name: string;
  username: string;
  password_hash: string;
  role: Account['role'];
  active: number;
  account_context: Account['accountContext'];
}

const account = (row: AccountRow): Account => ({ id: row.id, tenantId: row.tenant_id,
  institution: row.code, institutionName: row.institution_name, username: row.username,
  passwordHash: row.password_hash, role: row.role, active: row.active === 1,
  accountContext: row.account_context });
const accountColumns = `a.id, a.tenant_id, t.code, t.name AS institution_name, a.username,
  a.password_hash, a.role, a.active, a.account_context`;

export function createSqliteIdentityStore(database: DatabaseSync): IdentityStore {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS institution_tenants (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS identity_accounts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      username TEXT NOT NULL,
      account_context TEXT NOT NULL CHECK (account_context IN ('professional', 'student', 'guardian')),
      role TEXT NOT NULL CHECK (role IN ('TENANT_ADMIN', 'ACADEMIC_SECRETARY', 'VIEWER')),
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, account_context, username)
    );
    CREATE TABLE IF NOT EXISTS identity_sessions (
      token_hash TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (tenant_id, account_id)
        REFERENCES identity_accounts(tenant_id, id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS identity_sessions_expiry ON identity_sessions(expires_at);
  `);

  return {
    async accountForLogin(institution, username) {
      const row = database.prepare(`SELECT ${accountColumns}
        FROM identity_accounts a JOIN institution_tenants t ON t.id = a.tenant_id
        WHERE t.code = ? AND a.username = ? AND a.account_context = 'professional'`)
        .get(institution, username) as AccountRow | undefined;
      return row ? account(row) : null;
    },
    async saveSession(session) {
      database.prepare(`INSERT INTO identity_sessions (token_hash, tenant_id, account_id, expires_at)
        VALUES (?, ?, ?, ?)`)
        .run(session.tokenHash, session.tenantId, session.accountId, session.expiresAt);
    },
    async session(tokenHash) {
      const row = database.prepare(`SELECT ${accountColumns}, s.expires_at
        FROM identity_sessions s
        JOIN identity_accounts a ON a.id = s.account_id AND a.tenant_id = s.tenant_id
        JOIN institution_tenants t ON t.id = a.tenant_id
        WHERE s.token_hash = ?`)
        .get(tokenHash) as (AccountRow & { expires_at: string }) | undefined;
      return row ? { account: account(row), expiresAt: row.expires_at } : null;
    },
    async removeSession(tokenHash) {
      database.prepare('DELETE FROM identity_sessions WHERE token_hash = ?').run(tokenHash);
    },
  };
}
