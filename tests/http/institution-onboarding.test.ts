import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: onboarding institucional exige SUPER_ADMIN e recebe o escopo acadêmico', async () => {
  const origin = 'http://127.0.0.1:4319';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-fixture' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4319, '127.0.0.1', resolve); });
  const platformCookie = `platform_session=${session.token}`;
  async function request(path: string, method = 'GET', payload?: unknown, cookie = '') {
    return fetch(`${origin}${path}`, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) });
  }
  const input = { code: 'instituto-misto', name: 'Instituto Misto', username: 'gestora', password: 'senha-inicial-segura',
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }, { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' },
      { level: 'HIGHER', courseType: 'GRADUACAO' }] };
  try {
    const page = await request('/');
    const html = await page.text();
    for (const label of ['Ensino Fundamental', 'EJA · Ensino Fundamental', 'Ensino Médio', 'EJA · Ensino Médio', 'Graduação']) {
      assert.match(html, new RegExp(label));
    }
    assert.equal((await request('/api/platform/institutions', 'POST', input)).status, 401);
    const created = await request('/api/platform/institutions', 'POST', input, platformCookie);
    assert.equal(created.status, 201);
    assert.match((await created.json() as { tenantId: string }).tenantId, /^[0-9a-f-]{36}$/i);
    assert.equal(services.institutionStore.records.length, 1);
    assert.equal((await request('/api/platform/institutions', 'POST', { ...input, code: 'sem-escopo', educationScope: [] }, platformCookie)).status, 400);
    assert.equal((await request('/api/platform/institutions', 'POST', { ...input, code: 'tenant-forjado', tenantId: 'attacker' }, platformCookie)).status, 400);
    assert.equal((await request('/api/platform/institutions', 'POST', input, platformCookie)).status, 409);
    assert.equal(services.institutionStore.records.length, 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
