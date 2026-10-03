import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicStudentSearchService } from '../../src/people/public-student-search.ts';

test('public student search validates filters and returns only the approved projection', async () => {
  const service = createPublicStudentSearchService({ store: { search: async (filters, pagination) => {
    assert.deepEqual(filters, { cpf: '52998224725', birthUf: 'PE' });
    assert.deepEqual(pagination, { page: 1, pageSize: 10 });
    return { students: [{ name: 'Aluna Exemplo', courseName: 'Administração', institutionName: 'Universidade de Teste', cpf: '52998224725' }], total: 1 };
  } } });
  const result = await service.search({ cpf: '529.982.247-25', birthUf: 'pe' }, { page: 1, pageSize: 10 });
  assert.deepEqual(result, { students: [{ name: 'Aluna Exemplo', courseName: 'Administração', institutionName: 'Universidade de Teste' }],
    page: 1, pageSize: 10, total: 1, totalPages: 1 });
  await assert.rejects(service.search({}, { page: 1, pageSize: 10 }), { code: 'INVALID_INPUT' });
});
