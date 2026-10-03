import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createGlobalPeopleService } from '../../src/people/index.ts';
import { createInstitutionOperationContextService, type PlatformPrincipal } from '../../src/super_admin/index.ts';

const tenantA = 'tenant-a';
const tenantB = 'tenant-b';
const superAdmin: PlatformPrincipal = {
  accountId: 'platform-admin-a', role: 'SUPER_ADMIN', permissions: ['platform:institution:create'],
};

function setup() {
  const database = new DatabaseSync(':memory:');
  createSqliteIdentityStore(database);
  createSqliteInstitutionOnboardingStore(database);
  const store = createSqlitePeopleStore(database);
  const tenants: readonly (readonly [string, string])[] = [[tenantA, 'escola-a'], [tenantB, 'escola-b']];
  for (const [id, code] of tenants) {
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(id, code, `Escola ${code}`, '2026-09-30T12:00:00.000Z');
  }
  let nextId = 100;
  const context = createInstitutionOperationContextService({
    targets: { exists: async tenantId => Boolean(database.prepare('SELECT 1 FROM institution_tenants WHERE id = ?').get(tenantId)) },
  });
  const people = createGlobalPeopleService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => `global-${++nextId}` });
  return { database, context, people };
}

test('SQLite grava pessoa global sem gerar eventos de auditoria', async () => {
  const { database, context, people } = setup();
  try {
    const targetA = await context.resolve(superAdmin, tenantA);
    const targetB = await context.resolve(superAdmin, tenantB);
    const person = await people.create(targetA, { name: 'Pessoa Fictícia', cpf: '12345678901' });

    assert.deepEqual(await people.find(targetA, { cpf: '12345678901' }), person);
    assert.equal(await people.find(targetB, { cpf: '12345678901' }), null);
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'person.created'").get() as { count: number }).count, 0);
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_platform_events WHERE action = 'person.created'").get() as { count: number }).count, 0);
  } finally {
    database.close();
  }
});

test('SQLite cria pessoa global mesmo quando uma auditoria legada falharia', async () => {
  const { database, context, people } = setup();
  try {
    const targetA = await context.resolve(superAdmin, tenantA);
    database.exec(`CREATE TRIGGER reject_platform_person_audit BEFORE INSERT ON audit_platform_events
      WHEN NEW.action = 'person.created' BEGIN SELECT RAISE(ABORT, 'simulated audit failure'); END`);

    await people.create(targetA, { name: 'Pessoa Fictícia', institutionalId: 'ROLLBACK-001' });
    assert.equal((database.prepare('SELECT count(*) AS count FROM people_people').get() as { count: number }).count, 1);
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'person.created'")
      .get() as { count: number }).count, 0);
    assert.equal((database.prepare("SELECT count(*) AS count FROM audit_platform_events WHERE action = 'person.created'")
      .get() as { count: number }).count, 0);
  } finally {
    database.close();
  }
});
