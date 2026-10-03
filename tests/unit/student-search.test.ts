import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Person } from '../../src/people/index.ts';
import { createGlobalStudentSearchService } from '../../src/people/student-search.ts';

const context = { actorId: 'platform-admin', tenantId: 'tenant-a', actorRole: 'SUPER_ADMIN' as const };
const candidates: Person[] = [
  { id: 'person-2', tenantId: 'tenant-a', name: 'Ana Souza', cpf: '12345678901', institutionalId: 'A-2',
    birthMunicipality: 'Campinas', birthUf: 'SP', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'person-1', tenantId: 'tenant-a', name: 'Ana Lima', cpf: null, institutionalId: 'A-1',
    birthMunicipality: 'Campinas', birthUf: 'SP', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'person-3', tenantId: 'tenant-a', name: 'Bruno Alves', cpf: null, institutionalId: 'B-1',
    birthMunicipality: 'Santos', birthUf: 'SP', createdAt: '2026-01-01T00:00:00.000Z' },
];

test('SUPER_ADMIN pesquisa alunos por combinação de filtros e pagina resultados de alunos matriculados', async () => {
  const people = {
    async search(_context: typeof context, filters: Record<string, string>, pagination: { page: number; pageSize: number }) {
      const matching = candidates.filter(person => (!filters.name || person.name.toLocaleLowerCase().includes(filters.name.toLocaleLowerCase())) &&
        (!filters.birthMunicipality || person.birthMunicipality?.toLocaleLowerCase().includes(filters.birthMunicipality.toLocaleLowerCase())) &&
        (!filters.birthUf || person.birthUf === filters.birthUf) && (!filters.cpf || person.cpf === filters.cpf));
      const start = (pagination.page - 1) * pagination.pageSize;
      return { people: matching.slice(start, start + pagination.pageSize), total: matching.length,
        page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.max(1, Math.ceil(matching.length / pagination.pageSize)) };
    },
  };
  const academic = {
    async listStudentCourses(_context: typeof context, personIds: readonly string[]) {
      const included = new Set(personIds);
      return [
        { personId: 'person-2', courseId: 'course-1', courseName: 'Técnico em Administração', courseCode: 'tec-adm', status: 'ativa' as const },
        { personId: 'person-1', courseId: 'course-2', courseName: 'Bacharelado em Administração', courseCode: 'bach-adm', status: 'trancada' as const },
        { personId: 'person-3', courseId: 'course-3', courseName: 'Ensino Médio', courseCode: 'medio', status: 'ativa' as const },
      ].filter(link => included.has(link.personId));
    },
  };
  const search = createGlobalStudentSearchService({ people, academic });

  const result = await search.search(context, { name: 'ana', birthMunicipality: 'camp', birthUf: 'sp', course: 'admin' },
    { page: 1, pageSize: 1 });

  assert.deepEqual(result, {
    students: [{ person: candidates[1], courses: [{ courseId: 'course-2', courseName: 'Bacharelado em Administração',
      courseCode: 'bach-adm', status: 'trancada' }] }],
    page: 1, pageSize: 1, total: 2, totalPages: 2,
  });
});

test('busca de aluno rejeita critérios vazios, filtros inválidos e paginação acima do limite', async () => {
  const search = createGlobalStudentSearchService({
    people: { async search() { return { people: [], total: 0, page: 1, pageSize: 100, totalPages: 1 }; } },
    academic: { async listStudentCourses() { return []; } },
  });
  await assert.rejects(search.search(context, {}, { page: 1, pageSize: 20 }), { code: 'INVALID_INPUT' });
  await assert.rejects(search.search(context, { birthUf: 'SÃO' }, { page: 1, pageSize: 20 }), { code: 'INVALID_INPUT' });
  await assert.rejects(search.search(context, { name: 'Ana' }, { page: 1, pageSize: 101 }), { code: 'INVALID_INPUT' });
});
