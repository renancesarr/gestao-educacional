import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCredential, deleteCredential, listCredentials, updateCredential, validateCredential } from './credential-api.ts';

test('cliente de credenciais envia tenant explícito e encaminha emissão, edição, exclusão e validação', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), init });
    return new Response(JSON.stringify({ id: 'credential-1', deleted: true, status: 'valida' }), { status: 200,
      headers: { 'Content-Type': 'application/json' } });
  };
  await createCredential('tenant-1', { studentId: 'student-1', courseId: 'course-1', type: 'diploma', issuedOn: '2026-10-03' }, fetcher);
  await listCredentials('tenant-1', fetcher);
  await updateCredential('tenant-1', 'credential-1', { type: 'certificado' }, fetcher);
  await deleteCredential('tenant-1', 'credential-1', fetcher);
  await validateCredential('opaque-token', fetcher);
  assert.deepEqual(calls.map(call => call.path), ['/api/platform/credentials', '/api/platform/credentials/search',
    '/api/platform/credentials/credential-1', '/api/platform/credentials/credential-1', '/api/credentials/validate/opaque-token']);
  for (const call of calls.slice(0, 4)) assert.equal(JSON.parse(String(call.init?.body)).targetTenantId, 'tenant-1');
  assert.deepEqual(JSON.parse(String(calls[0]!.init?.body)), { studentId: 'student-1', courseId: 'course-1',
    type: 'diploma', issuedOn: '2026-10-03', targetTenantId: 'tenant-1' });
});
