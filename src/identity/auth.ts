import { createHash } from 'node:crypto';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';
import type { Principal } from './index.ts';
import { verifyPassword } from './password.ts';

export type InstitutionalRole = 'TENANT_ADMIN' | 'ACADEMIC_SECRETARY' | 'VIEWER';
export interface Account {
  id: string; tenantId: string; institution: string; institutionName: string;
  username: string; passwordHash: string; role: InstitutionalRole;
  active: boolean; accountContext: Principal['accountContext'];
}
export interface StoredSession {
  tokenHash: string; accountId: string; tenantId: string; expiresAt: string;
}
export interface IdentityStore {
  accountForLogin(institution: string, username: string): Promise<Account | null>;
  saveSession(session: StoredSession): Promise<void>;
  session(tokenHash: string): Promise<{ account: Account; expiresAt: string } | null>;
  removeSession(tokenHash: string): Promise<void>;
}
export interface AuthenticatedPrincipal extends Principal {
  institutionName: string;
  username: string;
  role: InstitutionalRole;
}
const permissions: Record<InstitutionalRole, readonly string[]> = {
  TENANT_ADMIN: ['people:create', 'people:read'],
  ACADEMIC_SECRETARY: ['people:create', 'people:read'],
  VIEWER: ['people:read'],
};
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const unauthorized = () => new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
const canLogin = (account: Account) => account.active && account.accountContext === 'professional' && Object.hasOwn(permissions, account.role);

function principal(account: Account): AuthenticatedPrincipal {
  return { accountId: account.id, tenantId: account.tenantId, accountContext: account.accountContext,
    permissions: permissions[account.role], institutionName: account.institutionName,
    username: account.username, role: account.role };
}

export function createIdentityService(deps: { store: IdentityStore; now: () => Date; newToken: () => string }) {
  const { store, now, newToken } = deps;
  const attempts = new Map<string, { count: number; until: number }>();
  return {
    async login(input: unknown) {
      if (!input || typeof input !== 'object') throw unauthorized();
      const { institution, username, password } = input as Record<string, unknown>;
      if (typeof institution !== 'string' || typeof username !== 'string' || typeof password !== 'string' ||
          !institution.trim() || !username.trim() || !password ||
          institution.length > 100 || username.length > 100 || password.length > 256 ||
          Object.keys(input).some(key => !['institution', 'username', 'password'].includes(key))) throw unauthorized();
      const current = now().getTime();
      for (const [key, value] of attempts) if (value.until <= current) attempts.delete(key);
      const key = JSON.stringify([institution.trim().toLowerCase(), username.trim()]);
      const attempt = attempts.get(key) ?? { count: 0, until: current + 60_000 };
      if (attempt.count >= 5 || (!attempts.has(key) && attempts.size >= 1000)) {
        throw new ApplicationError('RATE_LIMITED', 'Muitas tentativas. Aguarde um minuto e tente novamente.');
      }
      attempt.count++;
      attempts.set(key, attempt);
      const account = await readOrWrite(() => store.accountForLogin(institution.trim().toLowerCase(), username.trim()));
      const validPassword = await verifyPassword(password, account?.passwordHash ?? `scrypt-v1:${'0'.repeat(32)}:${'0'.repeat(128)}`);
      if (!account || !validPassword || !canLogin(account)) throw unauthorized();
      const token = newToken();
      const expiresAt = new Date(now().getTime() + 8 * 60 * 60 * 1000).toISOString();
      await readOrWrite(() => store.saveSession({ tokenHash: digest(token), accountId: account.id, tenantId: account.tenantId, expiresAt }));
      attempts.delete(key);
      return { token, expiresAt, principal: principal(account) };
    },
    async authenticate(token: string | undefined): Promise<AuthenticatedPrincipal> {
      if (!token || !/^[a-f0-9]{64}$/.test(token)) throw unauthorized();
      const session = await readOrWrite(() => store.session(digest(token)));
      if (!session || !canLogin(session.account) || !(Date.parse(session.expiresAt) > now().getTime())) throw unauthorized();
      return principal(session.account);
    },
    async logout(token: string | undefined): Promise<void> {
      if (token && /^[a-f0-9]{64}$/.test(token)) await readOrWrite(() => store.removeSession(digest(token)));
    },
  };
}
