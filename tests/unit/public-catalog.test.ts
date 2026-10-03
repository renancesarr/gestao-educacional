import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseInepSchoolCsv } from '../../src/public_catalog/inep-csv.ts';
import { createPublicCatalogService } from '../../src/public_catalog/index.ts';
import { MemoryPublicCatalogStore } from '../support/memory-public-catalog-store.ts';

const operator = { accountId: 'platform-operator-1', role: 'SUPER_ADMIN' as const };
const validBatch = {
  edition: 'Censo Escolar 2025',
  collectedAt: '2026-09-30T12:00:00.000Z',
  sourceUrl: 'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip',
};

test('SUPER_ADMIN revisa a prévia oficial de escolas do INEP antes de aplicar a versão', async () => {
  const store = new MemoryPublicCatalogStore();
  const catalog = createPublicCatalogService({
    store,
    now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => 'inep-version-1',
  });

  const preview = await catalog.previewInepSchools(operator, {
    ...validBatch,
    records: [{
      sourceId: '33000001',
      name: 'Escola Fictícia de Ensino Fundamental',
      situation: { code: '1', label: 'Em atividade' },
      state: { code: 'SP', label: 'São Paulo' },
      municipality: { code: '3550308', label: 'São Paulo' },
      educationalOffers: [{
        scope: { level: 'BASIC', stage: 'FUNDAMENTAL' },
        stageLabel: 'Ensino Fundamental',
        modalityLabel: 'Ensino Regular',
      }],
      phone: '0000000000',
      responsibleName: 'Dado que não deve ser armazenado',
    }],
  });

  assert.deepEqual(preview, {
    id: 'inep-version-1',
    source: 'INEP_CENSO_ESCOLAR',
    edition: 'Censo Escolar 2025',
    collectedAt: '2026-09-30T12:00:00.000Z',
    sourceUrl: 'https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip',
    state: 'REVIEW',
    completeness: 'COMPLETE',
    validCount: 1,
    rejectedCount: 0,
    conflictCount: 0,
    schools: [{
      sourceId: '33000001',
      name: 'Escola Fictícia de Ensino Fundamental',
      situation: { code: '1', label: 'Em atividade' },
      state: { code: 'SP', label: 'São Paulo' },
      municipality: { code: '3550308', label: 'São Paulo' },
      educationalOffers: [{
        scope: { level: 'BASIC', stage: 'FUNDAMENTAL' },
        stageLabel: 'Ensino Fundamental',
        modalityLabel: 'Ensino Regular',
      }],
    }],
    rejected: [],
  });
  assert.deepEqual(await store.listSchools(), []);
});

test('uma carga INEP vazia não pode substituir a referência vigente', async () => {
  const store = new MemoryPublicCatalogStore();
  const catalog = createPublicCatalogService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'unused' });

  await assert.rejects(catalog.previewInepSchools(operator, { ...validBatch, records: [] }), {
    code: 'INVALID_INPUT',
  });
  assert.equal(store.versions.size, 0);
});

test('versão totalmente rejeitada não pode substituir a referência vigente', async () => {
  const store = new MemoryPublicCatalogStore();
  const catalog = createPublicCatalogService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => 'inep-all-rejected' });
  const preview = await catalog.previewInepSchools(operator, { ...validBatch,
    records: [{ sourceId: '33000003', name: ' ', situation: null, state: null, municipality: null, educationalOffers: [] }],
  });

  assert.equal(preview.validCount, 0);
  assert.equal(preview.rejectedCount, 1);
  await assert.rejects(catalog.applyInepSchools(operator, preview.id), { code: 'CONFLICT' });
  await assert.rejects(catalog.searchInepSchools(operator, {}), { code: 'INVALID_INPUT' });
});

test('prévia INEP rejeita fonte que não identifica o domínio oficial do INEP', async () => {
  const store = new MemoryPublicCatalogStore();
  const catalog = createPublicCatalogService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'unused' });

  await assert.rejects(catalog.previewInepSchools(operator, {
    ...validBatch,
    sourceUrl: 'https://outro-orgao.gov.br/dados/escolas.csv',
    records: [],
  }), { code: 'INVALID_INPUT' });
  assert.equal(store.versions.size, 0);
});

test('nova versão aplicada vira referência atual e mantém a versão anterior consultável', async () => {
  const store = new MemoryPublicCatalogStore();
  let id = 0;
  const catalog = createPublicCatalogService({ store, now: () => new Date('2026-09-30T12:00:00.000Z'),
    newId: () => `inep-version-${++id}` });
  const first = await catalog.previewInepSchools(operator, {
    ...validBatch,
    records: [{ sourceId: '33000001', name: 'Nome anterior', situation: null, state: null, municipality: null,
      educationalOffers: [] }],
  });
  await catalog.applyInepSchools(operator, first.id);
  const second = await catalog.previewInepSchools(operator, {
    ...validBatch,
    edition: 'Censo Escolar 2026',
    records: [{ sourceId: '33000001', name: 'Nome atualizado na fonte', situation: null, state: null, municipality: null,
      educationalOffers: [] }],
  });
  await catalog.applyInepSchools(operator, second.id);

  assert.equal((await catalog.searchInepSchools(operator, { name: 'atualizado' }))[0]?.name, 'Nome atualizado na fonte');
  assert.equal((await catalog.getInepVersion(operator, first.id))?.schools[0]?.name, 'Nome anterior');
});

test('prévia preserva códigos oficiais quando a fonte não publica o rótulo correspondente', async () => {
  const catalog = createPublicCatalogService({ store: new MemoryPublicCatalogStore(),
    now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'inep-code-only' });

  const preview = await catalog.previewInepSchools(operator, {
    ...validBatch,
    records: [{ sourceId: '33000002', name: 'Escola com códigos da fonte',
      situation: { code: '1', label: null }, state: { code: 'SP', label: null },
      municipality: { code: '3550308', label: null }, educationalOffers: [] }],
  });

  assert.equal(preview.completeness, 'COMPLETE');
  assert.deepEqual(preview.schools[0]?.situation, { code: '1', label: null });
  assert.deepEqual(preview.schools[0]?.state, { code: 'SP', label: null });
});

test('exportação CSV INEP agrupa ofertas, limita o escopo atual e rejeita linhas não mapeáveis', async () => {
  const catalog = createPublicCatalogService({ store: new MemoryPublicCatalogStore(),
    now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'inep-csv-version' });
  const csv = [
    'Código da Escola;Nome da Escola;Situação de funcionamento;UF;Código do município;Município;Etapa de ensino;Modalidade de ensino;Telefone',
    '33000001;Escola de Teste;Em atividade;SP;3550308;São Paulo;Ensino Fundamental;Regular;11999999999',
    '33000001;Escola de Teste;Em atividade;SP;3550308;São Paulo;Ensino Fundamental;EJA;11999999999',
    '33000002;Unidade Fora do Escopo;Paralisada;RJ;3304557;Rio de Janeiro;Educação Infantil;Regular;11888888888',
    '33000003;Registro Desconhecido;Em atividade;MG;3106200;Belo Horizonte;Educação Integral;Regular;11777777777',
  ].join('\r\n');
  const batch = parseInepSchoolCsv(new TextEncoder().encode(csv), {
    edition: 'Catálogo INEP 2025', collectedAt: validBatch.collectedAt, sourceUrl: validBatch.sourceUrl,
  });

  const preview = await catalog.previewInepSchools(operator, batch);

  assert.equal(preview.validCount, 1);
  assert.equal(preview.rejectedCount, 1);
  assert.equal(preview.completeness, 'PARTIAL');
  assert.deepEqual(preview.schools[0]?.educationalOffers.map(item => item.scope), [
    { level: 'BASIC', stage: 'FUNDAMENTAL' },
    { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' },
  ]);
  assert.equal(JSON.stringify(preview).includes('11999999999'), false);
  assert.equal(JSON.stringify(preview).includes('Telefone'), false);
});

test('mapeia os cabeçalhos reais do CSV aberto do INEP e descarta dados operacionais', () => {
  const batch = parseInepSchoolCsv(readFileSync(new URL('../fixtures/inep-open-schools-sample.csv', import.meta.url)), {
    edition: 'CSV de dados abertos fornecido', collectedAt: validBatch.collectedAt, sourceUrl: validBatch.sourceUrl,
  }) as { records: Array<{ sourceId: string; name: string; educationalOffers: Array<{ scope: unknown }> }> };

  assert.equal(batch.records.length, 2);
  assert.deepEqual(batch.records[0]?.educationalOffers.map(item => item.scope), [
    { level: 'BASIC', stage: 'FUNDAMENTAL' }, { level: 'BASIC', stage: 'MEDIO' },
  ]);
  assert.deepEqual(batch.records[1]?.educationalOffers.map(item => item.scope), [
    { level: 'BASIC', stage: 'FUNDAMENTAL' }, { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' },
  ]);
  assert.equal(JSON.stringify(batch).includes('Endereço'), false);
  assert.equal(JSON.stringify(batch).includes('Telefone'), false);
});


test('preserva rótulos distintos publicados dentro do mesmo escopo normalizado', async () => {
  const catalog = createPublicCatalogService({ store: new MemoryPublicCatalogStore(),
    now: () => new Date('2026-09-30T12:00:00.000Z'), newId: () => 'inep-repeated-scope' });
  const preview = await catalog.previewInepSchools(operator, {
    ...validBatch,
    records: [{ sourceId: '33000004', name: 'Escola com mais de um rótulo oficial', situation: null, state: null, municipality: null,
      educationalOffers: [
        { scope: { level: 'BASIC', stage: 'FUNDAMENTAL' }, stageLabel: 'Ensino Fundamental de 9 anos', modalityLabel: 'Regular' },
        { scope: { level: 'BASIC', stage: 'FUNDAMENTAL' }, stageLabel: 'Ensino Fundamental de 8 anos', modalityLabel: 'Regular' },
      ] }],
  });

  assert.equal(preview.validCount, 1);
  assert.equal(preview.rejectedCount, 0);
  assert.deepEqual(preview.schools[0]?.educationalOffers.map(item => item.stageLabel), [
    'Ensino Fundamental de 9 anos', 'Ensino Fundamental de 8 anos',
  ]);
});

test('busca INEP combina nome, município e UF e também permite pesquisar somente localização', async () => {
  const store = new MemoryPublicCatalogStore();
  const catalog = createPublicCatalogService({ store, now: () => new Date(validBatch.collectedAt), newId: () => 'inep-filtered' });
  const records = [
    { sourceId: '33000010', name: 'Colégio Horizonte', situation: null, state: { code: 'SP', label: 'São Paulo' }, municipality: { code: '3550308', label: 'São Paulo' }, educationalOffers: [] },
    { sourceId: '33000011', name: 'Colégio Horizonte', situation: null, state: { code: 'RJ', label: 'Rio de Janeiro' }, municipality: { code: '3304557', label: 'Rio de Janeiro' }, educationalOffers: [] },
    { sourceId: '33000012', name: 'Escola Aurora', situation: null, state: { code: 'SP', label: 'São Paulo' }, municipality: { code: '3509502', label: 'Campinas' }, educationalOffers: [] },
  ];
  const preview = await catalog.previewInepSchools(operator, { ...validBatch, records });
  await catalog.applyInepSchools(operator, preview.id);

  assert.deepEqual((await catalog.searchInepSchools(operator, { name: 'Horizonte', municipality: 'São Paulo', state: 'SP' }))
    .map(school => school.sourceId), ['33000010']);
  assert.deepEqual((await catalog.searchInepSchools(operator, { municipality: 'Campinas', state: 'São Paulo' }))
    .map(school => school.sourceId), ['33000012']);
});
