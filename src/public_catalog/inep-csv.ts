import { ApplicationError } from '../shared/errors.ts';

export interface InepCsvDetails {
  readonly edition: string;
  readonly collectedAt: string;
  readonly sourceUrl: string;
}

type Scope = { readonly level: 'BASIC'; readonly stage: 'FUNDAMENTAL' | 'MEDIO'; readonly modality?: 'EJA' };
type CsvRecord = {
  sourceId: string;
  name: string;
  situation: { code: string | null; label: string | null } | null;
  state: { code: string | null; label: string | null } | null;
  municipality: { code: string | null; label: string | null } | null;
  educationalOffers: Array<{ scope: Scope; stageLabel: string; modalityLabel: string | null }>;
};

function decode(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return new TextDecoder('windows-1252').decode(bytes).replace(/^\uFEFF/, '');
  }
}

function delimiterOf(line: string): string {
  const candidates = [',', ';', '\t'];
  let selected = ',';
  let maximum = -1;
  for (const delimiter of candidates) {
    let count = 0;
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      if (line[index] === '"') {
        if (quoted && line[index + 1] === '"') index++;
        else quoted = !quoted;
      } else if (!quoted && line[index] === delimiter) count++;
    }
    if (count > maximum) { selected = delimiter; maximum = count; }
  }
  return selected;
}

function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = delimiterOf(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field.length === 0) quoted = true;
    else if (character === delimiter) { row.push(field); field = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index++;
      row.push(field); field = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else field += character;
  }
  if (quoted) throw new ApplicationError('INVALID_INPUT', 'O CSV INEP contém um campo entre aspas sem fechamento.');
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  if (rows.length < 2) throw new ApplicationError('INVALID_INPUT', 'O arquivo INEP não contém registros para revisar.');
  return rows;
}

function headerKey(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleUpperCase('pt-BR')
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function column(headers: readonly string[], aliases: readonly string[]): number | undefined {
  const keys = new Set(aliases.map(headerKey));
  const found = headers.findIndex(header => keys.has(headerKey(header)));
  return found < 0 ? undefined : found;
}

function field(row: readonly string[], index: number | undefined): string | null {
  if (index === undefined) return null;
  const value = row[index]?.trim();
  return value ? value : null;
}

function sourceValue(row: readonly string[], codeColumn: number | undefined, labelColumn: number | undefined) {
  const code = field(row, codeColumn);
  const label = field(row, labelColumn);
  return code || label ? { code, label } : null;
}

function offers(stageValue: string | null, modalityValue: string | null): CsvRecord['educationalOffers'] {
  const original = `${stageValue ?? ''} ${modalityValue ?? ''}`.trim();
  if (!original) return [];
  const normalized = original.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const labels = (stageValue ?? '').split(/[,;|]/).map(label => label.trim()).filter(Boolean);
  const basicStages = labels.flatMap(label => {
    const value = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return value.includes('fundamental') ? ['FUNDAMENTAL' as const]
      : value.includes('medio') ? ['MEDIO' as const] : [];
  });
  const ejaLabels = labels.filter(label => {
    const value = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return /(^|[^a-z])eja([^a-z]|$)|jovens.{0,20}adultos/.test(value);
  });
  if (!basicStages.length && ejaLabels.length) {
    throw new Error('A fonte publica EJA sem identificar se corresponde ao Ensino Fundamental ou Médio.');
  }
  if (!basicStages.length) {
    if (/infantil|profissional|tecnico|qualificacao/.test(normalized)) return [];
    throw new Error('Etapa ou modalidade publicada não mapeável para o escopo atual.');
  }
  const modalityIsEja = /(^|[^a-z])eja([^a-z]|$)|jovens.{0,20}adultos/.test(
    (modalityValue ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'));
  const stageDeclaresEja = ejaLabels.length > 0;
  const stageLabels = labels.filter(label => /fundamental|m[eé]dio/i.test(label));
  return basicStages.flatMap((stage, index) => {
    const stageLabel = stageLabels[index] ?? original;
    const result: CsvRecord['educationalOffers'] = [];
    if (!modalityIsEja) result.push({ scope: { level: 'BASIC', stage }, stageLabel, modalityLabel: modalityValue });
    if (stageDeclaresEja || modalityIsEja) result.push({ scope: { level: 'BASIC', stage, modality: 'EJA' },
      stageLabel: ejaLabels[0] ?? stageLabel, modalityLabel: modalityValue });
    return result;
  });
}

export function parseInepSchoolCsv(bytes: Uint8Array, details: InepCsvDetails): unknown {
  const rows = parseCsv(decode(bytes));
  const headers = rows[0]!;
  const sourceIdColumn = column(headers, ['CO_ENTIDADE', 'Código da Escola', 'Código INEP', 'Código da escola']);
  const nameColumn = column(headers, ['NO_ENTIDADE', 'Nome da Escola', 'Nome da escola', 'Escola']);
  const stageColumn = column(headers, ['ETAPA_ENSINO', 'TP_ETAPA_ENSINO', 'Etapa de ensino', 'Etapa', 'Etapas e Modalidade de Ensino Oferecidas']);
  const modalityColumn = column(headers, ['MODALIDADE_ENSINO', 'TP_MODALIDADE_ENSINO', 'Modalidade de ensino', 'Modalidade']);
  if (sourceIdColumn === undefined || nameColumn === undefined || stageColumn === undefined) {
    throw new ApplicationError('INVALID_INPUT', 'O CSV precisa identificar o código, o nome e a etapa publicada da escola.');
  }

  const situationCodeColumn = column(headers, ['TP_SITUACAO_FUNCIONAMENTO', 'Código da situação de funcionamento']);
  const situationLabelColumn = column(headers, ['Situação de funcionamento', 'Situação da escola']);
  const stateCodeColumn = column(headers, ['CO_UF', 'SG_UF', 'UF', 'Sigla da UF']);
  const stateLabelColumn = column(headers, ['NO_UF', 'Nome da UF']);
  const municipalityCodeColumn = column(headers, ['CO_MUNICIPIO', 'Código do município']);
  const municipalityLabelColumn = column(headers, ['NO_MUNICIPIO', 'Município', 'Nome do município']);
  const schools = new Map<string, CsvRecord>();
  const rejected: Array<{ sourceId: string | null; reason: string }> = [];
  const invalidIds = new Set<string>();
  const outOfScope = new Set<string>();

  for (const [index, row] of rows.slice(1).entries()) {
    const sourceId = field(row, sourceIdColumn);
    const name = field(row, nameColumn);
    if (!sourceId || !name) {
      rejected.push({ sourceId, reason: `Linha ${index + 2}: código ou nome oficial ausente.` });
      continue;
    }
    let mappedOffers: CsvRecord['educationalOffers'];
    try {
      mappedOffers = offers(field(row, stageColumn), field(row, modalityColumn));
    } catch (error) {
      rejected.push({ sourceId, reason: `Linha ${index + 2}: ${error instanceof Error ? error.message : 'Escopo não mapeável.'}` });
      invalidIds.add(sourceId);
      continue;
    }
    const candidate: CsvRecord = {
      sourceId,
      name,
      situation: sourceValue(row, situationCodeColumn, situationLabelColumn),
      state: sourceValue(row, stateCodeColumn, stateLabelColumn),
      municipality: sourceValue(row, municipalityCodeColumn, municipalityLabelColumn),
      educationalOffers: mappedOffers,
    };
    const existing = schools.get(sourceId);
    if (existing) {
      const identityMatches = existing.name === candidate.name && JSON.stringify(existing.situation) === JSON.stringify(candidate.situation) &&
        JSON.stringify(existing.state) === JSON.stringify(candidate.state) && JSON.stringify(existing.municipality) === JSON.stringify(candidate.municipality);
      if (!identityMatches) {
        rejected.push({ sourceId, reason: 'Linhas repetidas da escola têm dados de identificação divergentes.' });
        invalidIds.add(sourceId);
        continue;
      }
      for (const mappedOffer of mappedOffers) {
        if (!existing.educationalOffers.some(value => JSON.stringify(value) === JSON.stringify(mappedOffer))) {
          existing.educationalOffers.push(mappedOffer);
        }
      }
    } else schools.set(sourceId, candidate);
    if (!mappedOffers.length && (field(row, stageColumn) || field(row, modalityColumn))) outOfScope.add(sourceId);
  }

  for (const sourceId of invalidIds) schools.delete(sourceId);
  for (const sourceId of outOfScope) {
    const school = schools.get(sourceId);
    if (school && school.educationalOffers.length === 0) schools.delete(sourceId);
  }
  return { ...details, records: [...schools.values()], sourceRejections: rejected };
}
