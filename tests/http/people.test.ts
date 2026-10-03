import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: sessão, isolamento, cadastro, auditoria, CSRF e revogação', async () => {
  const origin = 'http://127.0.0.1:4318';
  const server = createHttpServer(await fixtureServices(), { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4318, '127.0.0.1', resolve); });
  async function request(path: string, method = 'GET', payload?: unknown, cookie = '', requestOrigin = origin) {
    return fetch(`${origin}${path}`, { method, headers: { Origin: requestOrigin, Cookie: cookie, 'Content-Type': 'application/json' },
      ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) });
  }
  async function login(institution: string, username = 'operador') {
    const response = await request('/api/session', 'POST', { institution, username, password: 'senha-ficticia-longa' });
    assert.equal(response.status, 200);
    const header = response.headers.get('set-cookie')!;
    assert.match(header, /HttpOnly/); assert.match(header, /SameSite=Strict/);
    assert.equal('token' in await response.json(), false);
    return header.split(';')[0]!;
  }
  try {
    assert.equal((await request('/api/session')).status, 401);
    assert.equal((await request('/api/session', 'POST', {}, '', 'https://outro-site.invalid')).status, 403);
    assert.equal((await request('/api/session', 'POST', { institution: 'escola-ficticia', username: 'operador', password: 'errada' })).status, 401);
    const cookieA = await login('escola-ficticia');
    const cookieB = await login('outra-escola');
    const viewer = await login('escola-ficticia', 'consulta');
    const input = { name: 'Pessoa Fictícia', cpf: '12345678901', institutionalId: 'FICTICIO-001',
      birthMunicipality: 'Campinas', birthUf: 'sp' };
    assert.equal((await request('/api/people', 'POST', input, viewer)).status, 403);
    assert.equal((await request('/api/people', 'POST', { ...input, tenantId: 'outra-instituicao' }, cookieA)).status, 400);
    const created = await request('/api/people', 'POST', input, cookieA);
    assert.equal(created.status, 201);
    const person = await created.json();
    assert.equal(person.birthMunicipality, 'Campinas');
    assert.equal(person.birthUf, 'SP');
    assert.equal((await (await request(`/api/people/${person.id}`, 'GET', undefined, cookieA)).json()).birthUf, 'SP');
    assert.equal((await request(`/api/people/${person.id}`, 'GET', undefined, cookieB)).status, 404);
    assert.equal(await (await request('/api/people/search', 'POST', { cpf: input.cpf }, cookieB)).json(), null);
    assert.equal((await request('/api/people', 'POST', input, cookieA)).status, 409);
    assert.equal((await request('/api/people', 'POST', input, cookieB)).status, 201);
    assert.equal((await (await request('/api/people/search', 'POST', { cpf: '123.456.789-01' }, cookieA)).json()).id, person.id);
    assert.equal((await request(`/api/people/${person.id}/audit`, 'GET', undefined, cookieA)).status, 404);
    assert.equal((await request('/api/session', 'DELETE', undefined, cookieA)).status, 204);
    assert.equal((await request('/api/session', 'GET', undefined, cookieA)).status, 401);
    const page = await request('/'); assert.match(await page.text(), /Acesso institucional/);
    assert.match(page.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
