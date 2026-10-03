import { createHash } from 'node:crypto';
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export interface PlatformAdminAccount {
  readonly id: string;
  readonly username: string;
  readonly createdAt: string;
  readonly active: boolean;
}

export interface PlatformActivation {
  readonly adminId: string;
  readonly codeHash: string;
  readonly expiresAt: string;
  readonly usedAt: string | null;
}

export interface PlatformPasskey {
  readonly id: string;
  readonly publicKey: Uint8Array;
  readonly counter: number;
  readonly transports?: readonly string[];
}

export interface PlatformSession {
  readonly tokenHash: string;
  readonly adminId: string;
  readonly expiresAt: string;
}

export interface PlatformIdentityStore {
  recoverAdmin(value: { username: string; codeHash: string; expiresAt: string }): Promise<boolean>;
  createFirstAdmin(value: {
    readonly account: PlatformAdminAccount;
    readonly activation: PlatformActivation;
  }): Promise<'created' | 'already-exists'>;
  pendingActivation(username: string, codeHash: string): Promise<{
    readonly account: PlatformAdminAccount;
    readonly activation: PlatformActivation;
  } | null>;
  saveRegistrationChallenge(value: {
    readonly tokenHash: string;
    readonly adminId: string;
    readonly activationHash: string;
    readonly challenge: string;
    readonly expiresAt: string;
  }): Promise<void>;
  registrationForActivation(username: string, tokenHash: string): Promise<{
    readonly account: PlatformAdminAccount;
    readonly activation: PlatformActivation;
    readonly challenge: string;
    readonly challengeExpiresAt: string;
  } | null>;
  activateWithPasskey(value: {
    readonly username: string;
    readonly tokenHash: string;
    readonly now: string;
    readonly passkey: PlatformPasskey;
    readonly session: PlatformSession;
  }): Promise<boolean>;
  saveAuthenticationChallenge(value: {
    readonly tokenHash: string;
    readonly username: string;
    readonly challenge: string;
    readonly expiresAt: string;
  }): Promise<void>;
  authenticationForLogin(username: string, tokenHash: string, credentialId: string): Promise<{
    readonly account: PlatformAdminAccount;
    readonly passkey: PlatformPasskey;
    readonly challenge: string;
    readonly expiresAt: string;
  } | null>;
  completeAuthentication(value: {
    readonly username: string;
    readonly tokenHash: string;
    readonly now: string;
    readonly credentialId: string;
    readonly newCounter: number;
    readonly session: PlatformSession;
  }): Promise<boolean>;
  session(tokenHash: string): Promise<{ readonly account: PlatformAdminAccount; readonly expiresAt: string } | null>;
  removeSession(tokenHash: string): Promise<void>;
}

export interface PlatformWebAuthn {
  registrationOptions(account: PlatformAdminAccount): Promise<PublicKeyCredentialCreationOptionsJSON>;
  verifyRegistration(response: unknown, expectedChallenge: string): Promise<{
    readonly verified: boolean;
    readonly userVerified: boolean;
    readonly credential: PlatformPasskey;
  }>;
  authenticationOptions(): Promise<PublicKeyCredentialRequestOptionsJSON>;
  verifyAuthentication(response: unknown, passkey: PlatformPasskey, expectedChallenge: string): Promise<{
    readonly verified: boolean;
    readonly userVerified: boolean;
    readonly newCounter: number;
  }>;
}

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function createPlatformIdentityService(deps: {
  readonly store: PlatformIdentityStore;
  readonly webAuthn: PlatformWebAuthn;
  readonly now: () => Date;
  readonly newId: () => string;
  readonly newActivationCode: () => string;
  readonly newCeremonyToken: () => string;
  readonly newToken: () => string;
  readonly newLoginToken: () => string;
  readonly newRecoveryCode?: () => string;
}) {
  const { store, webAuthn, now, newId, newActivationCode, newCeremonyToken, newToken, newLoginToken } = deps;
  return {
    async provisionInitial(input: unknown) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApplicationError('INVALID_INPUT', 'Dados de provisionamento inválidos.');
      }
      const value = input as Record<string, unknown>;
      if (Object.keys(value).some(key => key !== 'username') ||
          typeof value.username !== 'string' || !value.username.trim() || value.username.trim().length > 100) {
        throw new ApplicationError('INVALID_INPUT', 'Informe um nome de usuário válido.');
      }
      const issuedAt = now();
      const activationCode = newActivationCode();
      const account: PlatformAdminAccount = {
        id: newId(), username: value.username.trim(), createdAt: issuedAt.toISOString(), active: false,
      };
      const activation: PlatformActivation = {
        adminId: account.id,
        codeHash: digest(activationCode),
        expiresAt: new Date(issuedAt.getTime() + 30 * 60_000).toISOString(),
        usedAt: null,
      };
      const result = await readOrWrite(() => store.createFirstAdmin({ account, activation }));
      if (result === 'already-exists') throw new ApplicationError('CONFLICT', 'A conta SUPER_ADMIN inicial já foi provisionada.');
      return { username: account.username, activationCode };
    },
    async recover(input: unknown) {
      const value = input as Record<string, unknown>;
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(value).some(key => key !== 'username') ||
          typeof value.username !== 'string' || !value.username.trim() || value.username.trim().length > 100 || !deps.newRecoveryCode) {
        throw new ApplicationError('INVALID_INPUT', 'Informe uma conta válida.');
      }
      const username = value.username as string;
      const instant = now();
      const code = deps.newRecoveryCode();
      const recovered = await readOrWrite(() => store.recoverAdmin({ username: username.trim(),
        codeHash: digest(code), expiresAt: new Date(instant.getTime() + 30 * 60_000).toISOString() }));
      if (!recovered) throw new ApplicationError('NOT_FOUND', 'Conta SUPER_ADMIN não encontrada.');
      return { username: username.trim(), activationCode: code };
    },
    async beginActivation(input: unknown) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApplicationError('UNAUTHENTICATED', 'Código inválido ou expirado.');
      }
      const value = input as Record<string, unknown>;
      const username = value.username;
      const activationCode = value.activationCode;
      if (Object.keys(value).some(key => !['username', 'activationCode'].includes(key)) ||
          typeof username !== 'string' || !username.trim() ||
          typeof activationCode !== 'string' || !activationCode) {
        throw new ApplicationError('UNAUTHENTICATED', 'Código inválido ou expirado.');
      }
      const codeHash = digest(activationCode);
      const pending = await readOrWrite(() => store.pendingActivation(username.trim(), codeHash));
      const current = now();
      if (!pending || pending.activation.usedAt || Date.parse(pending.activation.expiresAt) <= current.getTime()) {
        throw new ApplicationError('UNAUTHENTICATED', 'Código inválido ou expirado.');
      }
      const options = await webAuthn.registrationOptions(pending.account);
      const ceremonyToken = newCeremonyToken();
      const expiresAt = new Date(Math.min(current.getTime() + 5 * 60_000, Date.parse(pending.activation.expiresAt))).toISOString();
      await readOrWrite(() => store.saveRegistrationChallenge({ tokenHash: digest(ceremonyToken),
        adminId: pending.account.id, activationHash: codeHash, challenge: options.challenge, expiresAt }));
      return { options, ceremonyToken };
    },
    async completeActivation(input: unknown) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApplicationError('UNAUTHENTICATED', 'Ativação inválida ou expirada.');
      }
      const value = input as Record<string, unknown>;
      const username = value.username;
      const ceremonyToken = value.ceremonyToken;
      if (Object.keys(value).some(key => !['username', 'ceremonyToken', 'response'].includes(key)) ||
          typeof username !== 'string' || !username.trim() || typeof ceremonyToken !== 'string' ||
          !ceremonyToken || value.response === undefined) {
        throw new ApplicationError('UNAUTHENTICATED', 'Ativação inválida ou expirada.');
      }
      const instant = now();
      const tokenHash = digest(ceremonyToken);
      const ceremony = await readOrWrite(() => store.registrationForActivation(username.trim(), tokenHash));
      if (!ceremony || ceremony.account.active || ceremony.activation.usedAt ||
          Date.parse(ceremony.activation.expiresAt) <= instant.getTime() ||
          Date.parse(ceremony.challengeExpiresAt) <= instant.getTime()) {
        throw new ApplicationError('UNAUTHENTICATED', 'Ativação inválida ou expirada.');
      }
      let verification: Awaited<ReturnType<PlatformWebAuthn['verifyRegistration']>>;
      try { verification = await webAuthn.verifyRegistration(value.response, ceremony.challenge); }
      catch { throw new ApplicationError('UNAUTHENTICATED', 'Passkey inválida.'); }
      if (!verification.verified || !verification.userVerified) throw new ApplicationError('UNAUTHENTICATED', 'Passkey inválida.');
      const sessionToken = newToken();
      const expiresAt = new Date(instant.getTime() + 8 * 60 * 60_000).toISOString();
      const activated = await readOrWrite(() => store.activateWithPasskey({ username: ceremony.account.username,
        tokenHash, now: instant.toISOString(), passkey: verification.credential,
        session: { tokenHash: digest(sessionToken), adminId: ceremony.account.id, expiresAt } }));
      if (!activated) throw new ApplicationError('UNAUTHENTICATED', 'Ativação inválida ou expirada.');
      return { token: sessionToken, expiresAt, principal: {
        accountId: ceremony.account.id, username: ceremony.account.username,
        role: 'SUPER_ADMIN' as const, permissions: ['platform:institution:create'],
      } };
    },
    async authenticate(token: string | undefined) {
      if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      const record = await readOrWrite(() => store.session(digest(token)));
      if (!record || !record.account.active || Date.parse(record.expiresAt) <= now().getTime()) {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      return { accountId: record.account.id, username: record.account.username,
        role: 'SUPER_ADMIN' as const, permissions: ['platform:institution:create'] };
    },
    async beginLogin(input: unknown) {
      const username = input && typeof input === 'object' && !Array.isArray(input)
        ? (input as Record<string, unknown>).username : undefined;
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          Object.keys(input).some(key => key !== 'username') || typeof username !== 'string' ||
          !username.trim() || username.trim().length > 100) {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      const current = now();
      const options = await webAuthn.authenticationOptions();
      const ceremonyToken = newLoginToken();
      await readOrWrite(() => store.saveAuthenticationChallenge({ tokenHash: digest(ceremonyToken),
        username: username.trim(), challenge: options.challenge,
        expiresAt: new Date(current.getTime() + 5 * 60_000).toISOString() }));
      return { options, ceremonyToken };
    },
    async completeLogin(input: unknown) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      const value = input as Record<string, unknown>;
      const { username, ceremonyToken, response } = value;
      if (Object.keys(value).some(key => !['username', 'ceremonyToken', 'response'].includes(key)) ||
          typeof username !== 'string' || !username.trim() || username.trim().length > 100 ||
          typeof ceremonyToken !== 'string' || !ceremonyToken || !response || typeof response !== 'object' ||
          Array.isArray(response) || typeof (response as Record<string, unknown>).id !== 'string') {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      const instant = now();
      const ceremonyHash = digest(ceremonyToken);
      const credentialId = (response as Record<string, unknown>).id as string;
      const ceremony = await readOrWrite(() => store.authenticationForLogin(username.trim(), ceremonyHash, credentialId));
      if (!ceremony || !ceremony.account.active || Date.parse(ceremony.expiresAt) <= instant.getTime()) {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      let verification: Awaited<ReturnType<PlatformWebAuthn['verifyAuthentication']>>;
      try { verification = await webAuthn.verifyAuthentication(response, ceremony.passkey, ceremony.challenge); }
      catch { throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.'); }
      if (!verification.verified || !verification.userVerified) {
        throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      }
      const sessionToken = newToken();
      const expiresAt = new Date(instant.getTime() + 8 * 60 * 60_000).toISOString();
      const authenticated = await readOrWrite(() => store.completeAuthentication({ username: ceremony.account.username,
        tokenHash: ceremonyHash, now: instant.toISOString(), credentialId, newCounter: verification.newCounter,
        session: { tokenHash: digest(sessionToken), adminId: ceremony.account.id, expiresAt } }));
      if (!authenticated) throw new ApplicationError('UNAUTHENTICATED', 'Acesso inválido ou sessão expirada.');
      return { token: sessionToken, expiresAt, principal: {
        accountId: ceremony.account.id, username: ceremony.account.username,
        role: 'SUPER_ADMIN' as const, permissions: ['platform:institution:create'],
      } };
    },
    async logout(token: string | undefined) {
      if (token && /^[A-Za-z0-9_-]{32,128}$/.test(token)) await readOrWrite(() => store.removeSession(digest(token)));
    },
  };
}
