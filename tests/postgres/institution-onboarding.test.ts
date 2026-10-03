import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool, type QueryResult } from 'pg';
import { migrate } from '../../src/database/migrate.ts';
import { postgresInstitutionOnboardingStore } from '../../src/database/institution-onboarding-store.ts';
import { createSuperAdminService } from '../../src/super_admin/index.ts';

test('PostgreSQL: escopo educacional, administrador e auditoria são atômicos no onboarding', async () => {
  const supplied = process.env.TEST_DATABASE_URL;
  assert.ok(supplied, 'Defina TEST_DATABASE_URL para PostgreSQL local de testes.');
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
    await migrate(pool);
    const actorId = randomUUID();
    await pool.query(`INSERT INTO identity.platform_admins(id,username,active,created_at) VALUES($1,'root-test',true,now())`, [actorId]);
    let id = 0;
    const service = createSuperAdminService({ store: postgresInstitutionOnboardingStore(pool),
      now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}` });
    const principal = { accountId: actorId, role: 'SUPER_ADMIN' as const, permissions: ['platform:institution:create'] };
    const educationScope = [
      { level: 'BASIC' as const, stage: 'FUNDAMENTAL' as const },
      { level: 'BASIC' as const, stage: 'FUNDAMENTAL' as const, modality: 'EJA' as const },
      { level: 'HIGHER' as const, courseType: 'GRADUACAO' as const },
    ];
    await service.createInstitution(principal, { code: 'escola-escopo', name: 'Escola do Escopo', username: 'admin',
      password: 'senha-inicial-segura', educationScope });
    const tenant = await pool.query<{ id: string; name: string }>('SELECT id,name FROM institution.tenants WHERE code=$1', ['escola-escopo']);
    assert.equal(tenant.rowCount, 1);
    const tenantId = tenant.rows[0]!.id;
    const scope = await pool.query<{ scope_code: string }>('SELECT scope_code FROM institution.education_scope_items WHERE tenant_id=$1 ORDER BY scope_code', [tenantId]);
    assert.deepEqual(scope.rows.map(row => row.scope_code), ['BASIC_FUNDAMENTAL', 'BASIC_FUNDAMENTAL_EJA', 'HIGHER_GRADUATION']);
    const account = await pool.query<{ password_hash: string }>(`SELECT password_hash FROM identity.accounts WHERE tenant_id=$1 AND username='admin'`, [tenantId]);
    assert.equal(account.rowCount, 1); assert.notEqual(account.rows[0]!.password_hash, 'senha-inicial-segura');
    const platformEvent = await pool.query<{ actor_admin_id: string; target_tenant_id: string }>(`SELECT actor_admin_id,target_tenant_id
      FROM audit.platform_events WHERE action='institution.created' AND target_tenant_id=$1`, [tenantId]);
    assert.deepEqual(platformEvent.rows[0], { actor_admin_id: actorId, target_tenant_id: tenantId });
    assert.equal((await pool.query('SELECT 1 FROM audit.events WHERE tenant_id=$1', [tenantId])).rowCount, 2);

    await assert.rejects(service.createInstitution(principal, { code: 'escola-escopo', name: 'Não sobrescrever', username: 'outro',
      password: 'outra-senha-longa-segura', educationScope: [{ level: 'BASIC', stage: 'MEDIO' }] }), { code: 'CONFLICT' });
    assert.equal((await pool.query('SELECT name FROM institution.tenants WHERE id=$1', [tenantId])).rows[0]!.name, 'Escola do Escopo');
    assert.equal((await pool.query('SELECT count(*) FROM institution.education_scope_items WHERE tenant_id=$1', [tenantId])).rows[0]!.count, '3');

    const withoutPlatformActor = { ...principal, accountId: randomUUID() };
    await assert.rejects(service.createInstitution(withoutPlatformActor, { code: 'rollback-escola', name: 'Não deve persistir', username: 'admin',
      password: 'senha-inicial-segura', educationScope: [{ level: 'BASIC', stage: 'MEDIO' }] }), { code: 'UNAVAILABLE' });
    const absent = `NOT IN (SELECT id FROM institution.tenants WHERE code='escola-escopo')`;
    const rollbackChecks = [
      ['institution.tenants', `code='rollback-escola'`],
      ['institution.education_scope_items', `tenant_id ${absent}`],
      ['identity.accounts', `tenant_id ${absent}`],
      ['audit.events', `tenant_id ${absent}`],
      ['audit.platform_events', `target_tenant_id ${absent}`],
    ] as const;
    for (const [table, predicate] of rollbackChecks) {
      const result: QueryResult<{ count: string }> = await pool.query<{ count: string }>(`SELECT count(*) FROM ${table} WHERE ${predicate}`);
      assert.equal(result.rows[0]!.count, '0', `registro parcial em ${table}`);
    }
  } finally {
    if (pool) await pool.end();
    if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
    await admin.end();
  }
});
