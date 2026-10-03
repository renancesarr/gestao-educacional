import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchPublicStudents } from './public-student-search.ts';

test('public search calls the public route without tenant/session fields', async () => {
  let call: { path: string; init?: RequestInit } | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    call = { path: String(input), init };
    return new Response(JSON.stringify({ students: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }), { status: 200 });
  };
  await searchPublicStudents({ name: 'Ana', birthUf: 'SP' }, { page: 1, pageSize: 20 }, fetcher);
  assert.equal(call?.path, '/api/public/students/search');
  assert.deepEqual(JSON.parse(String(call?.init?.body)), { name: 'Ana', birthUf: 'SP', page: 1, pageSize: 20 });
});
