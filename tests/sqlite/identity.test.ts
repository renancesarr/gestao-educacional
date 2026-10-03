import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createIdentityService, hashPassword } from '../../src/identity/index.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';

const password = 'senha-ficticia-longa';
const fixedNow = new Date('2026-09-30T12:00:00Z');

async function setup() {
  const database = new DatabaseSync(':memory:');
  const store = createSqliteIdentityStore(database);
  const accountPassword = await hashPassword(password);
  database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
    .run('tenant-a', 'escola-a', 'Escola A', fixedNow.toISOString());
  database.prepare(`INSERT INTO identity_accounts
    (id, tenant_id, username, account_context, role, password_hash, active)
    VALUES (?, ?, ?, 'professional', 'ACADEMIC_SECRETARY', ?, 1)`)
    .run('account-a', 'tenant-a', 'secretaria', accountPassword);
  let nextToken = 0;
  const identity = createIdentityService({ store, now: () => fixedNow,
    newToken: () => String(++nextToken).padStart(64, 'a') });
  return { database, identity };
}

test('SQLite permite autenticar uma conta e retomar sua sessão vinculada ao tenant', async () => {
  const { database, identity } = await setup();
  try {
    const login = await identity.login({ institution: 'escola-a', username: 'secretaria', password });
    const principal = await identity.authenticate(login.token);
    assert.equal(principal.tenantId, 'tenant-a');
    assert.equal(principal.institutionName, 'Escola A');
    assert.equal(principal.username, 'secretaria');
  } finally {
    database.close();
  }
});

test('contas homônimas de tenants diferentes mantêm sessões e encerramento independentes', async () => {
  const { database, identity } = await setup();
  try {
    const secondTenantPassword = await hashPassword(password);
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run('tenant-b', 'escola-b', 'Escola B', fixedNow.toISOString());
    database.prepare(`INSERT INTO identity_accounts
      (id, tenant_id, username, account_context, role, password_hash, active)
      VALUES (?, ?, ?, 'professional', 'ACADEMIC_SECRETARY', ?, 1)`)
      .run('account-b', 'tenant-b', 'secretaria', secondTenantPassword);

    const loginA = await identity.login({ institution: 'escola-a', username: 'secretaria', password });
    const loginB = await identity.login({ institution: 'escola-b', username: 'secretaria', password });
    assert.equal(loginA.principal.tenantId, 'tenant-a');
    assert.equal(loginB.principal.tenantId, 'tenant-b');

    await identity.logout(loginA.token);
    await assert.rejects(identity.authenticate(loginA.token), { code: 'UNAUTHENTICATED' });
    assert.equal((await identity.authenticate(loginB.token)).tenantId, 'tenant-b');
  } finally {
    database.close();
  }
});
