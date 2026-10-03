import { ApplicationError } from '../shared/errors.ts';
export { createIdentityService } from './auth.ts';
export type { Account, StoredSession, IdentityStore, AuthenticatedPrincipal, InstitutionalRole } from './auth.ts';
export { hashPassword } from './password.ts';
export { createPlatformIdentityService } from './platform.ts';
export { createPlatformWebAuthn } from './webauthn.ts';
export type { PlatformAdminAccount, PlatformActivation, PlatformIdentityStore, PlatformPasskey, PlatformSession, PlatformWebAuthn } from './platform.ts';

/** Produced by a trusted authentication adapter, never by a request body. */
export interface Principal {
  readonly accountId: string;
  readonly tenantId: string;
  readonly accountContext: 'professional' | 'student' | 'guardian';
  readonly permissions: readonly string[];
}

export function requirePermission(principal: Principal, permission: string): void {
  if (!principal || principal.accountContext !== 'professional' ||
      !principal.accountId || !principal.tenantId || !principal.permissions.includes(permission)) {
    throw new ApplicationError('FORBIDDEN', 'Acesso não autorizado.');
  }
}
