import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';
import { createPublicStudentSearchService } from '../../src/people/public-student-search.ts';

test('HTTP: busca pública não exige sessão e responde com projeção pública paginada', async () => {
  const origin = 'http://127.0.0.1:4331';
  const services = await fixtureServices();
  services.publicStudentSearch = createPublicStudentSearchService({ store: { search: async () => ({ students: [{
    name: 'Aluna Exemplo', courseName: 'Administração', institutionName: 'Universidade Exemplo', cpf: '52998224725', birthMunicipality: 'Recife', email: 'privado@example.test',
  }], total: 1 }) } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4331, '127.0.0.1', resolve); });
  try {
    const response = await fetch(`${origin}/api/public/students/search`, { method: 'POST', headers: {
      Origin: origin, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ name: 'Aluna', page: 1, pageSize: 10 }) });
    assert.equal(response.status, 200);
    const result = await response.json() as { students: Array<Record<string, unknown>>; page: number; total: number };
    assert.deepEqual(result, { students: [{ name: 'Aluna Exemplo', courseName: 'Administração', institutionName: 'Universidade Exemplo' }],
      page: 1, pageSize: 10, total: 1, totalPages: 1 });
    assert.deepEqual(Object.keys(result.students[0]!).sort(), ['courseName', 'institutionName', 'name']);
    const invalid = await fetch(`${origin}/api/public/students/search`, { method: 'POST', headers: {
      Origin: origin, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ name: 'Aluna', tenantId: 'forged' }) });
    assert.equal(invalid.status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
