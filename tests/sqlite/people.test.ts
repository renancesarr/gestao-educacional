import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createPeopleService } from '../../src/people/index.ts';
import type { Principal } from '../../src/identity/index.ts';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';
const actorA = 'account-a';
const actorB = 'account-b';
const principalA: Principal = { accountId: actorA, tenantId: tenantA,
  accountContext: 'professional', permissions: ['people:create', 'people:read'] };
const principalB: Principal = { accountId: actorB, tenantId: tenantB,
  accountContext: 'professional', permissions: ['people:create', 'people:read'] };

function setup() {
  const database = new DatabaseSync(':memory:');
  createSqliteIdentityStore(database);
  const store = createSqlitePeopleStore(database);
  database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
    .run(tenantA, 'escola-a', 'Escola A', '2026-09-30T12:00:00.000Z');
  database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
    .run(tenantB, 'escola-b', 'Escola B', '2026-09-30T12:00:00.000Z');
  const insertAccount = database.prepare(`INSERT INTO identity_accounts
    (id, tenant_id, username, account_context, role, password_hash, active)
    VALUES (?, ?, 'secretaria', 'professional', 'ACADEMIC_SECRETARY', 'unused-test-hash', 1)`);
  insertAccount.run(actorA, tenantA);
  insertAccount.run(actorB, tenantB);
  let nextId = 0;
  const people = createPeopleService({ store, now: () => new Date('2026-09-30T12:00:00Z'),
    newId: () => `person-${++nextId}` });
  return { database, people };
}

test('pessoa criada pode ser consultada em SQLite sem registrar auditoria', async () => {
  const { database, people } = setup();
  try {
    const created = await people.create(principalA, { name: 'Pessoa Fictícia', cpf: '12345678901' });
    assert.deepEqual(await people.get(principalA, created.id), created);
    assert.deepEqual(await people.find(principalA, { cpf: '12345678901' }), created);
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'person.created'").get() as { count: number }).count, 0);
  } finally {
    database.close();
  }
});

test('identificador institucional duplicado no tenant retorna conflito sem substituir o cadastro', async () => {
  const { database, people } = setup();
  try {
    const original = await people.create(principalA, {
      name: 'Cadastro Original', cpf: '12345678901', institutionalId: 'ALUNO-001',
    });
    await assert.rejects(people.create(principalA, {
      name: 'Cadastro Diferente', cpf: '98765432109', institutionalId: 'ALUNO-001',
    }), { code: 'CONFLICT' });
    assert.deepEqual(await people.find(principalA, { institutionalId: 'ALUNO-001' }), original);
    assert.equal(await people.find(principalA, { cpf: '98765432109' }), null);
  } finally {
    database.close();
  }
});

test('identificadores iguais permanecem independentes entre tenants e consultas não cruzam instituições', async () => {
  const { database, people } = setup();
  try {
    const personA = await people.create(principalA, { name: 'Pessoa da Escola A', cpf: '12345678901' });
    const personB = await people.create(principalB, { name: 'Pessoa da Escola B', cpf: '12345678901' });
    assert.equal(personA.id === personB.id, false);
    assert.deepEqual(await people.find(principalA, { cpf: '12345678901' }), personA);
    assert.deepEqual(await people.find(principalB, { cpf: '12345678901' }), personB);
    await assert.rejects(people.get(principalB, personA.id), { code: 'NOT_FOUND' });
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'person.created'").get() as { count: number }).count, 0);
  } finally {
    database.close();
  }
});

test('criação de pessoa não depende da infraestrutura de auditoria', async () => {
  const { database, people } = setup();
  try {
    const created = await people.create({ ...principalA, accountId: actorB }, {
      name: 'Pessoa sem auditoria', institutionalId: 'ROLLBACK-001',
    });
    assert.equal((await people.find(principalA, { institutionalId: 'ROLLBACK-001' }))?.id, created.id);
  } finally {
    database.close();
  }
});

test('SQLite combina filtros pessoais e preserva tenant ao paginar a busca de pessoas', async () => {
  const { database, people } = setup();
  try {
    await people.create(principalA, { name: 'Ana da Silva', cpf: '12345678901', birthMunicipality: 'Porto Velho', birthUf: 'ro' });
    await people.create(principalA, { name: 'Ana Maria', cpf: '98765432109', birthMunicipality: 'Porto Velho', birthUf: 'RO' });
    await people.create(principalB, { name: 'Ana da Escola B', cpf: '11144477735', birthMunicipality: 'Porto Velho', birthUf: 'RO' });

    const page = await people.search(principalA, { name: 'Ana', birthMunicipality: 'Porto Velho', birthUf: 'ro' }, { page: 2, pageSize: 1 });

    assert.equal(page.total, 2);
    assert.equal(page.totalPages, 2);
    assert.equal(page.people[0]?.name, 'Ana da Silva');
    assert.equal(page.people[0]?.birthUf, 'RO');
  } finally {
    database.close();
  }
});
