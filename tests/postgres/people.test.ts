import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { migrate } from '../../src/database/migrate.ts';
import { postgresPeopleStore } from '../../src/database/people-store.ts';
import { postgresIdentityStore } from '../../src/database/identity-store.ts';
import { createIdentityService, hashPassword } from '../../src/identity/index.ts';
import { createPeopleService } from '../../src/people/index.ts';

// Explicit opt-in; this command creates and drops only its own temporary DB.
test('PostgreSQL: migração, sessão persistida, concorrência e isolamento de pessoas', async () => {
  const supplied = process.env.TEST_DATABASE_URL;
  assert.ok(supplied, 'Defina TEST_DATABASE_URL com acesso CREATEDB em PostgreSQL local de testes.');
  const url = new URL(supplied);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Use exclusivamente PostgreSQL local de testes.');
  assert.equal(process.env.ALLOW_TEMP_DATABASE, 'yes', 'Confirme ALLOW_TEMP_DATABASE=yes para criar e remover um banco temporário.');
  const admin = new Pool({ connectionString: supplied, connectionTimeoutMillis: 5000 });
  const databaseName = `gestao_test_${randomUUID().replaceAll('-', '')}`;
  let created = false;
  let pool: Pool | undefined;
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
    url.pathname = `/${databaseName}`;
    pool = new Pool({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
    await migrate(pool); await migrate(pool);
    const tenantA = randomUUID(), tenantB = randomUUID(), actorA = randomUUID(), actorB = randomUUID();
    const passwordHash = await hashPassword('senha-ficticia-longa');
    for (const [tenant, actor, code] of [[tenantA, actorA, 'escola-a'], [tenantB, actorB, 'escola-b']]) {
      await pool.query('INSERT INTO institution.tenants(id,code,name,created_at) VALUES($1,$2,$3,now())', [tenant, code, 'Instituição fictícia']);
      await pool.query(`INSERT INTO identity.accounts(id,tenant_id,username,account_context,role,password_hash)
        VALUES($1,$2,'operador','professional','TENANT_ADMIN',$3)`, [actor, tenant, passwordHash]);
    }
    const identityDeps = { store: postgresIdentityStore(pool), now: () => new Date(), newToken: () => randomBytes(32).toString('hex') };
    const identity = createIdentityService(identityDeps);
    const loginA = await identity.login({ institution: 'escola-a', username: 'operador', password: 'senha-ficticia-longa' });
    const loginB = await identity.login({ institution: 'escola-b', username: 'operador', password: 'senha-ficticia-longa' });
    const a = await createIdentityService(identityDeps).authenticate(loginA.token);
    const b = await identity.authenticate(loginB.token);
    const store = postgresPeopleStore(pool);
    const people = createPeopleService({ store, now: () => new Date(), newId: randomUUID });
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => people.create(a, {
      name: 'Pessoa Fictícia', cpf: '12345678901',
    })));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    for (const result of results) if (result.status === 'rejected') assert.equal(result.reason.code, 'CONFLICT');
    const person = await people.find(a, { cpf: '12345678901' });
    assert.ok(person);
    await assert.rejects(people.get(b, person.id), { code: 'NOT_FOUND' });
    assert.equal(await people.find(b, { cpf: '12345678901' }), null);
    assert.ok(await people.create(b, { name: 'Outra Pessoa Fictícia', cpf: '12345678901' }));
    const valid = await people.create({ ...a, accountId: actorB }, { name: 'Cadastro Fictício', institutionalId: 'ROLLBACK' });
    assert.equal((await people.find(a, { institutionalId: 'ROLLBACK' }))?.id, valid.id);
    await identity.logout(loginA.token);
    await assert.rejects(createIdentityService(identityDeps).authenticate(loginA.token), { code: 'UNAUTHENTICATED' });
  } finally {
    if (pool) await pool.end();
    if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
    await admin.end();
  }
});
