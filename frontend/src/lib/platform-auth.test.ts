import assert from 'node:assert/strict';
import { test } from 'node:test';
import { beginPlatformLogin, verifyPlatformLogin, beginPlatformActivation, verifyPlatformActivation,
  getPlatformSession, logoutPlatformSession, createInstitution } from './platform-auth.ts';

function fetchSpy(response: unknown = {}) {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), init });
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, fetcher };
}

test('platform login and activation use separate options and verification calls', async () => {
  const { calls, fetcher } = fetchSpy({ challenge: 'x' });
  await beginPlatformLogin('operator', fetcher);
  await verifyPlatformLogin('operator', { id: 'credential' }, fetcher);
  await beginPlatformActivation('operator', 'one-time', fetcher);
  await verifyPlatformActivation('operator', { id: 'credential' }, fetcher);
  assert.deepEqual(calls.map(call => [call.path, JSON.parse(String(call.init?.body))]), [
    ['/api/platform/login/options', { username: 'operator' }],
    ['/api/platform/login/verify', { username: 'operator', response: { id: 'credential' } }],
    ['/api/platform/activation/options', { username: 'operator', activationCode: 'one-time' }],
    ['/api/platform/activation/verify', { username: 'operator', response: { id: 'credential' } }],
  ]);
});

test('platform session can be restored and ended', async () => {
  const { calls, fetcher } = fetchSpy({ username: 'operator' });
  await getPlatformSession(fetcher);
  await logoutPlatformSession(fetcher);
  assert.deepEqual(calls.map(call => [call.path, call.init?.method]), [
    ['/api/platform/session', 'GET'], ['/api/platform/session', 'DELETE'],
  ]);
});

test('institution onboarding sends structured scope and first institutional admin', async () => {
  const { calls, fetcher } = fetchSpy({ tenantId: 'internal-id' });
  const input = { code: 'inst-01', name: 'Instituição Exemplo', username: 'admin', password: 'Secret-123',
    educationScope: [{ level: 'BASIC' as const, stage: 'MEDIO' }] };
  await createInstitution(input, fetcher);
  assert.deepEqual(calls[0]?.path, '/api/platform/institutions');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), input);
});
