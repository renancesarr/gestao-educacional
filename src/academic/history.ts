import type { InstitutionOperationContext } from '../institution/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export interface AcademicHistory {
  readonly id: string;
  readonly tenantId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly sourceInstitution: string;
  readonly courseName: string;
  readonly academicYear: number;
  readonly period: string;
  readonly subjectName: string;
  readonly workloadHours: number;
  readonly gradeOrConcept: string | null;
  readonly absenceCount: number | null;
  readonly result: string;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AcademicHistoryFields = Omit<AcademicHistory, 'id' | 'tenantId' | 'studentName' | 'createdAt' | 'updatedAt'>;
export interface AcademicHistoryStore {
  create(value: AcademicHistory): Promise<'created' | 'conflict'>;
  list(tenantId: string, studentId?: string): Promise<readonly AcademicHistory[]>;
  get(tenantId: string, id: string): Promise<AcademicHistory | null>;
  update(value: AcademicHistory): Promise<'updated' | 'missing'>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
export interface AcademicHistoryStudentReader {
  get(context: InstitutionOperationContext, studentId: string): Promise<{ id: string; tenantId: string; name: string }>;
}

const fields = ['studentId', 'sourceInstitution', 'courseName', 'academicYear', 'period', 'subjectName', 'workloadHours',
  'gradeOrConcept', 'absenceCount', 'result', 'notes'] as const;
type Parsed = { studentId?: string; sourceInstitution?: string; courseName?: string; academicYear?: number; period?: string;
  subjectName?: string; workloadHours?: number; gradeOrConcept?: string | null; absenceCount?: number | null; result?: string; notes?: string | null };

function parse(input: unknown, partial: boolean): Parsed {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados do histórico inválidos.');
  const value = input as Record<string, unknown>;
  const required = ['studentId', 'sourceInstitution', 'courseName', 'academicYear', 'period', 'subjectName', 'workloadHours', 'result'];
  if (!Object.keys(value).length || Object.keys(value).some(key => !(fields as readonly string[]).includes(key)) ||
      (!partial && required.some(key => !(key in value)))) throw new ApplicationError('INVALID_INPUT', 'Dados do histórico inválidos.');
  const output: Parsed = {};
  for (const key of ['studentId', 'sourceInstitution', 'courseName', 'period', 'subjectName', 'result'] as const) {
    if (!(key in value)) continue;
    const text = typeof value[key] === 'string' ? value[key].trim() : '';
    const maxLength = key === 'period' ? 80 : 200;
    if (!text || text.length > maxLength) throw new ApplicationError('INVALID_INPUT', 'Confira os campos textuais do histórico.');
    output[key] = text;
  }
  if ('academicYear' in value) {
    if (!Number.isSafeInteger(value.academicYear) || Number(value.academicYear) < 1 || Number(value.academicYear) > 9999) {
      throw new ApplicationError('INVALID_INPUT', 'Ano letivo inválido.');
    }
    output.academicYear = value.academicYear as number;
  }
  if ('workloadHours' in value) {
    if (!Number.isSafeInteger(value.workloadHours) || Number(value.workloadHours) <= 0) throw new ApplicationError('INVALID_INPUT', 'Carga horária deve ser positiva.');
    output.workloadHours = value.workloadHours as number;
  }
  if ('gradeOrConcept' in value) {
    const text = value.gradeOrConcept === null ? '' : typeof value.gradeOrConcept === 'string' ? value.gradeOrConcept.trim() : undefined;
    if (text === undefined || text.length > 40) throw new ApplicationError('INVALID_INPUT', 'Nota ou conceito inválido.');
    output.gradeOrConcept = text || null;
  }
  if ('absenceCount' in value) {
    if (value.absenceCount !== null && (!Number.isSafeInteger(value.absenceCount) || Number(value.absenceCount) < 0)) {
      throw new ApplicationError('INVALID_INPUT', 'Quantidade de faltas inválida.');
    }
    output.absenceCount = value.absenceCount as number | null;
  }
  if ('notes' in value) {
    const text = value.notes === null ? '' : typeof value.notes === 'string' ? value.notes.trim() : undefined;
    if (text === undefined || text.length > 2000) throw new ApplicationError('INVALID_INPUT', 'Observações inválidas.');
    output.notes = text || null;
  }
  return output;
}

export function createAcademicHistoryService(deps: { store: AcademicHistoryStore; students: AcademicHistoryStudentReader;
  now: () => Date; newId: () => string }) {
  return {
    async create(context: InstitutionOperationContext, input: unknown): Promise<AcademicHistory> {
      const parsed = parse(input, false);
      const student = await readOrWrite(() => deps.students.get(context, parsed.studentId!));
      if (student.tenantId !== context.tenantId) throw new ApplicationError('NOT_FOUND', 'Aluno não encontrado.');
      const now = deps.now().toISOString();
      const record: AcademicHistory = { id: deps.newId(), tenantId: context.tenantId, studentId: parsed.studentId!,
        sourceInstitution: parsed.sourceInstitution!, courseName: parsed.courseName!, academicYear: parsed.academicYear!,
        period: parsed.period!, subjectName: parsed.subjectName!, workloadHours: parsed.workloadHours!,
        gradeOrConcept: parsed.gradeOrConcept ?? null, absenceCount: parsed.absenceCount ?? null,
        result: parsed.result!, notes: parsed.notes ?? null,
        studentName: student.name, createdAt: now, updatedAt: now };
      if (await readOrWrite(() => deps.store.create(record)) === 'conflict') throw new ApplicationError('CONFLICT', 'Histórico já cadastrado.');
      return record;
    },
    async list(context: InstitutionOperationContext, studentId?: string): Promise<readonly AcademicHistory[]> {
      if (studentId !== undefined && (typeof studentId !== 'string' || !studentId.trim())) throw new ApplicationError('INVALID_INPUT', 'Aluno inválido.');
      if (studentId) {
        const student = await readOrWrite(() => deps.students.get(context, studentId));
        if (student.tenantId !== context.tenantId) throw new ApplicationError('NOT_FOUND', 'Aluno não encontrado.');
      }
      return readOrWrite(() => deps.store.list(context.tenantId, studentId));
    },
    async get(context: InstitutionOperationContext, id: string): Promise<AcademicHistory> {
      const record = await readOrWrite(() => deps.store.get(context.tenantId, id));
      if (!record) throw new ApplicationError('NOT_FOUND', 'Histórico não encontrado.');
      return record;
    },
    async update(context: InstitutionOperationContext, id: string, input: unknown): Promise<AcademicHistory> {
      const changes = parse(input, true);
      const current = await readOrWrite(() => deps.store.get(context.tenantId, id));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Histórico não encontrado.');
      const studentId = changes.studentId ?? current.studentId;
      const student = await readOrWrite(() => deps.students.get(context, studentId));
      if (student.tenantId !== context.tenantId) throw new ApplicationError('NOT_FOUND', 'Aluno não encontrado.');
      const record: AcademicHistory = { ...current, ...changes, studentId, studentName: student.name, updatedAt: deps.now().toISOString() };
      if (await readOrWrite(() => deps.store.update(record)) === 'missing') throw new ApplicationError('NOT_FOUND', 'Histórico não encontrado.');
      return record;
    },
    async delete(context: InstitutionOperationContext, id: string): Promise<void> {
      if (!await readOrWrite(() => deps.store.delete(context.tenantId, id))) throw new ApplicationError('NOT_FOUND', 'Histórico não encontrado.');
    },
  };
}
