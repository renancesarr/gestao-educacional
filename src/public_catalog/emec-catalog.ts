import { ApplicationError } from '../shared/errors.ts';
import type { EmecCourseRecord, EmecCsvResult, EmecInstitutionRecord } from './emec-csv.ts';

export interface EmecCatalogVersion {
  readonly id: string;
  readonly edition: string;
  readonly collectedAt: string;
  readonly source: 'EMEC_DADOS_ABERTOS';
  readonly state: 'REVIEW' | 'APPLIED';
  readonly completeness: 'COMPLETE' | 'PARTIAL';
  readonly institutionCount: number;
  readonly courseCount: number;
  readonly duplicateCount: number;
  readonly rejectedCount: number;
  readonly conflictCount: number;
  readonly appliedAt?: string;
  readonly issues: readonly { readonly kind: 'REJECTED' | 'CONFLICT'; readonly source: 'institutions' | 'courses'; readonly line: number; readonly reason: string }[];
}

export interface EmecCatalogQuery {
  readonly name?: string;
  readonly municipality?: string;
  readonly state?: string;
  readonly course?: string;
}

export interface EmecCatalogSearchResult {
  readonly institutions: readonly EmecInstitutionRecord[];
  readonly courses: readonly EmecCourseRecord[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalInstitutions: number;
  readonly totalCourses: number;
  readonly totalPages: number;
}

export interface EmecCatalogStore {
  beginPreview(version: EmecCatalogVersion): Promise<void>;
  addInstitution(versionId: string, value: EmecInstitutionRecord): Promise<'created' | 'duplicate' | 'conflict'>;
  addCourse(versionId: string, value: EmecCourseRecord): Promise<'created' | 'duplicate' | 'conflict'>;
  listInstitutionCodes(versionId: string): Promise<readonly string[]>;
  addIssue(versionId: string, issue: { kind: 'REJECTED' | 'CONFLICT'; source: 'institutions' | 'courses'; line: number; reason: string }): Promise<void>;
  completePreview(version: EmecCatalogVersion): Promise<void>;
  abortPreview(): Promise<void>;
  getVersion(id: string): Promise<EmecCatalogVersion | null>;
  applyVersion(id: string, appliedAt: string): Promise<EmecCatalogVersion | null>;
  listCurrentInstitutions(): Promise<readonly EmecInstitutionRecord[]>;
  listCurrentCourses(): Promise<readonly EmecCourseRecord[]>;
  searchCurrent(query: EmecCatalogQuery, page: number, pageSize: number): Promise<Omit<EmecCatalogSearchResult, 'page' | 'pageSize' | 'totalPages'>>;
}

export function createEmecCatalogService(deps: { store: EmecCatalogStore; newId: () => string }) {
  return {
    async preview(operator: { accountId: string; role: string }, input: {
      edition: string; collectedAt: string; institutions: AsyncIterable<EmecCsvResult>; courses: AsyncIterable<EmecCsvResult>;
    }): Promise<EmecCatalogVersion> {
      if (!operator || operator.role !== 'SUPER_ADMIN' || !operator.accountId) {
        throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      }
      if (!input || typeof input.edition !== 'string' || !input.edition.trim() || input.edition.trim().length > 100 ||
          typeof input.collectedAt !== 'string' || !Number.isFinite(Date.parse(input.collectedAt)) ||
          !input.institutions || !input.courses || typeof input.institutions[Symbol.asyncIterator] !== 'function' ||
          typeof input.courses[Symbol.asyncIterator] !== 'function') {
        throw new ApplicationError('INVALID_INPUT', 'Informe edição, data de coleta e os dois arquivos e-MEC.');
      }
      let version: EmecCatalogVersion = {
        id: deps.newId(), edition: input.edition.trim(), collectedAt: new Date(input.collectedAt).toISOString(),
        source: 'EMEC_DADOS_ABERTOS', state: 'REVIEW', completeness: 'COMPLETE', institutionCount: 0, courseCount: 0,
        duplicateCount: 0, rejectedCount: 0, conflictCount: 0, issues: [],
      };
      const issues: Array<{ kind: 'REJECTED' | 'CONFLICT'; source: 'institutions' | 'courses'; line: number; reason: string }> = [];
      let duplicates = 0; let rejected = 0; let conflicts = 0; let institutionCount = 0; let courseCount = 0;
      const remember = async (source: 'institutions' | 'courses', line: number, reason: string) => {
        rejected++;
        const issue = { kind: 'REJECTED' as const, source, line, reason };
        if (issues.length < 100) issues.push(issue);
        await deps.store.addIssue(version.id, issue);
      };
      try {
        await deps.store.beginPreview(version);
        for await (const row of input.institutions) {
          if (row.type === 'rejected') { await remember('institutions', row.line, row.reason); continue; }
          if (row.type !== 'institution') throw new ApplicationError('INVALID_INPUT', 'Arquivo de IES contém linha de curso.');
          const result = await deps.store.addInstitution(version.id, row.value);
          if (result === 'created') institutionCount++;
          else if (result === 'duplicate') duplicates++;
          else {
            conflicts++;
            const issue = { kind: 'CONFLICT' as const, source: 'institutions' as const, line: row.line,
              reason: `Código de IES ${row.value.sourceId} repetido com dados divergentes.` };
            if (issues.length < 100) issues.push(issue);
            await deps.store.addIssue(version.id, issue);
          }
        }
        const institutionCodes = new Set(await deps.store.listInstitutionCodes(version.id));
        for await (const row of input.courses) {
          if (row.type === 'rejected') { await remember('courses', row.line, row.reason); continue; }
          if (row.type !== 'course') throw new ApplicationError('INVALID_INPUT', 'Arquivo de cursos contém linha de IES.');
          if (!institutionCodes.has(row.value.institutionCode)) {
            await remember('courses', row.line, `Curso ${row.value.sourceId} referencia IES ausente: ${row.value.institutionCode}.`);
            continue;
          }
          const result = await deps.store.addCourse(version.id, row.value);
          if (result === 'created') courseCount++;
          else if (result === 'duplicate') duplicates++;
          else {
            conflicts++;
            const issue = { kind: 'CONFLICT' as const, source: 'courses' as const, line: row.line,
              reason: `Oferta do curso ${row.value.sourceId} na localidade ${row.value.municipalityCode ?? row.value.state ?? 'sem localidade'} repetida com dados divergentes.` };
            if (issues.length < 100) issues.push(issue);
            await deps.store.addIssue(version.id, issue);
          }
        }
        version = { ...version, institutionCount, courseCount, duplicateCount: duplicates,
          rejectedCount: rejected, conflictCount: conflicts, completeness: rejected + conflicts ? 'PARTIAL' : 'COMPLETE',
        issues };
        await deps.store.completePreview(version);
        return version;
      } catch (error) {
        await deps.store.abortPreview();
        throw error;
      }
    },
    async apply(operator: { accountId: string; role: string }, id: string) {
      if (!operator || operator.role !== 'SUPER_ADMIN' || !operator.accountId) throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      if (!id.trim()) throw new ApplicationError('INVALID_INPUT', 'Versão inválida.');
      const version = await deps.store.getVersion(id);
      if (!version) throw new ApplicationError('NOT_FOUND', 'Versão e-MEC não encontrada.');
      if (version.state !== 'REVIEW') throw new ApplicationError('CONFLICT', 'Esta versão já foi aplicada.');
      if (!version.institutionCount && !version.courseCount) throw new ApplicationError('CONFLICT', 'A versão não contém registros válidos para aplicação.');
      const applied = await deps.store.applyVersion(id, new Date().toISOString());
      if (!applied) throw new ApplicationError('CONFLICT', 'Esta versão já foi aplicada.');
      return applied;
    },
    async getVersion(operator: { accountId: string; role: string }, id: string) {
      if (!operator || operator.role !== 'SUPER_ADMIN' || !operator.accountId) throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      return deps.store.getVersion(id);
    },
    async search(operator: { accountId: string; role: string }, queryInput: unknown, paginationInput: unknown): Promise<EmecCatalogSearchResult> {
      if (!operator || operator.role !== 'SUPER_ADMIN' || !operator.accountId) throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      if (!queryInput || typeof queryInput !== 'object' || Array.isArray(queryInput) ||
          Object.keys(queryInput).some(key => !['name', 'municipality', 'state', 'course'].includes(key))) {
        throw new ApplicationError('INVALID_INPUT', 'Filtros de consulta e-MEC inválidos.');
      }
      const raw = queryInput as Record<string, unknown>;
      const query: EmecCatalogQuery = {};
      const normalized: Record<string, string> = {};
      for (const key of ['name', 'municipality', 'state', 'course'] as const) {
        const value = raw[key];
        if (value === undefined) continue;
        if (typeof value !== 'string' || value.trim().length > 100) throw new ApplicationError('INVALID_INPUT', 'Filtros de consulta e-MEC inválidos.');
        if (value.trim()) normalized[key] = key === 'state' ? value.trim().toUpperCase() : value.trim();
      }
      if (Boolean(normalized.municipality) !== Boolean(normalized.state) ||
          (normalized.state && !/^[A-Z]{2}$/.test(normalized.state))) {
        throw new ApplicationError('INVALID_INPUT', 'Informe município e UF juntos usando a sigla da UF.');
      }
      Object.assign(query, normalized);
      if (!paginationInput || typeof paginationInput !== 'object' || Array.isArray(paginationInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Paginação inválida.');
      }
      const { page, pageSize } = paginationInput as Record<string, unknown>;
      if (!Number.isSafeInteger(page) || (page as number) < 1 || !Number.isSafeInteger(pageSize) ||
          (pageSize as number) < 1 || (pageSize as number) > 100) {
        throw new ApplicationError('INVALID_INPUT', 'A página deve ser positiva e o tamanho deve ficar entre 1 e 100.');
      }
      const result = await deps.store.searchCurrent(query, page as number, pageSize as number);
      return { ...result, page: page as number, pageSize: pageSize as number,
        totalPages: Math.max(1, Math.ceil(Math.max(result.totalInstitutions, result.totalCourses) / (pageSize as number))) };
    },
    async current() { return { institutions: await deps.store.listCurrentInstitutions(), courses: await deps.store.listCurrentCourses() }; },
  };
}
