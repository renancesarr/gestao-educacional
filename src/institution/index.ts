import { ApplicationError } from '../shared/errors.ts';
export type { InstitutionOperationContext, InstitutionTargetReader } from './operation-context.ts';

export type BasicEducationStage = 'FUNDAMENTAL' | 'MEDIO';
export type InstitutionEducationScopeItem =
  | { readonly level: 'BASIC'; readonly stage: BasicEducationStage; readonly modality?: 'EJA' }
  | { readonly level: 'TECHNICAL'; readonly courseType: 'TECNICO_NIVEL_MEDIO' }
  | { readonly level: 'HIGHER'; readonly courseType: 'GRADUACAO' };

export function parseInstitutionEducationScope(input: unknown): InstitutionEducationScopeItem[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 5) {
    throw new ApplicationError('INVALID_INPUT', 'Selecione ao menos um escopo educacional válido.');
  }
  const parsed: InstitutionEducationScopeItem[] = [];
  const keys = new Set<string>();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new ApplicationError('INVALID_INPUT', 'Escopo educacional inválido.');
    }
    const value = raw as Record<string, unknown>;
    let item: InstitutionEducationScopeItem;
    if (value.level === 'BASIC' && (value.stage === 'FUNDAMENTAL' || value.stage === 'MEDIO') &&
        (value.modality === undefined || value.modality === 'EJA') &&
        Object.keys(value).every(key => ['level', 'stage', 'modality'].includes(key))) {
      item = value.modality === 'EJA'
        ? { level: 'BASIC', stage: value.stage, modality: 'EJA' }
        : { level: 'BASIC', stage: value.stage };
    } else if (value.level === 'TECHNICAL' && value.courseType === 'TECNICO_NIVEL_MEDIO' &&
        Object.keys(value).every(key => ['level', 'courseType'].includes(key))) {
      item = { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' };
    } else if (value.level === 'HIGHER' && value.courseType === 'GRADUACAO' &&
        Object.keys(value).every(key => ['level', 'courseType'].includes(key))) {
      item = { level: 'HIGHER', courseType: 'GRADUACAO' };
    } else {
      throw new ApplicationError('INVALID_INPUT', 'Escopo educacional inválido.');
    }
    const key = item.level === 'BASIC' ? `BASIC:${item.stage}:${item.modality ?? 'BASE'}` : `${item.level}:${item.courseType}`;
    if (keys.has(key)) throw new ApplicationError('INVALID_INPUT', 'O escopo educacional contém itens repetidos.');
    keys.add(key);
    parsed.push(item);
  }
  return parsed;
}
