import { parseInstitutionEducationScope, type InstitutionEducationScopeItem } from '../institution/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export interface InepSchoolOffer {
  readonly scope: InstitutionEducationScopeItem;
  readonly stageLabel: string;
  readonly modalityLabel: string | null;
}

export interface PublicSourceValue {
  readonly code: string | null;
  readonly label: string | null;
}

export interface InepSchool {
  readonly sourceId: string;
  readonly name: string;
  readonly situation: PublicSourceValue | null;
  readonly state: PublicSourceValue | null;
  readonly municipality: PublicSourceValue | null;
  readonly educationalOffers: readonly InepSchoolOffer[];
  readonly versionId?: string;
}

export interface PublicCatalogVersion {
  readonly id: string;
  readonly source: 'INEP_CENSO_ESCOLAR';
  readonly edition: string;
  readonly collectedAt: string;
  readonly sourceUrl: string;
  readonly state: 'REVIEW' | 'APPLIED';
  readonly completeness: 'COMPLETE' | 'PARTIAL';
  readonly validCount: number;
  readonly rejectedCount: number;
  readonly conflictCount: number;
  readonly appliedAt?: string;
  readonly schools: readonly InepSchool[];
  readonly rejected: readonly { readonly sourceId: string | null; readonly reason: string }[];
}

export interface PublicCatalogStore {
  savePreview(version: PublicCatalogVersion): Promise<void>;
  getVersion(id: string): Promise<PublicCatalogVersion | null>;
  applyVersion(id: string, appliedAt: string): Promise<PublicCatalogVersion | null>;
  listSchools(query?: InepSchoolQuery, limit?: number): Promise<readonly InepSchool[]>;
}

export interface InepSchoolQuery {
  readonly name?: string;
  readonly sourceId?: string;
  readonly municipality?: string;
  readonly state?: string;
}

export interface PublicCatalogOperator {
  readonly accountId: string;
  readonly role: 'SUPER_ADMIN';
}

function ensureOperator(operator: PublicCatalogOperator): void {
  if (!operator || operator.role !== 'SUPER_ADMIN' || !operator.accountId) {
    throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
  }
}

function parseLabelPair(input: unknown): PublicSourceValue | null {
  if (input === null) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Identificação geográfica inválida.');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['code', 'label'].includes(key)) ||
      (value.code !== null && value.code !== undefined && typeof value.code !== 'string') ||
      (value.label !== null && value.label !== undefined && typeof value.label !== 'string')) {
    throw new Error('Identificação geográfica inválida.');
  }
  const code = typeof value.code === 'string' ? value.code.trim() : null;
  const label = typeof value.label === 'string' ? value.label.trim() : null;
  if (!code && !label) throw new Error('Identificação geográfica inválida.');
  return { code, label };
}

function parseSchool(input: unknown): InepSchool {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Registro escolar inválido.');
  const value = input as Record<string, unknown>;
  if (typeof value.sourceId !== 'string' || !value.sourceId.trim() || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('O registro precisa de identificador e nome publicados.');
  }
  const offersInput = value.educationalOffers;
  if (!Array.isArray(offersInput)) throw new Error('Ofertas educacionais inválidas.');
  const offers: InepSchoolOffer[] = [];
  const offerKeys = new Set<string>();
  for (const raw of offersInput) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Oferta educacional inválida.');
    const offer = raw as Record<string, unknown>;
    const scope = parseInstitutionEducationScope([offer.scope])[0];
    if (!scope || scope.level !== 'BASIC') throw new Error('Escopo INEP fora do catálogo de Educação Básica.');
    const stageLabel = typeof offer.stageLabel === 'string' ? offer.stageLabel.trim() : '';
    const modalityLabel = offer.modalityLabel === null ? null : typeof offer.modalityLabel === 'string'
      ? offer.modalityLabel.trim() : '';
    if (!stageLabel || modalityLabel === '') throw new Error('Rótulo educacional da fonte inválido.');
    const key = JSON.stringify([scope, stageLabel, modalityLabel]);
    if (offerKeys.has(key)) throw new Error('O registro contém ofertas educacionais repetidas.');
    offerKeys.add(key);
    offers.push({ scope, stageLabel, modalityLabel });
  }
  let situation: PublicSourceValue | null;
  try {
    situation = parseLabelPair(value.situation);
  } catch {
    throw new Error('Situação publicada inválida.');
  }
  let state: PublicSourceValue | null;
  let municipality: PublicSourceValue | null;
  try {
    state = parseLabelPair(value.state);
    municipality = parseLabelPair(value.municipality);
  } catch {
    throw new Error('Localização da escola inválida.');
  }
  return {
    sourceId: value.sourceId.trim(),
    name: value.name.trim(),
    situation,
    state,
    municipality,
    educationalOffers: offers,
  };
}

function parseBatch(input: unknown): Omit<PublicCatalogVersion, 'id' | 'source' | 'state' | 'completeness' | 'validCount' | 'rejectedCount' | 'conflictCount'> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Carga INEP inválida.');
  const value = input as Record<string, unknown>;
  if (typeof value.edition !== 'string' || !value.edition.trim() || value.edition.trim().length > 100 ||
      typeof value.collectedAt !== 'string' || !Number.isFinite(Date.parse(value.collectedAt)) ||
      typeof value.sourceUrl !== 'string' || !Array.isArray(value.records) || value.records.length === 0) {
    throw new ApplicationError('INVALID_INPUT', 'Informe edição, data de coleta, fonte oficial e registros.');
  }
  let sourceUrl: URL;
  try { sourceUrl = new URL(value.sourceUrl); } catch { throw new ApplicationError('INVALID_INPUT', 'Fonte INEP inválida.'); }
  const hostname = sourceUrl.hostname.toLowerCase();
  const inepDomain = hostname === 'inep.gov.br' || hostname.endsWith('.inep.gov.br');
  const inepPortalPath = (hostname === 'gov.br' || hostname === 'www.gov.br') && sourceUrl.pathname.startsWith('/inep/');
  const officialHost = inepDomain || inepPortalPath;
  if (sourceUrl.protocol !== 'https:' || !officialHost) throw new ApplicationError('INVALID_INPUT', 'Use uma fonte oficial do INEP.');
  const schools: InepSchool[] = [];
  const rejected: { sourceId: string | null; reason: string }[] = [];
  if (value.sourceRejections !== undefined) {
    if (!Array.isArray(value.sourceRejections)) throw new ApplicationError('INVALID_INPUT', 'Rejeições da fonte inválidas.');
    for (const raw of value.sourceRejections) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ApplicationError('INVALID_INPUT', 'Rejeições da fonte inválidas.');
      const rejection = raw as Record<string, unknown>;
      if (Object.keys(rejection).some(key => !['sourceId', 'reason'].includes(key)) ||
          (rejection.sourceId !== null && rejection.sourceId !== undefined && typeof rejection.sourceId !== 'string') ||
          typeof rejection.reason !== 'string' || !rejection.reason.trim() || rejection.reason.length > 300) {
        throw new ApplicationError('INVALID_INPUT', 'Rejeições da fonte inválidas.');
      }
      rejected.push({ sourceId: typeof rejection.sourceId === 'string' ? rejection.sourceId.slice(0, 100) : null,
        reason: rejection.reason.trim() });
    }
  }
  const seen = new Set<string>();
  for (const record of value.records) {
    let sourceId = record && typeof record === 'object' && typeof (record as Record<string, unknown>).sourceId === 'string'
      ? ((record as Record<string, unknown>).sourceId as string).trim() : null;
    try {
      const school = parseSchool(record);
      if (seen.has(school.sourceId)) {
        rejected.push({ sourceId: school.sourceId, reason: 'Identificador de origem repetido nesta carga.' });
        continue;
      }
      seen.add(school.sourceId);
      schools.push(school);
    } catch (error) {
      rejected.push({ sourceId: sourceId || null, reason: error instanceof Error ? error.message : 'Registro escolar inválido.' });
    }
  }
  return {
    edition: value.edition.trim(),
    collectedAt: new Date(value.collectedAt).toISOString(),
    sourceUrl: sourceUrl.toString(),
    schools,
    rejected,
  };
}

export function createPublicCatalogService(deps: { store: PublicCatalogStore; now: () => Date; newId: () => string }) {
  return {
    async previewInepSchools(operator: PublicCatalogOperator, input: unknown): Promise<PublicCatalogVersion> {
      ensureOperator(operator);
      const batch = parseBatch(input);
      const version: PublicCatalogVersion = {
        id: deps.newId(),
        source: 'INEP_CENSO_ESCOLAR',
        ...batch,
        state: 'REVIEW',
        completeness: batch.rejected.length ? 'PARTIAL' : 'COMPLETE',
        validCount: batch.schools.length,
        rejectedCount: batch.rejected.length,
        conflictCount: batch.rejected.filter(record => record.reason === 'Identificador de origem repetido nesta carga.').length,
      };
      await readOrWrite(() => deps.store.savePreview(version));
      return version;
    },
    async applyInepSchools(operator: PublicCatalogOperator, versionId: string): Promise<PublicCatalogVersion> {
      ensureOperator(operator);
      if (!versionId.trim()) throw new ApplicationError('INVALID_INPUT', 'Versão inválida.');
      const preview = await readOrWrite(() => deps.store.getVersion(versionId));
      if (!preview) throw new ApplicationError('NOT_FOUND', 'Prévia não encontrada.');
      if (preview.state !== 'REVIEW') throw new ApplicationError('CONFLICT', 'Esta versão já foi aplicada.');
      if (preview.validCount === 0) throw new ApplicationError('CONFLICT', 'A versão não contém registros válidos para aplicação.');
      const applied = await readOrWrite(() => deps.store.applyVersion(versionId, deps.now().toISOString()));
      if (!applied) throw new ApplicationError('CONFLICT', 'Esta versão já foi aplicada.');
      return applied;
    },
    async getInepVersion(operator: PublicCatalogOperator, versionId: string): Promise<PublicCatalogVersion | null> {
      ensureOperator(operator);
      if (!versionId.trim()) throw new ApplicationError('INVALID_INPUT', 'Versão inválida.');
      return readOrWrite(() => deps.store.getVersion(versionId));
    },
    async searchInepSchools(operator: PublicCatalogOperator, queryInput?: unknown): Promise<readonly InepSchool[]> {
      ensureOperator(operator);
      if (!queryInput || typeof queryInput !== 'object' || Array.isArray(queryInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe um critério de pesquisa de escolas.');
      }
      const value = queryInput as Record<string, unknown>;
      if (Object.keys(value).some(key => !['name', 'sourceId', 'municipality', 'state'].includes(key))) {
        throw new ApplicationError('INVALID_INPUT', 'Filtro de escolas inválido.');
      }
      const query: { name?: string; sourceId?: string; municipality?: string; state?: string } = {};
      for (const key of ['name', 'sourceId', 'municipality', 'state'] as const) {
        const candidate = value[key];
        if (candidate !== undefined) {
          if (typeof candidate !== 'string' || candidate.trim().length < 2 || candidate.trim().length > 200) {
            throw new ApplicationError('INVALID_INPUT', 'Cada filtro de escola deve ter entre 2 e 200 caracteres.');
          }
          query[key] = candidate.trim();
        }
      }
      if (!Object.keys(query).length || (query.state !== undefined) !== (query.municipality !== undefined)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe nome/código ou município e UF juntos.');
      }
      return readOrWrite(() => deps.store.listSchools(query, 100));
    },
  };
}
