import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmecCatalogService } from '../../src/public_catalog/emec-catalog.ts';
import type { EmecCsvResult } from '../../src/public_catalog/emec-csv.ts';
import { MemoryEmecCatalogStore } from '../support/memory-emec-catalog-store.ts';

const operator = { accountId: 'test-platform-admin', role: 'SUPER_ADMIN' as const };
const institution = { sourceId: '00012', name: 'IES Fictícia', acronym: null, category: 'Privada',
  organization: 'Faculdade', municipalityCode: '000000123456789', municipality: 'Cidade', state: 'SP', status: 'Ativa' };
const course = { institutionCode: '00012', institutionName: 'IES Fictícia', sourceId: '00034', name: 'Curso Fictício',
  degree: 'Bacharelado', area: 'Tecnologia', modality: 'Educação a Distância', status: 'Em atividade', workload: '3200',
  municipalityCode: '000000123456789', municipality: 'Cidade', state: 'SP' };
async function* rows(values: EmecCsvResult[]): AsyncGenerator<EmecCsvResult> { yield* values; }

test('e-MEC gera prévia, valida IES por código e conta duplicatas, conflitos e rejeições separadamente', async () => {
  const store = new MemoryEmecCatalogStore();
  const service = createEmecCatalogService({ store, newId: () => 'emec-v1' });
  const preview = await service.preview(operator, { edition: 'e-MEC CSV fornecido', collectedAt: '2026-10-03T12:00:00Z',
    institutions: rows([
      { type: 'institution', line: 2, value: institution },
      { type: 'institution', line: 3, value: institution },
      { type: 'institution', line: 4, value: { ...institution, name: 'Nome divergente' } },
    ]),
    courses: rows([
      { type: 'course', line: 2, value: course },
      { type: 'course', line: 3, value: course },
      { type: 'course', line: 4, value: { ...course, name: 'Curso divergente' } },
      { type: 'course', line: 5, value: { ...course, institutionCode: '99999' } },
      { type: 'rejected', line: 6, reason: 'Código do curso ausente.' },
    ]),
  });
  assert.deepEqual({ institutions: preview.institutionCount, courses: preview.courseCount,
    duplicates: preview.duplicateCount, conflicts: preview.conflictCount, rejected: preview.rejectedCount,
    completeness: preview.completeness }, {
    institutions: 1, courses: 1, duplicates: 2, conflicts: 2, rejected: 2, completeness: 'PARTIAL',
  });
  assert.equal(preview.state, 'REVIEW');
  assert.equal(store.currentVersionId, null);
  assert.equal(preview.issues.length, 4);
  assert.ok(preview.issues.some(issue => issue.kind === 'CONFLICT' && /dados divergentes/.test(issue.reason)));
  assert.ok(preview.issues.some(issue => issue.kind === 'REJECTED' && /IES ausente/.test(issue.reason)));
});

test('somente SUPER_ADMIN pode importar CSVs e arquivos sem IES são rejeitados antes da aplicação', async () => {
  const service = createEmecCatalogService({ store: new MemoryEmecCatalogStore(), newId: () => 'emec-v2' });
  const input = { edition: 'e-MEC', collectedAt: '2026-10-03T12:00:00Z', institutions: rows([]), courses: rows([]) };
  await assert.rejects(service.preview({ accountId: 'institution-user', role: 'TENANT_ADMIN' } as never, input), { code: 'FORBIDDEN' });
  const preview = await service.preview(operator, input);
  await assert.rejects(service.apply(operator, preview.id), { code: 'CONFLICT' });
});

test('versão e-MEC aplicada torna os registros consultáveis e não sobrescreve o histórico de versões', async () => {
  const store = new MemoryEmecCatalogStore();
  let id = 0;
  const service = createEmecCatalogService({ store, newId: () => `emec-v${++id}` });
  const first = await service.preview(operator, { edition: 'e-MEC 1', collectedAt: '2026-10-03T12:00:00Z',
    institutions: rows([{ type: 'institution', line: 2, value: institution }]),
    courses: rows([{ type: 'course', line: 2, value: course }]) });
  await service.apply(operator, first.id);
  const next = await service.preview(operator, { edition: 'e-MEC 2', collectedAt: '2026-10-04T12:00:00Z',
    institutions: rows([{ type: 'institution', line: 2, value: { ...institution, name: 'IES Atualizada' } }]),
    courses: rows([]) });
  assert.equal((await service.current()).institutions[0]?.name, 'IES Fictícia');
  await service.apply(operator, next.id);
  assert.equal((await service.getVersion(operator, first.id))?.state, 'APPLIED');
  assert.equal((await service.current()).institutions[0]?.name, 'IES Atualizada');
});

test('SUPER_ADMIN pesquisa IES por curso e localidade com paginação e ofertas correspondentes', async () => {
  const secondInstitution = { ...institution, sourceId: '00013', name: 'Universidade Fictícia RJ', municipality: 'Niterói',
    state: 'RJ' };
  const secondCourse = { ...course, institutionCode: '00013', institutionName: 'Universidade Fictícia RJ',
    sourceId: '00035', name: 'Engenharia Civil', municipality: 'Niterói', state: 'RJ' };
  const store = new MemoryEmecCatalogStore();
  const service = createEmecCatalogService({ store, newId: () => 'emec-search-v1' });
  const preview = await service.preview(operator, {
    edition: 'fixture de consulta', collectedAt: '2026-10-03T12:00:00Z',
    institutions: rows([
      { type: 'institution', line: 2, value: institution },
      { type: 'institution', line: 3, value: secondInstitution },
    ]),
    courses: rows([
      { type: 'course', line: 2, value: course },
      { type: 'course', line: 3, value: { ...course, sourceId: '00036', name: 'Engenharia de Software' } },
      { type: 'course', line: 4, value: { ...course, sourceId: '00037', name: 'Engenharia de Dados' } },
      { type: 'course', line: 5, value: secondCourse },
    ]),
  });
  await service.apply(operator, preview.id);

  const result = await service.search(operator, { course: 'Engenharia', municipality: 'Cidade', state: 'SP' }, { page: 1, pageSize: 1 });
  assert.deepEqual(result, {
    institutions: [institution],
    courses: [{ ...course, sourceId: '00037', name: 'Engenharia de Dados' }],
    page: 1,
    pageSize: 1,
    totalInstitutions: 1,
    totalCourses: 2,
    totalPages: 2,
  });
});

test('e-MEC consulta exige SUPER_ADMIN, combina filtros e rejeita localidade incompleta', async () => {
  const service = createEmecCatalogService({ store: new MemoryEmecCatalogStore(), newId: () => 'emec-search-auth' });
  await assert.rejects(service.search({ accountId: 'tenant-user', role: 'TENANT_ADMIN' }, {}, { page: 1, pageSize: 20 }), { code: 'FORBIDDEN' });
  await assert.rejects(service.search(operator, { municipality: 'Campinas' }, { page: 1, pageSize: 20 }), { code: 'INVALID_INPUT' });
  await assert.rejects(service.search(operator, {}, { page: 0, pageSize: 1000 }), { code: 'INVALID_INPUT' });
});
