import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN cadastra e consulta ato da instituição-alvo', async () => {
  const origin = 'http://127.0.0.1:4344';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-acts' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4344, '127.0.0.1', resolve); });
  const payload = { targetTenantId: '00000000-0000-4000-8000-000000000010', target: 'institution',
    text: 'Credenciamento: Portaria nº 1077, de 31/05/2019.', status: 'ativo' };
  const request = (path: string, method = 'POST', body: unknown = payload, cookie = `platform_session=${session.token}`) =>
    fetch(`${origin}${path}`, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await request('/api/platform/regulatory-acts', 'POST', payload, '')).status, 401);
    const created = await request('/api/platform/regulatory-acts');
    assert.equal(created.status, 201);
    const act = await created.json() as { id: string; target: string; text: string; status: string };
    assert.equal(act.target, 'institution');
    assert.equal(act.text, payload.text);
    assert.equal(act.status, 'ativo');
    const listed = await request('/api/platform/regulatory-acts/search', 'POST', {
      targetTenantId: payload.targetTenantId, target: 'institution',
    });
    assert.equal(listed.status, 200);
    assert.deepEqual((await listed.json() as { id: string }[]).map(item => item.id), [act.id]);
    const changed = await request(`/api/platform/regulatory-acts/${act.id}`, 'PATCH', {
      targetTenantId: payload.targetTenantId, text: 'Ato suspenso para atualização.', status: 'suspenso', preservePreviousVersion: true,
    });
    assert.equal(changed.status, 200);
    const revised = await changed.json() as { text: string; status: string; versions: readonly { text: string; status: string }[] };
    assert.equal(revised.text, 'Ato suspenso para atualização.');
    assert.equal(revised.status, 'suspenso');
    assert.deepEqual(revised.versions.map(version => ({ text: version.text, status: version.status })), [
      { text: payload.text, status: 'ativo' }, { text: 'Ato suspenso para atualização.', status: 'suspenso' },
    ]);
    const crossTenantEdit = await request(`/api/platform/regulatory-acts/${act.id}`, 'PATCH', {
      targetTenantId: '00000000-0000-4000-8000-000000000020', text: 'Tentativa cruzada.', status: 'revogado',
      preservePreviousVersion: true,
    });
    assert.equal(crossTenantEdit.status, 404);
    const removed = await request(`/api/platform/regulatory-acts/${act.id}`, 'DELETE', {
      targetTenantId: payload.targetTenantId,
    });
    assert.equal(removed.status, 200);
    const empty = await request('/api/platform/regulatory-acts/search', 'POST', {
      targetTenantId: payload.targetTenantId, target: 'institution',
    });
    assert.deepEqual(await empty.json(), []);

    const context = await services.institutionOperationContext.resolve(session.principal,
      '00000000-0000-4000-8000-000000000010');
    const course = await services.globalAcademic.createCourse(context, { name: 'Curso de teste de atos', code: 'curso-atos',
      educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
    const courseActPayload = { targetTenantId: payload.targetTenantId, target: 'course', courseId: course.id,
      text: 'Ato de funcionamento do curso.', status: 'ativo' };
    const firstCourseAct = await request('/api/platform/regulatory-acts', 'POST', courseActPayload);
    assert.equal(firstCourseAct.status, 201);
    const secondCourseAct = await request('/api/platform/regulatory-acts', 'POST', {
      ...courseActPayload, text: 'Ato anterior do mesmo curso.', status: 'vencido',
    });
    assert.equal(secondCourseAct.status, 201);
    const courseActs = await request('/api/platform/regulatory-acts/search', 'POST', {
      targetTenantId: payload.targetTenantId, target: 'course', courseId: course.id,
    });
    assert.deepEqual((await courseActs.json() as { text: string }[]).map(item => item.text), [
      'Ato de funcionamento do curso.', 'Ato anterior do mesmo curso.',
    ]);
    const crossTenantCourseAct = await request('/api/platform/regulatory-acts', 'POST', {
      ...courseActPayload, targetTenantId: '00000000-0000-4000-8000-000000000020',
    });
    assert.equal(crossTenantCourseAct.status, 404);
    const invalidStatus = await request('/api/platform/regulatory-acts', 'POST', { ...payload, status: 'automatico' });
    assert.equal(invalidStatus.status, 400);
    const otherTenantList = await request('/api/platform/regulatory-acts/search', 'POST', {
      targetTenantId: '00000000-0000-4000-8000-000000000020', target: 'institution',
    });
    assert.deepEqual(await otherTenantList.json(), []);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
