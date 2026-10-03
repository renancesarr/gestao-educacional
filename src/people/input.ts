import { ApplicationError } from '../shared/errors.ts';

function invalid(): never {
  throw new ApplicationError('INVALID_INPUT', 'Informe nome e CPF ou identificador institucional válidos.');
}

export function parsePersonInput(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['name', 'cpf', 'institutionalId', 'birthMunicipality', 'birthUf'].includes(key))) invalid();
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 200) invalid();
  return { name: value.name.trim(), ...parseIdentityFields(value), ...parseBirthplace(value) };
}

function parseBirthplace(value: Record<string, unknown>) {
  const hasMunicipality = value.birthMunicipality !== undefined;
  const hasUf = value.birthUf !== undefined;
  if (hasMunicipality !== hasUf) invalid();
  if (!hasMunicipality) return { birthMunicipality: null, birthUf: null };
  if (typeof value.birthMunicipality !== 'string' || !value.birthMunicipality.trim() ||
      value.birthMunicipality.trim().length > 120 || typeof value.birthUf !== 'string' ||
      !/^[A-Za-z]{2}$/.test(value.birthUf.trim())) invalid();
  return { birthMunicipality: value.birthMunicipality.trim(), birthUf: value.birthUf.trim().toUpperCase() };
}

function parseIdentityFields(value: Record<string, unknown>) {
  let cpf: string | null = null;
  if (value.cpf !== undefined) {
    if (typeof value.cpf !== 'string' || !/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value.cpf.trim())) invalid();
    cpf = value.cpf.replace(/[.\-\s]/g, '');
  }
  let institutionalId: string | null = null;
  if (value.institutionalId !== undefined) {
    if (typeof value.institutionalId !== 'string' || !value.institutionalId.trim() || value.institutionalId.trim().length > 100) invalid();
    institutionalId = value.institutionalId.trim();
  }
  if (!cpf && !institutionalId) invalid();
  return { cpf, institutionalId };
}

export type PersonIdentifier = { cpf: string } | { institutionalId: string };

export function parsePersonIdentifier(input: unknown): PersonIdentifier {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value);
  if (keys.length !== 1 || !keys.every(key => key === 'cpf' || key === 'institutionalId')) invalid();
  const fields = parseIdentityFields(value);
  if (fields.cpf !== null) return { cpf: fields.cpf };
  return { institutionalId: fields.institutionalId! };
}

export function parsePersonSearchFilters(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !['cpf', 'name', 'birthMunicipality', 'birthUf'].includes(key))) invalid();
  const result: { cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string } = {};
  if (value.cpf !== undefined) {
    if (typeof value.cpf !== 'string') invalid();
    const identifier = parsePersonIdentifier({ cpf: value.cpf.trim() });
    if (!('cpf' in identifier)) invalid();
    result.cpf = identifier.cpf;
  }
  for (const key of ['name', 'birthMunicipality'] as const) {
    const item = value[key];
    if (item === undefined) continue;
    if (typeof item !== 'string' || item.trim().length > 100) invalid();
    if (item.trim()) result[key] = item.trim();
  }
  if (value.birthUf !== undefined) {
    if (typeof value.birthUf !== 'string' || !/^[A-Za-z]{2}$/.test(value.birthUf.trim())) invalid();
    result.birthUf = value.birthUf.trim().toUpperCase();
  }
  return result;
}
