import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteAcademicStore } from '../../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createSqliteRegulatoryActStore } from '../../src/database/sqlite-regulatory-act-store.ts';
import { createRegulatoryActsService } from '../../src/regulatory_acts/index.ts';

test('SQLite: preserva versões independentes e impede exclusão de ato utilizado', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    const academic = createSqliteAcademicStore(database);
    const tenantId = 'tenant-1';
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-teste', 'Escola de Teste', '2026-01-01T00:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run(tenantId, 'BASIC_FUNDAMENTAL');
    await academic.createCourse({ id: 'course-1', tenantId, name: 'Fundamental', code: 'fund-01',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' }, active: true, createdAt: '2026-01-01T00:00:00.000Z' });

    let generatedId = 0;
    const service = createRegulatoryActsService({ store: createSqliteRegulatoryActStore(database),
      courses: { belongsToTenant: async (targetTenant, courseId) => Boolean(await academic.getCourse(targetTenant, courseId)) },
      newId: () => `generated-${++generatedId}` });
    const context = { actorId: 'admin-1', tenantId, actorRole: 'SUPER_ADMIN' as const };
    const act = await service.create(context, { target: 'course', courseId: 'course-1',
      text: 'Ato vigente do curso.', status: 'ativo' });
    const firstVersion = act.currentVersionId;
    const revised = await service.update(context, act.id, { text: 'Ato suspenso do curso.', status: 'suspenso',
      preservePreviousVersion: true });
    assert.deepEqual(revised.versions.map(version => ({ text: version.text, status: version.status })), [
      { text: 'Ato vigente do curso.', status: 'ativo' }, { text: 'Ato suspenso do curso.', status: 'suspenso' },
    ]);
    assert.equal(revised.currentVersionId, 'generated-3');
    await service.registerUse(context, act.id, firstVersion, { operationType: 'historico', operationId: 'history-1' });
    await assert.rejects(() => service.delete(context, act.id), { code: 'CONFLICT' });
    assert.equal((await service.get(context, act.id)).versions.length, 2);
    assert.deepEqual(await service.list({ ...context, tenantId: 'other-tenant' }), []);
  } finally {
    database.close();
  }
});

test('SQLite: desfaz matrícula e vínculo de ato se registrar o uso falhar antes do commit', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    createSqlitePeopleStore(database);
    const academic = createSqliteAcademicStore(database);
    const tenantId = 'tenant-atomic';
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-atomic', 'Escola Atomicidade', '2026-01-01T00:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run(tenantId, 'BASIC_FUNDAMENTAL');
    database.prepare(`INSERT INTO people_people (id, tenant_id, name, cpf, institutional_id, created_at)
      VALUES (?, ?, ?, NULL, ?, ?)`).run('person-atomic', tenantId, 'Aluno Atomicidade', 'aluno-atomic', '2026-01-01T00:00:00.000Z');
    await academic.createCourse({ id: 'course-atomic', tenantId, name: 'Fundamental', code: 'fund-atomic',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' }, active: true, createdAt: '2026-01-01T00:00:00.000Z' });

    const actStore = createSqliteRegulatoryActStore(database);
    const actService = createRegulatoryActsService({ store: actStore,
      courses: { belongsToTenant: async () => true }, newId: () => 'version-atomic' });
    const context = { actorId: 'admin-atomic', tenantId, actorRole: 'SUPER_ADMIN' as const };
    const act = await actService.create(context, { target: 'institution', text: 'Ato institucional', status: 'ativo' });
    const enrollment = { id: 'enrollment-atomic', tenantId, personId: 'person-atomic', personName: 'Aluno Atomicidade',
      courseId: 'course-atomic', status: 'ativa' as const, regulatoryActs: [{ target: 'institution' as const,
        actId: act.id, versionId: act.currentVersionId, versionNumber: 1, text: act.text, status: act.status }],
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

    await assert.rejects(academic.createEnrollment(enrollment, 'profile-atomic', async enrollmentId => {
      await actService.registerUse(context, act.id, act.currentVersionId, { operationType: 'matricula', operationId: enrollmentId });
      throw new Error('Falha simulada antes do commit.');
    }), /Falha simulada antes do commit/);

    assert.equal((database.prepare('SELECT count(*) AS count FROM academic_enrollments').get() as { count: number }).count, 0);
    assert.equal((database.prepare('SELECT count(*) AS count FROM academic_student_profiles').get() as { count: number }).count, 0);
    assert.equal(await actStore.delete(tenantId, act.id), 'deleted');
  } finally {
    database.close();
  }
});
