import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN busca alunos e cursos dentro da instituição-alvo explícita', async () => {
  const origin = 'http://127.0.0.1:4330';
  const services = await fixtureServices();
  const tenantId = '00000000-0000-4000-8000-000000000010';
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-search' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'search-passkey' } });
  const platform = await services.platformIdentity.authenticate(session.token);
  const context = await services.institutionOperationContext.resolve(platform, tenantId);
  const person = await services.globalPeople.create(context, { name: 'Aluna Busca', cpf: '529.982.247-25',
    birthMunicipality: 'Recife', birthUf: 'pe' });
  const course = await services.globalAcademic.createCourse(context, { name: 'Ensino Fundamental', code: 'fund-1',
    educationScope: { level: 'BASIC', stage: 'FUNDAMENTAL' } });
  const teacher = await services.globalPeople.create(context, { name: 'Professor de Demonstração', institutionalId: 'teacher-1' });
  const collaborator = await services.globalAcademic.createCollaborator(context, { personId: teacher.id });
  await services.globalAcademic.createSubject(context, course.id, { name: 'Língua Portuguesa', code: 'lp-1', workloadHours: 40,
    collaboratorIds: [collaborator.id] });
  await services.globalAcademic.createEnrollment(context, { personId: person.id, courseId: course.id });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4330, '127.0.0.1', resolve); });
  const headers = { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json' };
  try {
    const found = await fetch(`${origin}/api/platform/students/search`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId: tenantId, birthMunicipality: 'rec', birthUf: 'PE', course: 'fundamental', page: 1, pageSize: 10 }) });
    assert.equal(found.status, 200);
    const result = await found.json() as { students: Array<{ person: { id: string; birthMunicipality: string; birthUf: string }; courses: Array<{ courseName: string }> }>; total: number };
    assert.equal(result.total, 1);
    assert.equal(result.students[0]?.person.id, person.id);
    assert.equal(result.students[0]?.person.birthMunicipality, 'Recife');
    assert.equal(result.students[0]?.person.birthUf, 'PE');
    assert.equal(result.students[0]?.courses[0]?.courseName, 'Ensino Fundamental');
    const created = await fetch(`${origin}/api/platform/people`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId: tenantId, name: 'Cadastro HTTP', institutionalId: 'cadastro-http', birthMunicipality: 'Olinda', birthUf: 'pe' }) });
    assert.equal(created.status, 201);
    const createdPerson = await created.json() as { birthMunicipality: string; birthUf: string };
    assert.equal(createdPerson.birthMunicipality, 'Olinda');
    assert.equal(createdPerson.birthUf, 'PE');
    assert.equal((await fetch(`${origin}/api/platform/students/search`, { method: 'POST',
      headers: { ...headers, Cookie: '' }, body: JSON.stringify({ targetTenantId: tenantId, name: 'Aluna' }) })).status, 401);
    assert.equal((await fetch(`${origin}/api/platform/students/search`, { method: 'POST', headers,
      body: JSON.stringify({ name: 'Aluna' }) })).status, 400);
    assert.equal((await fetch(`${origin}/api/platform/students/search`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId: tenantId, tenantId, name: 'Aluna' }) })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
