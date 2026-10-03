import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP protege o CRUD manual do histórico e isola o tenant selecionado', async () => {
  const origin = 'http://127.0.0.1:4343';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-history' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const tenantId = '00000000-0000-4000-8000-000000000010';
  const context = { actorId: session.principal.accountId, tenantId, actorRole: 'SUPER_ADMIN' } as const;
  const student = await services.globalPeople.create(context, { name: 'Aluno Transferido', institutionalId: 'history-transfer' });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4343, '127.0.0.1', resolve); });
  const request = (path: string, method: string, input: Record<string, unknown>, authenticated = true) => fetch(`${origin}${path}`, {
    method, headers: { Origin: origin, Cookie: authenticated ? `platform_session=${session.token}` : '', 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const input = { targetTenantId: tenantId, studentId: student.id, sourceInstitution: 'Escola Anterior', courseName: 'Ensino Fundamental',
    academicYear: 2022, period: '2º bimestre', subjectName: 'Matemática', workloadHours: 80, gradeOrConcept: 'B', absenceCount: 3,
    result: 'Aprovado', notes: 'Transcrito manualmente' };
  try {
    const denied = await request('/api/platform/histories/search', 'POST', { targetTenantId: tenantId }, false);
    assert.equal(denied.status, 401);
    const created = await request('/api/platform/histories', 'POST', input);
    assert.equal(created.status, 201);
    const history = await created.json() as { id: string; sourceInstitution: string; courseName: string; studentName: string };
    assert.deepEqual({ sourceInstitution: history.sourceInstitution, courseName: history.courseName, studentName: history.studentName },
      { sourceInstitution: 'Escola Anterior', courseName: 'Ensino Fundamental', studentName: 'Aluno Transferido' });
    const listed = await request('/api/platform/histories/search', 'POST', { targetTenantId: tenantId, studentId: student.id });
    assert.equal((await listed.json() as unknown[]).length, 1);
    const loaded = await request('/api/platform/histories/get', 'POST', { targetTenantId: tenantId, id: history.id });
    assert.equal(loaded.status, 200);
    const updated = await request(`/api/platform/histories/${history.id}`, 'PATCH', { targetTenantId: tenantId, result: 'Recuperação concluída' });
    assert.equal((await updated.json() as { result: string }).result, 'Recuperação concluída');
    const otherTenant = await request('/api/platform/histories/search', 'POST', { targetTenantId: '00000000-0000-4000-8000-000000000020' });
    assert.equal((await otherTenant.json() as unknown[]).length, 0);
    const deleted = await request(`/api/platform/histories/${history.id}`, 'DELETE', { targetTenantId: tenantId });
    assert.equal(deleted.status, 200);
    assert.equal((await request('/api/platform/histories/get', 'POST', { targetTenantId: tenantId, id: history.id })).status, 404);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});
