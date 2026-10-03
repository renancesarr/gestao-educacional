import { randomUUID } from 'node:crypto';
import { userInfo } from 'node:os';
import { databasePool, transaction } from '../src/database/connection.ts';
import { hashPassword } from '../src/identity/index.ts';

// Offline provisioning is an operator action; never expose this as a public route.
const code = process.env.INSTITUTION_CODE ?? '';
const name = process.env.INSTITUTION_NAME ?? '';
const username = process.env.ADMIN_USERNAME ?? '';
const password = process.env.ADMIN_PASSWORD ?? '';
if (!/^[a-z0-9][a-z0-9-]{1,99}$/.test(code) || !name.trim() || name.length > 200 ||
    !username.trim() || username.length > 100 || password.length < 12 || password.length > 256) {
  throw new Error('Defina INSTITUTION_CODE, INSTITUTION_NAME, ADMIN_USERNAME e ADMIN_PASSWORD (12–256 caracteres).');
}
const pool = databasePool();
try {
  const passwordHash = await hashPassword(password);
  await transaction(pool, async client => {
    const tenantId = randomUUID();
    const accountId = randomUUID();
    const at = new Date().toISOString();
    await client.query('INSERT INTO institution.tenants(id,code,name,created_at) VALUES ($1,$2,$3,$4)', [tenantId, code, name.trim(), at]);
    await client.query(`INSERT INTO identity.accounts(id,tenant_id,username,account_context,role,password_hash)
      VALUES ($1,$2,$3,'professional','TENANT_ADMIN',$4)`, [accountId, tenantId, username.trim(), passwordHash]);
    for (const action of ['institution.created', 'account.created']) {
      await client.query('INSERT INTO audit.events(id,tenant_id,system_actor,action,occurred_at) VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(), tenantId, `provisioning-cli:${userInfo().username}`, action, at]);
    }
  });
  console.log('Instituição e administrador institucional criados.');
} catch { console.error('Não foi possível provisionar. Verifique a conexão e se a instituição já existe. Nenhum registro foi substituído.'); process.exitCode = 1; }
finally { await pool.end(); }
