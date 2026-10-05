import { ApplicationError, readOrWrite } from '../shared/errors.ts';
import type { InstitutionOperationContext } from './operation-context.ts';
import type { Person } from '../people/index.ts';

export type InstitutionImageType = 'image/png' | 'image/svg+xml';
export type DocumentAssetKind = 'logo' | 'signature' | 'stamp';
export type ReadinessRequirement = 'logo' | 'director' | 'recordsOfficer' | 'signature' | 'stamp';

export interface InstitutionImage {
  readonly mediaType: InstitutionImageType;
  readonly bytes: Uint8Array;
}

export interface InstitutionEmployee {
  readonly id: string;
  readonly tenantId: string;
  readonly personId: string;
  readonly personName: string;
  readonly active: boolean;
  readonly administrative: true;
  readonly createdAt: string;
  readonly signatureConfigured: boolean;
  readonly stampConfigured: boolean;
}

export interface InstitutionDocumentProfile {
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly logoConfigured: boolean;
  readonly logoMediaType: InstitutionImageType | null;
  readonly employees: readonly InstitutionEmployee[];
  readonly director: InstitutionEmployee | null;
  readonly recordsOfficer: InstitutionEmployee | null;
  readonly signatureConfigured: boolean;
  readonly stampConfigured: boolean;
  readonly readiness: { readonly ready: boolean; readonly missing: readonly ReadinessRequirement[] };
}

export interface StoredDocumentAsset extends InstitutionImage {
  readonly filename: string;
}

export type EmployeeCreation = Pick<InstitutionEmployee, 'id' | 'tenantId' | 'personId' | 'personName' | 'createdAt'>;

export interface InstitutionDocumentProfileStore {
  getProfile(tenantId: string): Promise<Omit<InstitutionDocumentProfile, 'readiness'> | null>;
  saveLogo(tenantId: string, image: InstitutionImage): Promise<boolean>;
  createEmployee(employee: EmployeeCreation): Promise<'created' | 'duplicate' | 'missing-person'>;
  listEmployees(tenantId: string): Promise<readonly InstitutionEmployee[]>;
  updateEmployee(tenantId: string, employeeId: string, active: boolean): Promise<InstitutionEmployee | null>;
  deleteEmployee(tenantId: string, employeeId: string): Promise<'deleted' | 'missing' | 'assigned'>;
  assignPositions(tenantId: string, directorId: string | null, recordsOfficerId: string | null): Promise<'updated' | 'invalid-director' | 'invalid-records'>;
  saveEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp', image: InstitutionImage): Promise<'saved' | 'missing-employee' | 'inactive-employee'>;
  getAsset(tenantId: string, kind: 'logo'): Promise<StoredDocumentAsset | null>;
  getEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp'): Promise<StoredDocumentAsset | null>;
  deleteAsset(tenantId: string, kind: 'logo'): Promise<boolean>;
  deleteEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp'): Promise<boolean>;
}

export function validateInstitutionImage(kind: DocumentAssetKind, mediaType: string, bytes: Uint8Array): InstitutionImage {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > 2 * 1024 * 1024) {
    throw new ApplicationError('INVALID_INPUT', 'O arquivo deve ter conteúdo e não pode exceder 2 MB.');
  }
  if (kind === 'logo' && mediaType === 'image/svg+xml') {
    validateSvg(bytes);
    return { mediaType, bytes: new Uint8Array(bytes) };
  }
  if (mediaType !== 'image/png' || !isValidPng(bytes)) {
    throw new ApplicationError('INVALID_INPUT', kind === 'logo'
      ? 'A marca deve ser um PNG ou SVG válido.'
      : 'A assinatura e o carimbo devem ser PNG válidos.');
  }
  return { mediaType: 'image/png', bytes: new Uint8Array(bytes) };
}

function isValidPng(bytes: Uint8Array): boolean {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 57 || signature.some((value, index) => bytes[index] !== value)) return false;
  let offset = 8;
  let sawHeader = false;
  let sawData = false;
  let sawEnd = false;
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    if (length > bytes.length - offset - 12) return false;
    const name = String.fromCharCode(bytes[offset + 4]!, bytes[offset + 5]!, bytes[offset + 6]!, bytes[offset + 7]!);
    const chunkEnd = offset + length + 12;
    const expectedCrc = readU32(bytes, offset + 8 + length);
    if (crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== expectedCrc) return false;
    if (!sawHeader) {
      if (name !== 'IHDR' || length !== 13) return false;
      const width = readU32(bytes, offset + 8);
      const height = readU32(bytes, offset + 12);
      if (!width || !height || width > 10000 || height > 10000) return false;
      sawHeader = true;
    } else if (name === 'IHDR') return false;
    if (name === 'IDAT' && length > 0) sawData = true;
    if (name === 'IEND') {
      if (length !== 0 || chunkEnd !== bytes.length) return false;
      sawEnd = true;
      break;
    }
    offset = chunkEnd;
  }
  return sawHeader && sawData && sawEnd;
}

function readU32(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! * 0x1000000 + (bytes[offset + 1]! << 16) + (bytes[offset + 2]! << 8) + bytes[offset + 3]!;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validateSvg(bytes: Uint8Array): void {
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new ApplicationError('INVALID_INPUT', 'O arquivo SVG deve conter texto UTF-8 válido.'); }
  const normalized = source.replace(/^\uFEFF/, '').trim();
  if (!/^<svg(?:\s|>)/i.test(normalized.replace(/^<\?xml[^>]*>\s*/i, '')) ||
      /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed|image|audio|video)\b|\bon[a-z]+\s*=|\b(?:href|src)\s*=|url\s*\(|@import\b|javascript:/i.test(normalized)) {
    throw new ApplicationError('INVALID_INPUT', 'O SVG contém elementos ou referências não permitidos.');
  }
}

function readiness(profile: Omit<InstitutionDocumentProfile, 'readiness'>): InstitutionDocumentProfile['readiness'] {
  const missing: ReadinessRequirement[] = [];
  if (!profile.logoConfigured) missing.push('logo');
  if (!profile.director?.active || !profile.director.administrative) missing.push('director');
  if (!profile.recordsOfficer?.active || !profile.recordsOfficer.administrative) missing.push('recordsOfficer');
  if (!profile.signatureConfigured) missing.push('signature');
  if (!profile.stampConfigured) missing.push('stamp');
  return { ready: missing.length === 0, missing };
}

function parsePersonId(input: unknown): string {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 100) {
    throw new ApplicationError('INVALID_INPUT', 'Selecione uma pessoa cadastrada na instituição.');
  }
  return input.trim();
}

function parseEmployeeId(input: unknown, nullable = false): string | null {
  if (nullable && input === null) return null;
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 100) {
    throw new ApplicationError('INVALID_INPUT', 'Selecione um funcionário válido.');
  }
  return input.trim();
}

export function createInstitutionDocumentProfileService(dependencies: {
  store: InstitutionDocumentProfileStore;
  people: { get(context: InstitutionOperationContext, id: string): Promise<Person> };
  now: () => Date;
  newId: () => string;
}) {
  return {
    async getProfile(context: InstitutionOperationContext): Promise<InstitutionDocumentProfile> {
      const profile = await readOrWrite(() => dependencies.store.getProfile(context.tenantId));
      if (!profile) throw new ApplicationError('NOT_FOUND', 'Instituição não encontrada.');
      return { ...profile, readiness: readiness(profile) };
    },
    async saveLogo(context: InstitutionOperationContext, mediaType: string, bytes: Uint8Array): Promise<void> {
      const image = validateInstitutionImage('logo', mediaType, bytes);
      if (!await readOrWrite(() => dependencies.store.saveLogo(context.tenantId, image))) {
        throw new ApplicationError('NOT_FOUND', 'Instituição não encontrada.');
      }
    },
    async createEmployee(context: InstitutionOperationContext, input: unknown): Promise<InstitutionEmployee> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'personId')) {
        throw new ApplicationError('INVALID_INPUT', 'Informe somente a pessoa a vincular como funcionário administrativo.');
      }
      const person = await dependencies.people.get(context, parsePersonId((input as { personId?: unknown }).personId));
      const employee: EmployeeCreation = { id: dependencies.newId(), tenantId: context.tenantId,
        personId: person.id, personName: person.name, createdAt: dependencies.now().toISOString() };
      const result = await readOrWrite(() => dependencies.store.createEmployee(employee));
      if (result === 'duplicate') throw new ApplicationError('CONFLICT', 'A pessoa já está vinculada como funcionário desta instituição.');
      if (result === 'missing-person') throw new ApplicationError('NOT_FOUND', 'Pessoa não encontrada nesta instituição.');
      return { ...employee, active: true, administrative: true, signatureConfigured: false, stampConfigured: false };
    },
    async listEmployees(context: InstitutionOperationContext): Promise<readonly InstitutionEmployee[]> {
      const profile = await readOrWrite(() => dependencies.store.getProfile(context.tenantId));
      if (!profile) throw new ApplicationError('NOT_FOUND', 'Instituição não encontrada.');
      return profile.employees;
    },
    async updateEmployee(context: InstitutionOperationContext, employeeId: string, input: unknown): Promise<InstitutionEmployee> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 ||
          typeof (input as { active?: unknown }).active !== 'boolean') {
        throw new ApplicationError('INVALID_INPUT', 'Informe a situação ativa do funcionário.');
      }
      const updated = await readOrWrite(() => dependencies.store.updateEmployee(context.tenantId,
        parseEmployeeId(employeeId)!, (input as { active: boolean }).active));
      if (!updated) throw new ApplicationError('NOT_FOUND', 'Funcionário não encontrado.');
      return updated;
    },
    async deleteEmployee(context: InstitutionOperationContext, employeeId: string): Promise<void> {
      const result = await readOrWrite(() => dependencies.store.deleteEmployee(context.tenantId, parseEmployeeId(employeeId)!));
      if (result === 'missing') throw new ApplicationError('NOT_FOUND', 'Funcionário não encontrado.');
      if (result === 'assigned') throw new ApplicationError('CONFLICT', 'Designe outro diretor e responsável antes de remover este funcionário.');
    },
    async assignPositions(context: InstitutionOperationContext, input: unknown): Promise<InstitutionDocumentProfile> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 2 ||
          !('directorEmployeeId' in input) || !('recordsOfficerEmployeeId' in input)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe o diretor e o responsável pelos registros acadêmicos.');
      }
      const value = input as { directorEmployeeId: unknown; recordsOfficerEmployeeId: unknown };
      const directorId = parseEmployeeId(value.directorEmployeeId, true);
      const recordsOfficerId = parseEmployeeId(value.recordsOfficerEmployeeId, true);
      const result = await readOrWrite(() => dependencies.store.assignPositions(context.tenantId, directorId, recordsOfficerId));
      if (result === 'invalid-director') throw new ApplicationError('INVALID_INPUT', 'O diretor deve ser funcionário administrativo ativo desta instituição.');
      if (result === 'invalid-records') throw new ApplicationError('INVALID_INPUT', 'O responsável pelos registros deve ser funcionário administrativo ativo desta instituição.');
      return this.getProfile(context);
    },
    async saveEmployeeAsset(context: InstitutionOperationContext, employeeId: string, kind: 'signature' | 'stamp', mediaType: string, bytes: Uint8Array): Promise<void> {
      const image = validateInstitutionImage(kind, mediaType, bytes);
      const result = await readOrWrite(() => dependencies.store.saveEmployeeAsset(context.tenantId, parseEmployeeId(employeeId)!, kind, image));
      if (result === 'missing-employee') throw new ApplicationError('NOT_FOUND', 'Funcionário não encontrado nesta instituição.');
      if (result === 'inactive-employee') throw new ApplicationError('INVALID_INPUT', 'Ative o funcionário antes de configurar seus ativos documentais.');
    },
    async getAsset(context: InstitutionOperationContext, kind: 'logo'): Promise<StoredDocumentAsset> {
      const asset = await readOrWrite(() => dependencies.store.getAsset(context.tenantId, kind));
      if (!asset) throw new ApplicationError('NOT_FOUND', 'Imagem institucional não encontrada.');
      return asset;
    },
    async getEmployeeAsset(context: InstitutionOperationContext, employeeId: string, kind: 'signature' | 'stamp'): Promise<StoredDocumentAsset> {
      const asset = await readOrWrite(() => dependencies.store.getEmployeeAsset(context.tenantId, parseEmployeeId(employeeId)!, kind));
      if (!asset) throw new ApplicationError('NOT_FOUND', 'Ativo documental do funcionário não encontrado.');
      return asset;
    },
    async deleteAsset(context: InstitutionOperationContext, kind: 'logo'): Promise<void> {
      if (!await readOrWrite(() => dependencies.store.deleteAsset(context.tenantId, kind))) {
        throw new ApplicationError('NOT_FOUND', 'Imagem institucional não encontrada.');
      }
    },
    async deleteEmployeeAsset(context: InstitutionOperationContext, employeeId: string, kind: 'signature' | 'stamp'): Promise<void> {
      if (!await readOrWrite(() => dependencies.store.deleteEmployeeAsset(context.tenantId, parseEmployeeId(employeeId)!, kind))) {
        throw new ApplicationError('NOT_FOUND', 'Ativo documental do funcionário não encontrado.');
      }
    },
  };
}
