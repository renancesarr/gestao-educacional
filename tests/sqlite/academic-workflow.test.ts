import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createAcademicService } from '../../src/academic/index.ts';
import { createSqliteAcademicStore } from '../../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createHttpServer } from '../../src/http/server.ts';
import { createIdentityService } from '../../src/identity/index.ts';
import { createGlobalPeopleService, createPeopleService } from '../../src/people/index.ts';
import { createInstitutionOperationContextService, createSuperAdminService } from '../../src/super_admin/index.ts';
import { fixtureServices } from '../support/fixture.ts';

test('SQLite + HTTP: SUPER_ADMIN completa onboarding, cadastro, PPC e matrícula no tenant selecionado', async () => {
  const database = new DatabaseSync(':memory:');
  createSqliteIdentityStore(database);
  const peopleStore = createSqlitePeopleStore(database);
  const institutionStore = createSqliteInstitutionOnboardingStore(database);
  const academicStore = createSqliteAcademicStore(database);
  const auth = await fixtureServices();
  const now = () => new Date('2026-09-30T12:00:00.000Z');
  const newId = randomUUID;
  const globalPeople = createGlobalPeopleService({ store: peopleStore, now, newId });
  const services = {
    ...auth,
    identity: createIdentityService({ store: createSqliteIdentityStore(database), now, newToken: () => randomUUID() }),
    people: createPeopleService({ store: peopleStore, now, newId }),
    globalPeople,
    institutionOperationContext: createInstitutionOperationContextService({ targets: peopleStore }),
    superAdmin: createSuperAdminService({ store: institutionStore, now, newId }),
    globalAcademic: createAcademicService({ store: academicStore, people: globalPeople, now, newId }),
  };

  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-sqlite-flow' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const origin = 'http://127.0.0.1:4323';
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4323, '127.0.0.1', resolve); });
  const request = async (path: string, body: Record<string, unknown>) => fetch(`${origin}${path}`, {
    method: 'POST', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  try {
    const onboarding = await request('/api/platform/institutions', {
      code: 'escola-sqlite-flow', name: 'Escola de Teste Integrado', username: 'admin-inicial',
      password: 'senha-inicial-segura', educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }],
    });
    assert.equal(onboarding.status, 201);
    const institution = await onboarding.json() as { tenantId: string };
    const targetTenantId = institution.tenantId;

    const teacherResponse = await request('/api/platform/people', { targetTenantId, name: 'Professora Integrada', institutionalId: 'prof-001' });
    assert.equal(teacherResponse.status, 201);
    const teacher = await teacherResponse.json() as { id: string };
    const studentResponse = await request('/api/platform/people', { targetTenantId, name: 'Aluno Integrado', institutionalId: 'aluno-001' });
    assert.equal(studentResponse.status, 201);
    const student = await studentResponse.json() as { id: string };

    const collaboratorResponse = await request('/api/platform/collaborators', { targetTenantId, personId: teacher.id });
    assert.equal(collaboratorResponse.status, 201);
    const collaborator = await collaboratorResponse.json() as { id: string; active: boolean };
    assert.equal(collaborator.active, true);

    const courseResponse = await request('/api/platform/courses', { targetTenantId, name: 'Fundamental Integrado',
      code: 'fund-integrado', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
    assert.equal(courseResponse.status, 201);
    const course = await courseResponse.json() as { id: string; active: boolean };
    assert.equal(course.active, true);

    const subjectResponse = await request(`/api/platform/courses/${course.id}/subjects`, { targetTenantId,
      name: 'Matemática', code: 'mat-01', workloadHours: 60, collaboratorIds: [collaborator.id] });
    assert.equal(subjectResponse.status, 201);
    const subject = await subjectResponse.json() as { id: string; code: string; workloadHours: number };
    assert.deepEqual({ code: subject.code, workloadHours: subject.workloadHours }, { code: 'mat-01', workloadHours: 60 });

    const enrollmentResponse = await request('/api/platform/enrollments', { targetTenantId, personId: student.id, courseId: course.id });
    assert.equal(enrollmentResponse.status, 201);
    const enrollment = await enrollmentResponse.json() as { id: string; status: string; studentProfileId: string };
    assert.equal(enrollment.status, 'ativa');
    assert.ok(enrollment.studentProfileId);

    const detailResponse = await request('/api/platform/courses/detail', { targetTenantId, courseId: course.id });
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json() as { tenantId: string; subjects: { id: string; collaborators: { id: string }[] }[] };
    assert.equal(detail.tenantId, targetTenantId);
    assert.equal(detail.subjects[0]!.id, subject.id);
    assert.equal(detail.subjects[0]!.collaborators[0]!.id, collaborator.id);

    const enrollmentListResponse = await request('/api/platform/enrollments/search', { targetTenantId, courseId: course.id, status: 'ativa' });
    assert.equal(enrollmentListResponse.status, 200);
    assert.deepEqual((await enrollmentListResponse.json() as { id: string; studentProfileId: string }[])
      .map(value => ({ id: value.id, studentProfileId: value.studentProfileId })),
    [{ id: enrollment.id, studentProfileId: enrollment.studentProfileId }]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    database.close();
  }
});
