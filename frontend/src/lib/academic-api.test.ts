import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPerson, searchPerson, createCollaborator, listCollaborators, updateCollaborator,
  createCourse, listCourses, updateCourse, getCourseDetail, createSubject, updateSubject } from './academic-api.ts';

test('institutional academic adapters preserve their DTO and explicit tenant target', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const tenant = 'selected-tenant';
  await createPerson(tenant, { name: 'Pessoa Exemplo', cpf: '123' }, fetcher);
  await searchPerson(tenant, { cpf: '123' }, fetcher);
  await createCollaborator(tenant, 'person-1', fetcher);
  await listCollaborators(tenant, fetcher);
  await updateCollaborator(tenant, 'collab-1', false, fetcher);
  await createCourse(tenant, { name: 'Curso Exemplo', code: 'curso-1', educationScope: { level: 'HIGHER', courseType: 'BACHELOR' } }, fetcher);
  await listCourses(tenant, undefined, fetcher);
  await updateCourse(tenant, 'course-1', { name: 'Nome atualizado' }, fetcher);
  await getCourseDetail(tenant, 'course-1', fetcher);
  await createSubject(tenant, 'course-1', { name: 'Matéria', code: 'mat-1', workloadHours: 40, collaboratorIds: ['collab-1'] }, fetcher);
  await updateSubject(tenant, 'course-1', 'subject-1', { active: false }, fetcher);
  const bodies = calls.map(call => call.init?.body ? JSON.parse(String(call.init.body)) : null);
  assert.deepEqual(calls.map(call => call.path), [
    '/api/platform/people', '/api/platform/people/search', '/api/platform/collaborators',
    '/api/platform/collaborators/search', '/api/platform/collaborators/collab-1', '/api/platform/courses',
    '/api/platform/courses/search', '/api/platform/courses/course-1', '/api/platform/courses/detail',
    '/api/platform/courses/course-1/subjects', '/api/platform/courses/course-1/subjects/subject-1',
  ]);
  assert.ok(bodies.every(body => body.targetTenantId === tenant));
  assert.deepEqual(bodies[0], { name: 'Pessoa Exemplo', cpf: '123', targetTenantId: tenant });
  assert.deepEqual(bodies[8], { courseId: 'course-1', targetTenantId: tenant });
  assert.deepEqual(bodies[9], { name: 'Matéria', code: 'mat-1', workloadHours: 40, collaboratorIds: ['collab-1'], targetTenantId: tenant });
});
