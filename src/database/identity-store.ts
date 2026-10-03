import type { Pool } from 'pg';
import type { Account, IdentityStore } from '../identity/index.ts';

interface AccountRow {
  id: string; tenant_id: string; code: string; institution_name: string; username: string;
  password_hash: string; role: Account['role']; active: boolean; account_context: Account['accountContext'];
}
const columns = 'a.id, a.tenant_id, t.code, t.name AS institution_name, a.username, a.password_hash, a.role, a.active, a.account_context';
const account = (row: AccountRow): Account => ({ id: row.id, tenantId: row.tenant_id, institution: row.code,
  institutionName: row.institution_name, username: row.username, passwordHash: row.password_hash,
  role: row.role, active: row.active, accountContext: row.account_context });

export function postgresIdentityStore(pool: Pool): IdentityStore {
  return {
    async accountForLogin(institution, username) {
      const result = await pool.query<AccountRow>(`SELECT ${columns} FROM identity.accounts a
        JOIN institution.tenants t ON t.id=a.tenant_id
        WHERE t.code=$1 AND a.username=$2 AND a.account_context='professional'`, [institution, username]);
      return result.rows[0] ? account(result.rows[0]) : null;
    },
    async saveSession(value) {
      await pool.query(`INSERT INTO identity.sessions (token_hash, tenant_id, account_id, expires_at) VALUES ($1,$2,$3,$4)`,
        [value.tokenHash, value.tenantId, value.accountId, value.expiresAt]);
    },
    async session(tokenHash) {
      const result = await pool.query<AccountRow & { expires_at: Date }>(`SELECT ${columns}, s.expires_at
        FROM identity.sessions s JOIN identity.accounts a ON a.id=s.account_id AND a.tenant_id=s.tenant_id
        JOIN institution.tenants t ON t.id=a.tenant_id WHERE s.token_hash=$1`, [tokenHash]);
      const row = result.rows[0];
      return row ? { account: account(row), expiresAt: row.expires_at.toISOString() } : null;
    },
    async removeSession(tokenHash) { await pool.query('DELETE FROM identity.sessions WHERE token_hash=$1', [tokenHash]); },
  };
}
