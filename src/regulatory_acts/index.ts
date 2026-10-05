import type { InstitutionOperationContext } from '../institution/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export type RegulatoryActStatus = 'ativo' | 'vencido' | 'suspenso' | 'revogado';
export type RegulatoryActTarget = 'institution' | 'course';
export type RegulatoryActOperation = 'matricula' | 'diploma' | 'historico' | 'comprovante';

export interface RegulatoryActVersion {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly status: RegulatoryActStatus;
}

export interface RegulatoryAct {
  readonly id: string;
  readonly tenantId: string;
  readonly target: RegulatoryActTarget;
  readonly courseId?: string;
  readonly currentVersionId: string;
  readonly versions: readonly RegulatoryActVersion[];
  readonly text: string;
  readonly status: RegulatoryActStatus;
}

export interface RegulatoryActStore {
  create(act: RegulatoryAct): Promise<void>;
  list(tenantId: string, filter: { target?: RegulatoryActTarget; courseId?: string }): Promise<readonly RegulatoryAct[]>;
  get(tenantId: string, actId: string): Promise<RegulatoryAct | null>;
  update(tenantId: string, actId: string, change: {
    readonly text?: string;
    readonly status?: RegulatoryActStatus;
    readonly preservePreviousVersion: boolean;
    readonly newVersionId: string;
  }): Promise<RegulatoryAct | null>;
  registerUse(tenantId: string, actId: string, versionId: string, operation: {
    readonly operationType: RegulatoryActOperation;
    readonly operationId: string;
  }): Promise<boolean>;
  delete(tenantId: string, actId: string): Promise<'deleted' | 'missing' | 'used'>;
}

export interface RegulatoryActCourseReader {
  belongsToTenant(tenantId: string, courseId: string): Promise<boolean>;
}

function parseText(input: unknown): string {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text) throw new ApplicationError('INVALID_INPUT', 'Informe o texto do ato.');
  return text;
}

function parseStatus(input: unknown): RegulatoryActStatus {
  if (input === 'ativo' || input === 'vencido' || input === 'suspenso' || input === 'revogado') return input;
  throw new ApplicationError('INVALID_INPUT', 'Status do ato inválido.');
}

function parseTarget(input: unknown): RegulatoryActTarget {
  if (input === 'institution' || input === 'course') return input;
  throw new ApplicationError('INVALID_INPUT', 'Selecione se o ato pertence à instituição ou ao curso.');
}

export function createRegulatoryActsService(deps: {
  readonly store: RegulatoryActStore;
  readonly courses: RegulatoryActCourseReader;
  readonly newId: () => string;
}) {
  async function readAct(tenantId: string, actId: string) {
    const act = await readOrWrite(() => deps.store.get(tenantId, actId));
    if (!act) throw new ApplicationError('NOT_FOUND', 'Ato não encontrado.');
    return act;
  }

  return {
    async create(context: InstitutionOperationContext, input: unknown): Promise<RegulatoryAct> {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados do ato inválidos.');
      const value = input as Record<string, unknown>;
      if (Object.keys(value).some(key => !['target', 'courseId', 'text', 'status'].includes(key))) {
        throw new ApplicationError('INVALID_INPUT', 'Dados do ato inválidos.');
      }
      const target = parseTarget(value.target);
      const text = parseText(value.text);
      const status = parseStatus(value.status);
      let courseId: string | undefined;
      if (target === 'course') {
        if (typeof value.courseId !== 'string' || !value.courseId.trim()) throw new ApplicationError('INVALID_INPUT', 'Selecione o curso do ato.');
        courseId = value.courseId.trim();
        if (!await deps.courses.belongsToTenant(context.tenantId, courseId)) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      } else if ('courseId' in value) {
        throw new ApplicationError('INVALID_INPUT', 'Ato da instituição não pode indicar um curso.');
      }
      const versionId = deps.newId();
      const act: RegulatoryAct = { id: deps.newId(), tenantId: context.tenantId, target,
        ...(courseId ? { courseId } : {}), currentVersionId: versionId,
        versions: [{ id: versionId, number: 1, text, status }], text, status };
      await readOrWrite(() => deps.store.create(act));
      return act;
    },

    async list(context: InstitutionOperationContext, filter: { target?: RegulatoryActTarget; courseId?: string } = {}) {
      if (filter.target !== undefined) parseTarget(filter.target);
      if (filter.courseId !== undefined && (typeof filter.courseId !== 'string' || !filter.courseId.trim())) {
        throw new ApplicationError('INVALID_INPUT', 'Filtro de curso inválido.');
      }
      return readOrWrite(() => deps.store.list(context.tenantId, {
        ...(filter.target ? { target: filter.target } : {}),
        ...(filter.courseId ? { courseId: filter.courseId.trim() } : {}),
      }));
    },

    async get(context: InstitutionOperationContext, actId: string) {
      return readAct(context.tenantId, actId);
    },

    async update(context: InstitutionOperationContext, actId: string, input: unknown) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados do ato inválidos.');
      const value = input as Record<string, unknown>;
      const allowed = ['text', 'status', 'preservePreviousVersion'];
      if (!Object.keys(value).length || Object.keys(value).some(key => !allowed.includes(key)) ||
          typeof value.preservePreviousVersion !== 'boolean') throw new ApplicationError('INVALID_INPUT', 'Dados da edição do ato inválidos.');
      const current = await readAct(context.tenantId, actId);
      const text = 'text' in value ? parseText(value.text) : undefined;
      const status = 'status' in value ? parseStatus(value.status) : undefined;
      if (text === undefined && status === undefined) throw new ApplicationError('INVALID_INPUT', 'Informe o texto ou status a alterar.');
      const updated = await readOrWrite(() => deps.store.update(context.tenantId, actId, {
        ...(text !== undefined ? { text } : {}), ...(status !== undefined ? { status } : {}),
        preservePreviousVersion: value.preservePreviousVersion as boolean,
        newVersionId: value.preservePreviousVersion ? deps.newId() : current.currentVersionId,
      }));
      if (!updated) throw new ApplicationError('NOT_FOUND', 'Ato não encontrado.');
      return updated;
    },

    async registerUse(context: InstitutionOperationContext, actId: string, versionId: string, input: {
      readonly operationType: RegulatoryActOperation;
      readonly operationId: string;
    }) {
      const operations: readonly string[] = ['matricula', 'diploma', 'historico', 'comprovante'];
      if (!input || !operations.includes(input.operationType) || typeof input.operationId !== 'string' || !input.operationId.trim()) {
        throw new ApplicationError('INVALID_INPUT', 'Referência da operação inválida.');
      }
      const act = await readAct(context.tenantId, actId);
      if (!act.versions.some(version => version.id === versionId)) throw new ApplicationError('NOT_FOUND', 'Ato ou versão não encontrado.');
      const recorded = await readOrWrite(() => deps.store.registerUse(context.tenantId, actId, versionId, {
        operationType: input.operationType, operationId: input.operationId.trim(),
      }));
      if (!recorded) throw new ApplicationError('NOT_FOUND', 'Ato ou versão não encontrado.');
    },

    async delete(context: InstitutionOperationContext, actId: string) {
      const result = await readOrWrite(() => deps.store.delete(context.tenantId, actId));
      if (result === 'missing') throw new ApplicationError('NOT_FOUND', 'Ato não encontrado.');
      if (result === 'used') throw new ApplicationError('CONFLICT', 'Atos utilizados em matrículas ou documentos não podem ser excluídos.');
    },
  };
}
