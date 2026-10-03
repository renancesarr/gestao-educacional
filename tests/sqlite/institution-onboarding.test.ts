import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createIdentityService } from '../../src/identity/index.ts';
import { createSuperAdminService } from '../../src/super_admin/index.ts';

const principal = { accountId: 'platform-admin-a', role: 'SUPER_ADMIN' as const,
  permissions: ['platform:institution:create'] };
const input = { code: 'escola-escopo', name: 'Escola do Escopo', username: 'admin-inicial',
  password: 'senha-inicial-segura', educationScope: [
    { level: 'BASIC' as const, stage: 'FUNDAMENTAL' as const },
    { level: 'BASIC' as const, stage: 'FUNDAMENTAL' as const, modality: 'EJA' as const },
    { level: 'HIGHER' as const, courseType: 'GRADUACAO' as const },
  ] };

function setup() {
  const database = new DatabaseSync(':memory:');
  createSqliteIdentityStore(database);
  createSqlitePeopleStore(database);
  const store = createSqliteInstitutionOnboardingStore(database);
  let nextId = 0;
  const onboarding = createSuperAdminService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => `generated-${++nextId}` });
  return { database, onboarding };
}

test('SUPER_ADMIN cria instituição, escopo e TENANT_ADMIN sem gerar auditoria', async () => {
  const { database, onboarding } = setup();
  try {
    const created = await onboarding.createInstitution(principal, input);
    assert.deepEqual(created, { tenantId: 'generated-1', code: 'escola-escopo', name: 'Escola do Escopo', username: 'admin-inicial' });

    const tenant = database.prepare('SELECT id, name FROM institution_tenants WHERE code = ?')
      .get('escola-escopo') as { id: string; name: string };
    const scope = database.prepare(`SELECT scope_code FROM institution_education_scope_items
      WHERE tenant_id = ? ORDER BY scope_code`).all(tenant.id) as { scope_code: string }[];
    assert.deepEqual(scope.map(item => item.scope_code), [
      'BASIC_FUNDAMENTAL', 'BASIC_FUNDAMENTAL_EJA', 'HIGHER_GRADUATION',
    ]);

    const identity = createIdentityService({ store: createSqliteIdentityStore(database),
      now: () => new Date('2026-09-30T12:00:00.000Z'), newToken: () => 'a'.repeat(64) });
    const login = await identity.login({ institution: 'escola-escopo', username: 'admin-inicial', password: input.password });
    assert.equal(login.principal.tenantId, tenant.id);
    assert.equal(login.principal.role, 'TENANT_ADMIN');

    assert.equal((database.prepare(`SELECT count(*) AS count FROM audit_events WHERE tenant_id = ?`).get(tenant.id) as { count: number }).count, 0);
    assert.equal((database.prepare(`SELECT count(*) AS count FROM audit_platform_events WHERE target_tenant_id = ?`).get(tenant.id) as { count: number }).count, 0);
  } finally {
    database.close();
  }
});

test('código institucional duplicado não substitui nome, escopo ou conta', async () => {
  const { database, onboarding } = setup();
  try {
    await onboarding.createInstitution(principal, input);
    await assert.rejects(onboarding.createInstitution(principal, { ...input, name: 'Nome substituto',
      username: 'outro-admin', educationScope: [{ level: 'BASIC', stage: 'MEDIO' }] }), { code: 'CONFLICT' });

    const tenant = database.prepare('SELECT id, name FROM institution_tenants WHERE code = ?')
      .get(input.code) as { id: string; name: string };
    assert.equal(tenant.name, input.name);
    assert.equal((database.prepare('SELECT count(*) AS count FROM institution_education_scope_items WHERE tenant_id = ?')
      .get(tenant.id) as { count: number }).count, 3);
    assert.equal((database.prepare('SELECT count(*) AS count FROM identity_accounts WHERE tenant_id = ?')
      .get(tenant.id) as { count: number }).count, 1);
    assert.equal((database.prepare('SELECT count(*) AS count FROM audit_events WHERE tenant_id = ?')
      .get(tenant.id) as { count: number }).count, 0);
  } finally {
    database.close();
  }
});

test('onboarding não depende de inserts em tabelas legadas de auditoria', async () => {
  const { database, onboarding } = setup();
  try {
    database.exec(`CREATE TRIGGER reject_platform_audit BEFORE INSERT ON audit_platform_events
      BEGIN SELECT RAISE(ABORT, 'simulated audit failure'); END`);
    const created = await onboarding.createInstitution(principal, { ...input, code: 'rollback-escola' });

    assert.equal((database.prepare('SELECT count(*) AS count FROM institution_tenants WHERE code = ?')
      .get('rollback-escola') as { count: number }).count, 1);
    assert.equal((database.prepare(`SELECT count(*) AS count FROM institution_education_scope_items
      WHERE tenant_id = 'generated-1'`).get() as { count: number }).count, 3);
    assert.equal((database.prepare(`SELECT count(*) AS count FROM identity_accounts
      WHERE tenant_id = 'generated-1'`).get() as { count: number }).count, 1);
    assert.equal((database.prepare(`SELECT count(*) AS count FROM audit_events
      WHERE tenant_id = 'generated-1'`).get() as { count: number }).count, 0);
    assert.equal(created.code, 'rollback-escola');
  } finally {
    database.close();
  }
});
