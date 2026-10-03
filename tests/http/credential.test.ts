import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP permite CRUD autenticado de credencial e invalida tokens antigos na edição e exclusão', async () => {
  const origin = 'http://127.0.0.1:4342';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-credential' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const context = { actorId: session.principal.accountId, tenantId: '00000000-0000-4000-8000-000000000010', actorRole: 'SUPER_ADMIN' } as const;
  const student = await services.globalPeople.create(context, { name: 'Ana Exemplo', institutionalId: 'aluna-credencial' });
  const course = await services.globalAcademic.createCourse(context, { name: 'Administração', code: 'adm-credential',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4342, '127.0.0.1', resolve); });
  const request = (path: string, method: string, input?: Record<string, unknown>, authenticated = true) => fetch(`${origin}${path}`, {
    method, headers: { Origin: origin, ...(authenticated ? { Cookie: `platform_session=${session.token}` } : {}),
      ...(input ? { 'Content-Type': 'application/json' } : {}) }, ...(input ? { body: JSON.stringify(input) } : {}),
  });
  try {
    const create = await request('/api/platform/credentials', 'POST', { targetTenantId: context.tenantId,
      studentId: student.id, courseId: course.id, type: 'diploma', issuedOn: '2026-10-03' });
    assert.equal(create.status, 201);
    const first = await create.json() as { id: string; validationToken: string; contentHash: string };
    const publicFirst = await request(`/validar/${first.validationToken}`, 'GET', undefined, false);
    assert.deepEqual(await publicFirst.json(), { status: 'valida', type: 'diploma', holderName: 'Ana Exemplo', courseName: 'Administração',
      institutionName: 'Escola Fictícia · demonstração', issuedOn: '2026-10-03', demonstrative: true });

    const update = await request(`/api/platform/credentials/${first.id}`, 'PATCH', { targetTenantId: context.tenantId,
      type: 'certificado', issuedOn: '2026-10-02' });
    assert.equal(update.status, 200);
    const updated = await update.json() as { validationToken: string; contentHash: string };
    assert.notEqual(updated.contentHash, first.contentHash);
    assert.notEqual(updated.validationToken, first.validationToken);
    assert.equal((await request(`/validar/${first.validationToken}`, 'GET', undefined, false)).status, 404);
    assert.equal((await request(`/validar/${updated.validationToken}`, 'GET', undefined, false)).status, 200);

    const listed = await request('/api/platform/credentials/search', 'POST', { targetTenantId: context.tenantId });
    assert.equal((await listed.json() as unknown[]).length, 1);
    const unauthenticated = await request('/api/platform/credentials/search', 'POST', { targetTenantId: context.tenantId }, false);
    assert.equal(unauthenticated.status, 401);
    const deleted = await request(`/api/platform/credentials/${first.id}`, 'DELETE', { targetTenantId: context.tenantId });
    assert.equal(deleted.status, 200);
    assert.equal((await request(`/validar/${updated.validationToken}`, 'GET', undefined, false)).status, 404);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
