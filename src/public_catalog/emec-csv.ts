import { ApplicationError } from '../shared/errors.ts';

export interface EmecInstitutionRecord {
  readonly sourceId: string;
  readonly name: string;
  readonly acronym: string | null;
  readonly category: string | null;
  readonly organization: string | null;
  readonly municipalityCode: string | null;
  readonly municipality: string | null;
  readonly state: string | null;
  readonly status: string | null;
}

export interface EmecCourseRecord {
  readonly institutionCode: string;
  readonly institutionName: string | null;
  readonly sourceId: string;
  readonly name: string;
  readonly degree: string | null;
  readonly area: string | null;
  readonly modality: string | null;
  readonly status: string | null;
  readonly workload: string | null;
  readonly municipalityCode: string | null;
  readonly municipality: string | null;
  readonly state: string | null;
}

export type EmecCsvResult =
  | { readonly type: 'institution'; readonly line: number; readonly value: EmecInstitutionRecord }
  | { readonly type: 'course'; readonly line: number; readonly value: EmecCourseRecord }
  | { readonly type: 'rejected'; readonly line: number; readonly reason: string };

type Source = 'institutions' | 'courses';

async function* csvRows(chunks: AsyncIterable<Uint8Array>): AsyncGenerator<string[]> {
  let field: number[] = [];
  let row: string[] = [];
  let quoted = false;
  let quoteAtChunkEnd = false;
  let skipLf = false;
  let firstField = true;
  const text = (bytes: number[]) => Buffer.from(bytes).toString('utf8');
  const flushField = () => {
    let value = text(field);
    if (firstField) { value = value.replace(/^\uFEFF/, ''); firstField = false; }
    row.push(value);
    field = [];
  };
  for await (const chunk of chunks) {
    for (let index = 0; index < chunk.length; index++) {
      const byte = chunk[index]!;
      if (quoteAtChunkEnd) {
        quoteAtChunkEnd = false;
        if (byte === 34) { field.push(34); continue; }
        quoted = false;
      }
      if (skipLf) { skipLf = false; if (byte === 10) continue; }
      if (quoted) {
        if (byte === 34) {
          if (index === chunk.length - 1) quoteAtChunkEnd = true;
          else if (chunk[index + 1] === 34) { field.push(34); index++; }
          else quoted = false;
        } else field.push(byte);
      } else if (byte === 34 && field.length === 0) quoted = true;
      else if (byte === 44) flushField();
      else if (byte === 10 || byte === 13) {
        flushField();
        if (row.some(value => value.trim())) yield row;
        row = [];
        firstField = true;
        if (byte === 13) skipLf = true;
      } else field.push(byte);
    }
  }
  if (quoteAtChunkEnd) { quoted = false; quoteAtChunkEnd = false; }
  if (quoted) throw new ApplicationError('INVALID_INPUT', 'O CSV e-MEC contém campo entre aspas sem fechamento.');
  if (field.length || row.length) {
    flushField();
    if (row.some(value => value.trim())) yield row;
  }
}

function key(header: string): string {
  return header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function value(row: readonly string[], headers: ReadonlyMap<string, number>, names: readonly string[]): string | null {
  for (const name of names) {
    const index = headers.get(key(name));
    if (index !== undefined) return row[index]?.trim() || null;
  }
  return null;
}

function requiredHeaders(header: readonly string[], source: Source): Map<string, number> {
  const headers = new Map(header.map((name, index) => [key(name), index]));
  const required = source === 'institutions'
    ? [['CODIGO_DA_IES'], ['NOME_DA_IES']]
    : [['CODIGO_IES'], ['CODIGO_CURSO'], ['NOME_CURSO']];
  if (required.some(aliases => !aliases.some(alias => headers.has(key(alias))))) {
    throw new ApplicationError('INVALID_INPUT', `O CSV e-MEC de ${source === 'institutions' ? 'IES' : 'cursos'} tem cabeçalho incompatível.`);
  }
  return headers;
}

export async function* readEmecCsv(chunks: AsyncIterable<Uint8Array>, source: Source): AsyncGenerator<EmecCsvResult> {
  let headers: Map<string, number> | undefined;
  let recordNumber = 0;
  for await (const row of csvRows(chunks)) {
    recordNumber++;
    if (!headers) { headers = requiredHeaders(row, source); continue; }
    if (source === 'institutions') {
      const sourceId = value(row, headers, ['CODIGO_DA_IES']);
      const name = value(row, headers, ['NOME_DA_IES']);
      if (!sourceId || !name) { yield { type: 'rejected', line: recordNumber, reason: 'Código ou nome da IES ausente.' }; continue; }
      yield { type: 'institution', line: recordNumber, value: {
        sourceId, name, acronym: value(row, headers, ['SIGLA']), category: value(row, headers, ['CATEGORIA_DA_IES']),
        organization: value(row, headers, ['ORGANIZACAO_ACADEMICA']),
        municipalityCode: value(row, headers, ['CODIGO_MUNICIPIO_IBGE']), municipality: value(row, headers, ['MUNICIPIO']),
        state: value(row, headers, ['UF']), status: value(row, headers, ['SITUACAO_IES']),
      } };
    } else {
      const institutionCode = value(row, headers, ['CODIGO_IES']);
      const sourceId = value(row, headers, ['CODIGO_CURSO']);
      const name = value(row, headers, ['NOME_CURSO']);
      if (!institutionCode || !sourceId || !name) {
        yield { type: 'rejected', line: recordNumber, reason: 'Código da IES ou código do curso ausente.' }; continue;
      }
      yield { type: 'course', line: recordNumber, value: {
        institutionCode, institutionName: value(row, headers, ['NOME_IES']), sourceId, name,
        degree: value(row, headers, ['GRAU']), area: value(row, headers, ['AREA_OCDE']),
        modality: value(row, headers, ['MODALIDADE']), status: value(row, headers, ['SITUACAO_CURSO']),
        workload: value(row, headers, ['CARGA_HORARIA']), municipalityCode: value(row, headers, ['CODIGO_MUNICIPIO']),
        municipality: value(row, headers, ['MUNICIPIO']), state: value(row, headers, ['UF']),
      } };
    }
  }
  if (!headers) throw new ApplicationError('INVALID_INPUT', 'O CSV e-MEC está vazio.');
}
