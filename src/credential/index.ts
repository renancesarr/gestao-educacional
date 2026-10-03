import { createHash } from 'node:crypto';
import type { InstitutionOperationContext } from '../institution/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export type CredentialType = 'certificado' | 'diploma';
export interface Credential {
  readonly id: string;
  readonly tenantId: string;
  readonly studentId: string;
  readonly courseId: string;
  readonly type: CredentialType;
  readonly issuedOn: string;
  readonly holderName: string;
  readonly courseName: string;
  readonly institutionName: string;
  readonly contentHash: string;
  readonly validationToken: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CredentialStore {
  create(value: Credential): Promise<'created' | 'conflict'>;
  list(tenantId: string): Promise<readonly Credential[]>;
  get(tenantId: string, id: string): Promise<Credential | null>;
  update(value: Credential): Promise<'updated' | 'missing'>;
  delete(tenantId: string, id: string): Promise<boolean>;
  findByToken(token: string): Promise<Credential | null>;
}

export interface CredentialStudentReader {
  get(context: InstitutionOperationContext, studentId: string): Promise<{ id: string; tenantId: string; name: string }>;
}
export interface CredentialCourseReader {
  get(context: InstitutionOperationContext, courseId: string): Promise<{ id: string; tenantId: string; name: string; institutionName: string }>;
}

function parseDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) ||
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) {
    throw new ApplicationError('INVALID_INPUT', 'Data de emissão inválida.');
  }
  return value;
}

function parseCreate(input: unknown): { studentId: string; courseId: string; type: CredentialType; issuedOn: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da credencial inválidos.');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== 4 || Object.keys(value).some(key => !['studentId', 'courseId', 'type', 'issuedOn'].includes(key)) ||
      typeof value.studentId !== 'string' || !value.studentId || typeof value.courseId !== 'string' || !value.courseId ||
      (value.type !== 'certificado' && value.type !== 'diploma')) {
    throw new ApplicationError('INVALID_INPUT', 'Dados da credencial inválidos.');
  }
  return { studentId: value.studentId, courseId: value.courseId, type: value.type, issuedOn: parseDate(value.issuedOn) };
}

function parseUpdate(input: unknown): { type?: CredentialType; issuedOn?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da credencial inválidos.');
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value);
  if (!keys.length || keys.some(key => !['type', 'issuedOn'].includes(key))) throw new ApplicationError('INVALID_INPUT', 'Dados da credencial inválidos.');
  const update: { type?: CredentialType; issuedOn?: string } = {};
  if ('type' in value) {
    if (value.type !== 'certificado' && value.type !== 'diploma') throw new ApplicationError('INVALID_INPUT', 'Tipo de credencial inválido.');
    update.type = value.type;
  }
  if ('issuedOn' in value) update.issuedOn = parseDate(value.issuedOn);
  return update;
}

function payloadHash(value: Pick<Credential, 'type' | 'issuedOn' | 'holderName' | 'courseName' | 'institutionName'>): string {
  return createHash('sha256').update(JSON.stringify({ type: value.type, issuedOn: value.issuedOn,
    holderName: value.holderName, courseName: value.courseName, institutionName: value.institutionName })).digest('hex');
}

export function createCredentialService(deps: { store: CredentialStore; students: CredentialStudentReader; courses: CredentialCourseReader;
  now: () => Date; newId: () => string; newToken: () => string }) {
  return {
    async create(context: InstitutionOperationContext, input: unknown): Promise<Credential> {
      const parsed = parseCreate(input);
      const [student, course] = await Promise.all([
        readOrWrite(() => deps.students.get(context, parsed.studentId)),
        readOrWrite(() => deps.courses.get(context, parsed.courseId)),
      ]);
      if (student.tenantId !== context.tenantId || course.tenantId !== context.tenantId) {
        throw new ApplicationError('NOT_FOUND', 'Aluno ou curso não encontrado.');
      }
      const now = deps.now().toISOString();
      const base = { id: deps.newId(), tenantId: context.tenantId, studentId: student.id, courseId: course.id,
        type: parsed.type, issuedOn: parsed.issuedOn, holderName: student.name, courseName: course.name,
        institutionName: course.institutionName, createdAt: now, updatedAt: now };
      const credential: Credential = { ...base, contentHash: payloadHash(base), validationToken: deps.newToken() };
      const result = await readOrWrite(() => deps.store.create(credential));
      if (result === 'conflict') throw new ApplicationError('CONFLICT', 'Não foi possível gerar um token único para a credencial.');
      return credential;
    },
    async list(context: InstitutionOperationContext): Promise<readonly Credential[]> {
      return readOrWrite(() => deps.store.list(context.tenantId));
    },
    async get(context: InstitutionOperationContext, id: string): Promise<Credential> {
      const credential = await readOrWrite(() => deps.store.get(context.tenantId, id));
      if (!credential) throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
      return credential;
    },
    async update(context: InstitutionOperationContext, id: string, input: unknown): Promise<Credential> {
      const update = parseUpdate(input);
      const current = await readOrWrite(() => deps.store.get(context.tenantId, id));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
      const base = { ...current, ...update, updatedAt: deps.now().toISOString() };
      const credential: Credential = { ...base, contentHash: payloadHash(base), validationToken: deps.newToken() };
      if (await readOrWrite(() => deps.store.update(credential)) === 'missing') throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
      return credential;
    },
    async delete(context: InstitutionOperationContext, id: string): Promise<void> {
      if (!await readOrWrite(() => deps.store.delete(context.tenantId, id))) throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
    },
    async validate(token: string) {
      if (!token || token.length > 256) throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
      const credential = await readOrWrite(() => deps.store.findByToken(token));
      if (!credential || payloadHash(credential) !== credential.contentHash) throw new ApplicationError('NOT_FOUND', 'Credencial não encontrada.');
      return { status: 'valida' as const, type: credential.type, holderName: credential.holderName,
        courseName: credential.courseName, institutionName: credential.institutionName,
        issuedOn: credential.issuedOn, demonstrative: true as const };
    },
  };
}
