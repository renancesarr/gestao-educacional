import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEnrollment, listEnrollments, transitionEnrollment } from './enrollment-api.ts';

test('enrollment adapters create, search and transition with explicit tenant context', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => { calls.push({ path: String(input), init });
    return new Response(JSON.stringify({ id: 'enrollment-1' }), { status: 201, headers: { 'Content-Type': 'application/json' } }); };
  await createEnrollment('tenant-1', { personId: 'person-1', courseId: 'course-1', regulatoryActs: [
    { target: 'institution', actId: 'institution-act', versionId: 'institution-version' },
    { target: 'course', actId: 'course-act', versionId: 'course-version' },
  ] }, fetcher);
  await listEnrollments('tenant-1', 'course-1', undefined, fetcher);
  await transitionEnrollment('tenant-1', 'course-1', 'enrollment-1', 'trancada', fetcher);
  assert.deepEqual(calls.map(value => value.path), ['/api/platform/enrollments', '/api/platform/enrollments/search',
    '/api/platform/courses/course-1/enrollments/enrollment-1']);
  assert.deepEqual(calls.map(value => JSON.parse(String(value.init?.body))), [
    { personId: 'person-1', courseId: 'course-1', regulatoryActs: [
      { target: 'institution', actId: 'institution-act', versionId: 'institution-version' },
      { target: 'course', actId: 'course-act', versionId: 'course-version' },
    ], targetTenantId: 'tenant-1' },
    { courseId: 'course-1', targetTenantId: 'tenant-1' },
    { status: 'trancada', targetTenantId: 'tenant-1' },
  ]);
});
