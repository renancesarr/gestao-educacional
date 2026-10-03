import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAcademicService } from '../../src/academic/index.ts';
import { MemoryAcademicStore } from '../support/memory-academic-store.ts';

const context = {
  actorId: '00000000-0000-4000-8000-000000000001',
  tenantId: '00000000-0000-4000-8000-000000000010',
  actorRole: 'SUPER_ADMIN' as const,
};
const noPeople: { get: () => Promise<never> } = { get: async () => { throw new Error('unexpected person lookup'); } };

test('SUPER_ADMIN cria curso compatível com o escopo da instituição-alvo', async () => {
  let id = 99;
  const store = new MemoryAcademicStore({
    tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }],
  });
  const academic = createAcademicService({
    store,
    people: noPeople,
    now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
  });

  const course = await academic.createCourse(context, {
    name: 'Ensino Fundamental Regular',
    code: 'fund-2026',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' },
  });
  assert.deepEqual(course, {
    id: '00000000-0000-4000-8000-000000000100',
    tenantId: context.tenantId,
    name: 'Ensino Fundamental Regular',
    code: 'fund-2026',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' },
    active: true,
    createdAt: '2026-09-30T12:00:00.000Z',
  });
});

test('SUPER_ADMIN consulta cursos e matrículas de IDs de aluno somente no tenant-alvo', async () => {
  const teacher = { id: 'teacher-search', tenantId: context.tenantId, name: 'Professora' };
  const student = { id: 'student-search', tenantId: context.tenantId, name: 'Aluna' };
  let sequence = 0;
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: { get: async (_context, id) => {
      const person = [teacher, student].find(value => value.id === id);
      if (!person) throw new Error('Person is outside the fixture.');
      return person;
    } }, now: () => new Date('2026-10-03T12:00:00.000Z'), newId: () => `academic-search-${++sequence}` });
  const course = await academic.createCourse(context, { name: 'Ensino Fundamental', code: 'fund-search',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const collaborator = await academic.createCollaborator(context, { personId: teacher.id });
  await academic.createSubject(context, course.id, { name: 'Matemática', code: 'mat-search', workloadHours: 40,
    collaboratorIds: [collaborator.id] });
  await academic.createEnrollment(context, { personId: student.id, courseId: course.id });

  const result = await academic.listStudentCourses(context, [student.id, 'unknown-student']);

  assert.deepEqual(result, [{ personId: student.id, courseId: course.id, courseName: 'Ensino Fundamental',
    courseCode: 'fund-search', status: 'ativa' }]);
  assert.deepEqual(await academic.listStudentCourses({ ...context, tenantId: 'other-tenant' }, [student.id]), []);
});

test('SUPER_ADMIN cria curso técnico de nível médio apenas em instituição com escopo técnico', async () => {
  const technicalScope = { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' } as const;
  const store = new MemoryAcademicStore({ tenantId: context.tenantId, educationScope: [technicalScope] });
  const academic = createAcademicService({ store, people: noPeople, now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => '00000000-0000-4000-8000-000000000801' });

  const course = await academic.createCourse(context, { name: 'Técnico em Administração', code: 'tec-adm-800', educationScope: technicalScope });

  assert.deepEqual(course.educationScope, technicalScope);
  const withoutTechnicalScope = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'MEDIO' }] }), people: noPeople,
    now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => '00000000-0000-4000-8000-000000000802' });
  await assert.rejects(withoutTechnicalScope.createCourse(context, { name: 'Técnico em Administração', code: 'tec-adm-800', educationScope: technicalScope }),
    { code: 'INVALID_INPUT' });
});

test('SUPER_ADMIN consulta catálogo do tenant-alvo em ordem de código e filtra por escopo', async () => {
  let id = 0;
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }, { level: 'HIGHER', courseType: 'GRADUACAO' }] }),
  people: noPeople,
  now: () => new Date('2026-09-30T12:00:00.000Z'),
  newId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}` });
  await academic.createCourse(context, { name: 'Graduação', code: 'grad-001', educationScope: { level: 'HIGHER', courseType: 'GRADUACAO' } });
  const fundamental = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-001', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });

  assert.deepEqual((await academic.listCourses(context)).map(course => course.code), ['fund-001', 'grad-001']);
  assert.deepEqual(await academic.listCourses(context, { level: 'BASIC', stage: 'FUNDAMENTAL' }), [fundamental]);
});

test('SUPER_ADMIN renomeia curso da instituição-alvo sem mudar sua identidade acadêmica', async () => {
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), now: () => new Date('2026-09-30T12:00:00.000Z'),
  people: noPeople,
  newId: () => '00000000-0000-4000-8000-000000000201' });
  const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-001',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });

  const renamed = await academic.updateCourse(context, course.id, { name: 'Ensino Fundamental' });

  assert.deepEqual(renamed, { ...course, name: 'Ensino Fundamental' });
});

test('SUPER_ADMIN vincula como colaboradora uma pessoa existente na instituição-alvo', async () => {
  const personId = '00000000-0000-4000-8000-000000000401';
  const person = { id: personId, tenantId: context.tenantId, name: 'Professora Fictícia', cpf: null,
    institutionalId: 'prof-01', createdAt: '2026-09-30T11:00:00.000Z' };
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: { get: async (target: typeof context, id: string) => {
      if (target.tenantId === person.tenantId && id === person.id) return person;
      throw new Error('person not found');
    } },
    now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => '00000000-0000-4000-8000-000000000301' });

  const collaborator = await academic.createCollaborator(context, { personId });

  assert.deepEqual(collaborator, { id: '00000000-0000-4000-8000-000000000301', tenantId: context.tenantId,
    personId, personName: 'Professora Fictícia', active: true, createdAt: '2026-09-30T12:00:00.000Z' });
  await assert.rejects(academic.createCollaborator(context, { personId }), { code: 'CONFLICT' });
  const inactive = await academic.updateCollaborator(context, collaborator.id, { active: false });
  assert.equal(inactive.active, false);
  assert.equal((await academic.listCollaborators(context))[0]!.id, collaborator.id);
  assert.equal((await academic.listCollaborators(context))[0]!.active, false);
});

test('SUPER_ADMIN registra avaliação retroativa sem retrodatá-la tecnicamente', async () => {
  let nextId = 600;
  const teacher = { id: 'person-teacher-retro', tenantId: context.tenantId, name: 'Docente Fictícia' };
  const student = { id: 'person-student-retro', tenantId: context.tenantId, name: 'Estudante Fictício' };
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: { get: async (_context, personId) => {
      const person = [teacher, student].find(value => value.id === personId);
      if (!person) throw new Error('Pessoa não encontrada.');
      return person;
    } }, now: () => new Date('2026-10-03T12:00:00.000Z'),
    newId: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}` });
  const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-retro',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const collaborator = await academic.createCollaborator(context, { personId: teacher.id });
  const subject = await academic.createSubject(context, course.id, { name: 'História', code: 'hist-retro',
    workloadHours: 40, collaboratorIds: [collaborator.id] });

  const assessment = await academic.createAssessment(context, course.id, subject.id, {
    title: 'Avaliação transferida', occursOn: '2026-03-12', maxPoints: 10,
  });

  assert.equal(assessment.occursOn, '2026-03-12');
  assert.equal(assessment.createdAt, '2026-10-03T12:00:00.000Z');
  assert.deepEqual(await academic.listAssessments(context, course.id, subject.id), [assessment]);

  const enrollment = await academic.createEnrollment(context, { personId: student.id, courseId: course.id });
  const grade = await academic.createGrade(context, { enrollmentId: enrollment.id, assessmentId: assessment.id, value: 8 });
  assert.equal(grade.value, 8);
  assert.equal(grade.createdAt, '2026-10-03T12:00:00.000Z');
  assert.deepEqual(await academic.listGrades(context, { assessmentId: assessment.id }), [grade]);
  await assert.rejects(academic.updateAssessment(context, assessment.id, { maxPoints: 7 }), { code: 'CONFLICT' });
  const updatedGrade = await academic.updateGrade(context, grade.id, { value: 9 });
  assert.equal(updatedGrade.value, 9);
  await assert.rejects(academic.createGrade(context, { enrollmentId: enrollment.id, assessmentId: assessment.id, value: 7 }), { code: 'CONFLICT' });
  await assert.rejects(academic.deleteAssessment(context, assessment.id), { code: 'CONFLICT' });

  const attendance = await academic.createAttendance(context, course.id, subject.id, {
    enrollmentId: enrollment.id, occursOn: '2026-03-13', status: 'presente',
  });
  assert.equal(attendance.createdAt, '2026-10-03T12:00:00.000Z');
  assert.deepEqual(await academic.listAttendance(context, { enrollmentId: enrollment.id }), [attendance]);
  const updatedAttendance = await academic.updateAttendance(context, attendance.id, { status: 'ausente' });
  assert.equal(updatedAttendance.status, 'ausente');
  await assert.rejects(academic.createAttendance(context, course.id, subject.id, {
    enrollmentId: enrollment.id, occursOn: '2026-03-13', status: 'presente',
  }), { code: 'CONFLICT' });
  await academic.deleteAttendance(context, attendance.id);
  await academic.deleteGrade(context, grade.id);
  await academic.deleteAssessment(context, assessment.id);
  assert.deepEqual(await academic.listAssessments(context, course.id, subject.id), []);
});

test('SUPER_ADMIN cria matéria no PPC com carga horária e colaborador ativo', async () => {
  let nextId = 500;
  const person = { id: 'person-prof', tenantId: context.tenantId, name: 'Professor A' };
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }),
  people: { get: async () => person }, now: () => new Date('2026-09-30T12:00:00.000Z'),
  newId: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}` });
  const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-002', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const collaborator = await academic.createCollaborator(context, { personId: person.id });

  const subject = await academic.createSubject(context, course.id, { name: 'Matemática', code: 'mat-01', workloadHours: 40, collaboratorIds: [collaborator.id] });

  assert.equal(subject.name, 'Matemática');
  assert.equal(subject.code, 'mat-01');
  assert.equal(subject.workloadHours, 40);
  assert.equal(subject.active, true);
  assert.deepEqual(subject.collaborators.map(value => value.personName), ['Professor A']);
  const updated = await academic.updateSubject(context, course.id, subject.id, {
    name: 'Matemática Básica', workloadHours: 60, active: false, collaboratorIds: [collaborator.id],
  });
  assert.equal(updated.code, 'mat-01');
  assert.equal(updated.name, 'Matemática Básica');
  assert.equal(updated.workloadHours, 60);
  assert.equal(updated.active, false);
});

test('SUPER_ADMIN matricula pessoa em curso elegível e recebe perfil acadêmico', async () => {
  let nextId = 700;
  const person = { id: 'person-student', tenantId: context.tenantId, name: 'Aluna Fictícia' };
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: { get: async () => person },
  now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}` });
  const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-003', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const collaborator = await academic.createCollaborator(context, { personId: person.id });
  await academic.createSubject(context, course.id, { name: 'Matemática', code: 'mat-01', workloadHours: 40, collaboratorIds: [collaborator.id] });

  const enrollment = await academic.createEnrollment(context, { personId: person.id, courseId: course.id });

  assert.equal(enrollment.status, 'ativa');
  assert.equal(enrollment.personName, 'Aluna Fictícia');
  assert.equal(enrollment.studentProfileId, '00000000-0000-4000-8000-000000000705');
  assert.equal(enrollment.createdAt, '2026-09-30T12:00:00.000Z');
  const secondCourse = await academic.createCourse(context, { name: 'Outro percurso', code: 'fund-004', educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  await academic.createSubject(context, secondCourse.id, { name: 'Português', code: 'port-01', workloadHours: 30, collaboratorIds: [
    (await academic.listCollaborators(context))[0]!.id,
  ] });
  const secondEnrollment = await academic.createEnrollment(context, { personId: person.id, courseId: secondCourse.id });
  assert.equal(secondEnrollment.studentProfileId, enrollment.studentProfileId);
  const suspended = await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'trancada' });
  assert.equal(suspended.status, 'trancada');
  assert.equal((await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'ativa' })).status, 'ativa');
  const cancelled = await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'cancelada' });
  assert.equal(cancelled.status, 'cancelada');
  await assert.rejects(academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'ativa' }), { code: 'CONFLICT' });
});

test('percurso desativado bloqueia nova matrícula sem bloquear a transição de matrícula existente', async () => {
  let nextId = 800;
  const person = { id: 'person-transition', tenantId: context.tenantId, name: 'Pessoa Fictícia' };
  const secondPerson = { id: 'person-new', tenantId: context.tenantId, name: 'Outra Pessoa Fictícia' };
  const academic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: context.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: { get: async (_context, personId) => {
      const found = [person, secondPerson].find(value => value.id === personId);
      if (!found) throw new Error('Pessoa não encontrada.');
      return found;
    } },
  now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => `00000000-0000-4000-8000-${String(++nextId).padStart(12, '0')}` });
  const course = await academic.createCourse(context, { name: 'Fundamental', code: 'fund-005',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const collaborator = await academic.createCollaborator(context, { personId: person.id });
  await academic.createSubject(context, course.id, { name: 'Ciências', code: 'cie-01', workloadHours: 30,
    collaboratorIds: [collaborator.id] });
  const enrollment = await academic.createEnrollment(context, { personId: person.id, courseId: course.id });

  await academic.updateCourse(context, course.id, { active: false });

  await assert.rejects(academic.createEnrollment(context, { personId: 'person-new', courseId: course.id }), { code: 'CONFLICT' });
  assert.equal((await academic.transitionEnrollment(context, course.id, enrollment.id, { status: 'trancada' })).status, 'trancada');
});
