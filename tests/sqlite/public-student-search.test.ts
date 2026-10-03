import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteAcademicStore } from '../../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createSqlitePublicStudentSearchStore } from '../../src/database/sqlite-public-student-search-store.ts';
import { createAcademicService } from '../../src/academic/index.ts';
import { createGlobalPeopleService } from '../../src/people/index.ts';
import { createPublicStudentSearchService } from '../../src/people/public-student-search.ts';

test('SQLite public search returns only name, course, institution for active enrollments', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    const peopleStore = createSqlitePeopleStore(database);
    const tenantId = '00000000-0000-4000-8000-000000000010';
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-exemplo', 'Escola Exemplo', '2026-10-03T12:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)').run(tenantId, 'BASIC_FUNDAMENTAL');
    const people = createGlobalPeopleService({ store: peopleStore, now: () => new Date('2026-10-03T12:00:00Z'), newId: (() => { let id = 0; return () => `person-${++id}`; })() });
    const context = { tenantId, actorId: 'admin', actorRole: 'SUPER_ADMIN' as const };
    const student = await people.create(context, { name: 'Aluna Pública Teste', cpf: '52998224725', birthMunicipality: 'Recife', birthUf: 'PE' });
    const teacher = await people.create(context, { name: 'Docente Teste', institutionalId: 'docente-1' });
    let id = 0;
    const academic = createAcademicService({ store: createSqliteAcademicStore(database), people,
      now: () => new Date('2026-10-03T12:00:00Z'), newId: () => `academic-${++id}` });
    const course = await academic.createCourse(context, { name: 'Ensino Fundamental', code: 'fund-1', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
    const collaborator = await academic.createCollaborator(context, { personId: teacher.id });
    await academic.createSubject(context, course.id, { name: 'Matemática', code: 'mat-1', workloadHours: 40, collaboratorIds: [collaborator.id] });
    await academic.createEnrollment(context, { personId: student.id, courseId: course.id });
    const service = createPublicStudentSearchService({ store: createSqlitePublicStudentSearchStore(database) });

    const result = await service.search({ cpf: '529.982.247-25', birthUf: 'pe', course: 'fund' }, { page: 1, pageSize: 10 });

    assert.deepEqual(result.students, [{ name: 'Aluna Pública Teste', courseName: 'Ensino Fundamental', institutionName: 'Escola Exemplo' }]);
    assert.deepEqual(Object.keys(result.students[0]!).sort(), ['courseName', 'institutionName', 'name']);
    assert.equal((await service.search({ name: 'Aluna Pública', birthMunicipality: 'rec', birthUf: 'PE' }, { page: 1, pageSize: 10 })).total, 1);
    await academic.transitionEnrollment(context, course.id, (await academic.listEnrollments(context, course.id))[0]!.id, { status: 'trancada' });
    assert.equal((await service.search({ name: 'Aluna Pública Teste' }, { page: 1, pageSize: 10 })).total, 0);
  } finally { database.close(); }
});
