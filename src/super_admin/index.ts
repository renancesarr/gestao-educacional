import { ApplicationError, readOrWrite } from '../shared/errors.ts';
import { hashPassword } from '../identity/password.ts';
import { parseInstitutionEducationScope, type InstitutionEducationScopeItem } from '../institution/index.ts';
import type { InstitutionOperationContext, InstitutionTargetReader } from '../institution/index.ts';

export interface PlatformPrincipal { readonly accountId: string; readonly role: 'SUPER_ADMIN'; readonly permissions: readonly string[] }
export interface InstitutionOnboardingStore {
  create(value: { tenantId: string; accountId: string; code: string; name: string; username: string;
    passwordHash: string; occurredAt: string;
    educationScope: readonly InstitutionEducationScopeItem[] }): Promise<'created' | 'duplicate'>;
}

export function createInstitutionOperationContextService(deps: { targets: InstitutionTargetReader }) {
  return {
    async resolve(principal: PlatformPrincipal, targetTenantId: unknown): Promise<InstitutionOperationContext> {
      if (!principal || principal.role !== 'SUPER_ADMIN') {
        throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      }
      if (typeof targetTenantId !== 'string' || !targetTenantId.trim()) {
        throw new ApplicationError('INVALID_INPUT', 'Informe o ID interno da instituição.');
      }
      const tenantId = targetTenantId.trim();
      if (!await deps.targets.exists(tenantId)) {
        throw new ApplicationError('NOT_FOUND', 'Instituição não encontrada.');
      }
      return Object.freeze({ actorId: principal.accountId, tenantId, actorRole: 'SUPER_ADMIN' });
    },
  };
}

export function createSuperAdminService(deps: { store: InstitutionOnboardingStore; now: () => Date; newId: () => string }) {
  return {
    async createInstitution(principal: PlatformPrincipal, input: unknown) {
      if (!principal || principal.role !== 'SUPER_ADMIN' || !principal.permissions.includes('platform:institution:create'))
        throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados inválidos.');
      const value = input as Record<string, unknown>;
      const code = typeof value.code === 'string' ? value.code.trim() : '';
      const name = typeof value.name === 'string' ? value.name.trim() : '';
      const username = typeof value.username === 'string' ? value.username.trim() : '';
      const password = value.password;
      if (Object.keys(value).some(key => !['code', 'name', 'username', 'password', 'educationScope'].includes(key)) ||
          !/^[a-z0-9][a-z0-9-]{1,99}$/.test(code) || !name || name.length > 200 || !username || username.length > 100 ||
          typeof password !== 'string' || password.length < 12 || password.length > 256)
        throw new ApplicationError('INVALID_INPUT', 'Confira código, nome, usuário e senha inicial da instituição.');
      const educationScope = parseInstitutionEducationScope(value.educationScope);
      const passwordHash = await hashPassword(password);
      const at = deps.now().toISOString();
      const tenantId = deps.newId();
      const result = await readOrWrite(() => deps.store.create({ tenantId, accountId: deps.newId(),
        code, name, username, passwordHash, occurredAt: at, educationScope }));
      if (result === 'duplicate') throw new ApplicationError('CONFLICT', 'Já existe uma instituição com esse código.');
      return { tenantId, code, name, username };
    },
  };
}
