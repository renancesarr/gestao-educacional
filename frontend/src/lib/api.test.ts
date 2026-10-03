import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiRequest, withTargetTenant } from './api.ts';

test('API client sends JSON with same-origin credentials and preserves the HTTP method', async () => {
  let request: RequestInit | undefined;
  const value = await apiRequest<{ saved: boolean }>('/api/platform/people', {
    method: 'POST', body: { name: 'Pessoa Fictícia' },
  }, async (_input, init) => {
    request = init;
    return new Response(JSON.stringify({ saved: true }), { status: 201,
      headers: { 'Content-Type': 'application/json' } });
  });

  assert.deepEqual(value, { saved: true });
  assert.equal(request?.method, 'POST');
  assert.equal(request?.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(String(request?.body)), { name: 'Pessoa Fictícia' });
});

test('API client returns null for no-content responses and a safe message for normalized errors', async () => {
  assert.equal(await apiRequest('/api/platform/session', { method: 'DELETE' }, async () => new Response(null, { status: 204 })), null);
  await assert.rejects(apiRequest('/api/platform/courses', { method: 'POST', body: {} }, async () =>
    new Response(JSON.stringify({ message: 'Código já cadastrado.' }), { status: 409,
      headers: { 'Content-Type': 'application/json' } })), /Código já cadastrado\./);
});

test('institution target always comes from the selected route', () => {
  assert.deepEqual(withTargetTenant('tenant-from-route', { name: 'Curso', targetTenantId: 'untrusted-value' }), {
    name: 'Curso', targetTenantId: 'tenant-from-route',
  });
});
