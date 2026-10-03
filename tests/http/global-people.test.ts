import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN opera pessoas com instituição-alvo explícita em cada chamada', async () => {
  const origin = 'http://127.0.0.1:4320';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-global' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4320, '127.0.0.1', resolve); });
  const cookie = `platform_session=${session.token}`;
  const tenantA = '00000000-0000-4000-8000-000000000010';
  const tenantB = '00000000-0000-4000-8000-000000000020';
  async function request(path: string, payload: unknown, suppliedCookie = cookie) {
    return fetch(`${origin}${path}`, { method: 'POST', headers: { Origin: origin, Cookie: suppliedCookie,
      'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  }
  try {
    const created = await request('/api/platform/people', { targetTenantId: tenantA,
      name: 'Pessoa Global', institutionalId: 'GLOBAL-001' });
    assert.equal(created.status, 201);
    const person = await created.json() as { id: string };
    const found = await request('/api/platform/people/search', { targetTenantId: tenantA, institutionalId: 'GLOBAL-001' });
    assert.equal(found.status, 200);
    assert.equal((await found.json()).tenantId, tenantA);
    assert.equal((await request('/api/platform/people/search', { targetTenantId: tenantB,
      institutionalId: 'GLOBAL-001' })).status, 200);
    assert.equal(await (await request('/api/platform/people/search', { targetTenantId: tenantB,
      institutionalId: 'GLOBAL-001' })).json(), null);
    const get = await fetch(`${origin}/api/platform/people/${person.id}?targetTenantId=${tenantA}`, {
      headers: { Origin: origin, Cookie: cookie },
    });
    assert.equal(get.status, 200);
    assert.equal((await get.json() as { id: string }).id, person.id);
    assert.equal((await fetch(`${origin}/api/platform/people/${person.id}?targetTenantId=${tenantB}`, {
      headers: { Origin: origin, Cookie: cookie },
    })).status, 404);
    const audit = await fetch(`${origin}/api/platform/people/${person.id}/audit?targetTenantId=${tenantA}`, {
      headers: { Origin: origin, Cookie: cookie },
    });
    assert.equal(audit.status, 401);
    assert.equal((await fetch(`${origin}/api/platform/people/${person.id}`, {
      headers: { Origin: origin, Cookie: cookie },
    })).status, 400);
    assert.equal((await request('/api/platform/people', { name: 'Sem alvo', institutionalId: 'GLOBAL-002' })).status, 400);
    assert.equal((await request('/api/platform/people', { targetTenantId: tenantA, tenantId: tenantB,
      name: 'Alvo forjado', institutionalId: 'GLOBAL-003' })).status, 400);
    assert.equal((await request('/api/platform/people', { targetTenantId: tenantA,
      name: 'Sem sessão', institutionalId: 'GLOBAL-004' }, '')).status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: painel global exige alvo explícito sem persistir a instituição', async () => {
  const origin = 'http://127.0.0.1:4321';
  const server = createHttpServer(await fixtureServices(), { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4321, '127.0.0.1', resolve); });
  try {
    const html = await (await fetch(`${origin}/`)).text();
    const script = await (await fetch(`${origin}/app.js`)).text();
    assert.match(html, /id="global-person-create-form"/);
    assert.match(html, /name="targetTenantId"/);
    assert.match(script, /\/api\/platform\/people/);
    assert.doesNotMatch(script, /localStorage|sessionStorage/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
