import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchStudents } from './student-search-api.ts';

test('authenticated student search sends explicit institution, filters and pagination', async () => {
  let call: { path: string; body: unknown } | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    call = { path: String(input), body: JSON.parse(String(init?.body)) };
    return new Response(JSON.stringify({ students: [], page: 2, pageSize: 5, total: 0, totalPages: 1 }), { status: 200 });
  };
  await searchStudents('tenant-picked-by-admin', { name: 'Ana', birthUf: 'SP', course: 'História' }, { page: 2, pageSize: 5 }, fetcher);
  assert.equal(call?.path, '/api/platform/students/search');
  assert.deepEqual(call?.body, { targetTenantId: 'tenant-picked-by-admin', name: 'Ana', birthUf: 'SP', course: 'História', page: 2, pageSize: 5 });
});
