import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createAcademicService } from '../../src/academic/index.ts';
import { createSqliteAcademicStore } from '../../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';

const tenantId = 'tenant-a';
const context = { actorId: 'platform-admin-a', tenantId, actorRole: 'SUPER_ADMIN' as const };

test('SQLite persiste curso compatível com o escopo e não reutiliza código no tenant', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-a', 'Escola A', '2026-09-30T12:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run(tenantId, 'BASIC_FUNDAMENTAL');
    let id = 0;
    const academic = createAcademicService({ store: createSqliteAcademicStore(database), people: { get: async () => { throw new Error('unexpected person lookup'); } },
      now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => `course-${++id}` });
    const course = await academic.createCourse(context, { name: 'Ensino Fundamental', code: 'fund-2026',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
    assert.equal(course.code, 'fund-2026');
    assert.equal((await academic.listCourses(context))[0]!.active, true);
    await assert.rejects(academic.createCourse(context, { name: 'Outro', code: 'fund-2026',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } }), { code: 'CONFLICT' });
    await assert.rejects(academic.createCourse(context, { name: 'Médio', code: 'medio-2026',
      educationScope: { level: 'BASIC', stage: 'MEDIO' } }), { code: 'INVALID_INPUT' });
  } finally { database.close(); }
});

test('SQLite persiste escopo técnico separado do ensino médio regular', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-tecnica', 'Instituto Técnico de Teste', '2026-09-30T12:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run(tenantId, 'TECHNICAL_MIDDLE');
    const academic = createAcademicService({ store: createSqliteAcademicStore(database), people: { get: async () => { throw new Error('unexpected person lookup'); } },
      now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'technical-course' });

    const course = await academic.createCourse(context, { name: 'Técnico em Administração', code: 'tec-adm-800',
      educationScope: { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' } });

    assert.deepEqual((await academic.listCourses(context))[0]!.educationScope,
      { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' });
    assert.deepEqual(await academic.listCourses(context, course.educationScope), [course]);
  } finally { database.close(); }
});

test('SQLite amplia escopo técnico preservando cursos ligados à tabela legada de escopos', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    database.exec(`CREATE TABLE institution_education_scope_items (
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
      scope_code TEXT NOT NULL CHECK (scope_code IN ('BASIC_FUNDAMENTAL','BASIC_FUNDAMENTAL_EJA','BASIC_MEDIO','BASIC_MEDIO_EJA','HIGHER_GRADUATION')),
      PRIMARY KEY (tenant_id, scope_code));
      CREATE TABLE academic_courses (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, scope_code TEXT NOT NULL,
        FOREIGN KEY (tenant_id, scope_code) REFERENCES institution_education_scope_items(tenant_id, scope_code));
      INSERT INTO institution_tenants(id,code,name,created_at) VALUES ('tenant-migrate','tenant-migrate','Escola','2026-10-03T12:00:00.000Z');
      INSERT INTO institution_education_scope_items(tenant_id,scope_code) VALUES ('tenant-migrate','BASIC_MEDIO');
      INSERT INTO academic_courses(id,tenant_id,scope_code) VALUES ('course-preserved','tenant-migrate','BASIC_MEDIO');`);

    createSqliteInstitutionOnboardingStore(database);

    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run('tenant-migrate', 'TECHNICAL_MIDDLE');
    assert.deepEqual({ ...(database.prepare('SELECT id,scope_code FROM academic_courses').get() as object) },
      { id: 'course-preserved', scope_code: 'BASIC_MEDIO' });
    assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { database.close(); }
});

test('SQLite mantém vínculo único e ativação do colaborador dentro do tenant', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    const people = createSqlitePeopleStore(database);
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'escola-a', 'Escola A', '2026-09-30T12:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)')
      .run(tenantId, 'BASIC_FUNDAMENTAL');
    database.prepare(`INSERT INTO people_people (id, tenant_id, name, cpf, institutional_id, created_at)
      VALUES (?, ?, ?, NULL, ?, ?)`).run('person-a', tenantId, 'Professora A', 'prof-a', '2026-09-30T11:00:00.000Z');
    let id = 0;
    const academic = createAcademicService({ store: createSqliteAcademicStore(database), people: {
      get: async (target, id) => {
        const person = await people.get(target.tenantId, id);
        if (!person) throw new Error('Pessoa não encontrada.');
        return person;
      },
    }, now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => `record-${++id}` });

    const collaborator = await academic.createCollaborator(context, { personId: 'person-a' });
    assert.equal(collaborator.active, true);
    await assert.rejects(academic.createCollaborator(context, { personId: 'person-a' }), { code: 'CONFLICT' });
    const inactive = await academic.updateCollaborator(context, collaborator.id, { active: false });
    assert.equal(inactive.active, false);
    assert.deepEqual((await academic.listCollaborators(context)).map(value => value.personName), ['Professora A']);
    await academic.updateCollaborator(context, collaborator.id, { active: true });
    const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-001', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
    const subject = await academic.createSubject(context, course.id, { name: 'Matemática', code: 'mat-01', workloadHours: 40, collaboratorIds: [collaborator.id] });
    assert.equal(subject.workloadHours, 40);
    assert.deepEqual((await academic.listSubjects(context, course.id)).map(value => value.code), ['mat-01']);
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run('tenant-b', 'escola-b', 'Escola B', '2026-09-30T12:00:00.000Z');
    assert.throws(() => database.prepare(`INSERT INTO academic_subjects
      (id, tenant_id, course_id, name, code, workload_hours, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'subject-cross-tenant', 'tenant-b', course.id, 'Matéria inválida', 'mat-02', 30, 1, '2026-09-30T12:00:00.000Z'));
    const enrollment = await academic.createEnrollment(context, { personId: 'person-a', courseId: course.id });
    assert.equal(enrollment.studentProfileId, 'record-6');
    assert.equal(enrollment.status, 'ativa');
    assert.deepEqual(await academic.listStudentCourses(context, ['person-a', 'person-from-other-tenant']), [
      { personId: 'person-a', courseId: course.id, courseName: 'Fundamental', courseCode: 'fund-001', status: 'ativa' },
    ]);
    await assert.rejects(academic.createEnrollment(context, { personId: 'person-a', courseId: course.id }), { code: 'CONFLICT' });
    const suspended = await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'trancada' });
    assert.equal(suspended.status, 'trancada');
    await assert.rejects(academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'jubilada' }).then(async () => {
      await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'ativa' });
    }));

    const assessment = await academic.createAssessment(context, course.id, subject.id, {
      title: 'Avaliação transferida', occursOn: '2026-03-10', maxPoints: 10,
    });
    assert.equal(assessment.createdAt, '2026-09-30T12:00:00.000Z');
    assert.deepEqual(await academic.listAssessments(context, course.id, subject.id), [assessment]);
    const grade = await academic.createGrade(context, { enrollmentId: enrollment.id, assessmentId: assessment.id, value: 8.5 });
    assert.deepEqual(await academic.listGrades(context, { assessmentId: assessment.id }), [grade]);
    await assert.rejects(academic.createGrade(context, { enrollmentId: enrollment.id, assessmentId: assessment.id, value: 10.1 }), { code: 'INVALID_INPUT' });
    await assert.rejects(academic.deleteAssessment(context, assessment.id), { code: 'CONFLICT' });
    await academic.updateGrade(context, grade.id, { value: 9 });
    const attendance = await academic.createAttendance(context, course.id, subject.id, {
      enrollmentId: enrollment.id, occursOn: '2026-03-11', status: 'presente',
    });
    assert.equal(attendance.createdAt, '2026-09-30T12:00:00.000Z');
    assert.deepEqual(await academic.listAttendance(context, { enrollmentId: enrollment.id }), [attendance]);
    await assert.rejects(academic.createAttendance(context, course.id, subject.id, {
      enrollmentId: enrollment.id, occursOn: '2026-03-11', status: 'ausente',
    }), { code: 'CONFLICT' });
    await academic.updateAttendance(context, attendance.id, { status: 'ausente' });
    await academic.deleteAttendance(context, attendance.id);
    await academic.deleteGrade(context, grade.id);
    await academic.deleteAssessment(context, assessment.id);
    assert.deepEqual(await academic.listAssessments(context, course.id, subject.id), []);
  } finally { database.close(); }
});
