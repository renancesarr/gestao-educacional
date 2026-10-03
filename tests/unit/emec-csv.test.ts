import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { readEmecCsv } from '../../src/public_catalog/emec-csv.ts';

test('e-MEC IES CSV é lido em fluxo, preserva códigos e interpreta campos CSV entre aspas', async () => {
  const csv = 'CODIGO_DA_IES,NOME_DA_IES,SIGLA,CATEGORIA_DA_IES,ORGANIZACAO_ACADEMICA,CODIGO_MUNICIPIO_IBGE,MUNICIPIO,UF,SITUACAO_IES\r\n' +
    '00123,"Faculdade, do Vale",FVV,Privada,Faculdade,000000004106902,Curitiba,PR,Ativa\r\n';
  const chunks = [...Buffer.from(csv)].map(byte => Buffer.from([byte]));
  const rows = [];
  for await (const row of readEmecCsv(Readable.from(chunks), 'institutions')) rows.push(row);
  assert.deepEqual(rows, [{ type: 'institution', line: 2, value: {
    sourceId: '00123', name: 'Faculdade, do Vale', acronym: 'FVV', category: 'Privada',
    organization: 'Faculdade', municipalityCode: '000000004106902', municipality: 'Curitiba', state: 'PR', status: 'Ativa',
  } }]);
});

test('e-MEC cursos conserva os rótulos aprovados e rejeita linha sem código de IES', async () => {
  const csv = 'CODIGO_IES,NOME_IES,CODIGO_CURSO,NOME_CURSO,GRAU,AREA_OCDE,MODALIDADE,SITUACAO_CURSO,CARGA_HORARIA,CODIGO_MUNICIPIO,MUNICIPIO,UF\n' +
    '123,IES de teste,0004567,"Letras, Português",Licenciatura,Letras,Educação a Distância,Em atividade,3992,000000002516201,Sousa,PB\n' +
    ',IES sem código,123,Curso inválido,Bacharelado,Agronomia,Presencial,Extinto,100,1,Cidade,SP\n';
  const rows = [];
  for await (const row of readEmecCsv(Readable.from([Buffer.from(csv)]), 'courses')) rows.push(row);
  assert.deepEqual(rows[0], { type: 'course', line: 2, value: {
    institutionCode: '123', institutionName: 'IES de teste', sourceId: '0004567', name: 'Letras, Português',
    degree: 'Licenciatura', area: 'Letras', modality: 'Educação a Distância', status: 'Em atividade',
    workload: '3992', municipalityCode: '000000002516201', municipality: 'Sousa', state: 'PB',
  } });
  assert.deepEqual(rows[1], { type: 'rejected', line: 3, reason: 'Código da IES ou código do curso ausente.' });
});

test('e-MEC parser rejeita cabeçalho incompatível antes de processar os registros', async () => {
  const rows = readEmecCsv(Readable.from([Buffer.from('OUTRO,NOME\n1,Teste\n')]), 'institutions');
  await assert.rejects(async () => { for await (const _row of rows) { /* consume */ } }, { code: 'INVALID_INPUT' });
});

test('arquivos e-MEC fornecidos são percorridos em fluxo e mapeiam todas as linhas', async () => {
  const institutions = { count: 0, rejected: 0 };
  for await (const row of readEmecCsv(createReadStream(new URL('../../CSV_DADOS_ABERTOS/PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv', import.meta.url)), 'institutions')) {
    if (row.type === 'rejected') institutions.rejected++; else institutions.count++;
  }
  assert.deepEqual(institutions, { count: 4815, rejected: 0 });

  const courses = { count: 0, rejected: 0 };
  for await (const row of readEmecCsv(createReadStream(new URL('../../CSV_DADOS_ABERTOS/PDA_Dados_Cursos_Graduacao_Brasil.csv', import.meta.url)), 'courses')) {
    if (row.type === 'rejected') courses.rejected++; else courses.count++;
  }
  assert.deepEqual(courses, { count: 902676, rejected: 0 });
});
