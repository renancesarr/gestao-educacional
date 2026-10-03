import type { PlatformAdminAccount, PlatformActivation, PlatformIdentityStore, PlatformPasskey, PlatformSession } from '../../src/identity/index.ts';

export class MemoryPlatformIdentityStore implements PlatformIdentityStore {
  #account: PlatformAdminAccount | null = null;
  #activation: PlatformActivation | null = null;
  #challenge: { tokenHash: string; adminId: string; activationHash: string; challenge: string; expiresAt: string } | null = null;
  #passkey: PlatformPasskey | null = null;
  #loginChallenge: { tokenHash: string; username: string; challenge: string; expiresAt: string } | null = null;
  #sessions = new Map<string, PlatformSession>();

  async recoverAdmin(value: { username: string; codeHash: string; expiresAt: string }) {
    if (!this.#account || this.#account.username !== value.username) return false;
    this.#account = { ...this.#account, active: false };
    this.#activation = { adminId: this.#account.id, codeHash: value.codeHash, expiresAt: value.expiresAt, usedAt: null };
    this.#passkey = null; this.#challenge = null; this.#loginChallenge = null; this.#sessions.clear();
    return true;
  }

  async createFirstAdmin(value: { account: PlatformAdminAccount; activation: PlatformActivation }) {
    if (this.#account) return 'already-exists' as const;
    this.#account = structuredClone(value.account);
    this.#activation = structuredClone(value.activation);
    return 'created' as const;
  }

  async pendingActivation(username: string, codeHash: string) {
    if (this.#account?.username !== username || this.#activation?.codeHash !== codeHash || !this.#activation) return null;
    return structuredClone({ account: this.#account, activation: this.#activation });
  }

  async saveRegistrationChallenge(value: { tokenHash: string; adminId: string; activationHash: string; challenge: string; expiresAt: string }) {
    this.#challenge = structuredClone(value);
  }

  async registrationForActivation(username: string, tokenHash: string) {
    if (!this.#account || this.#account.username !== username || this.#challenge?.tokenHash !== tokenHash ||
        !this.#activation || this.#challenge.adminId !== this.#account.id) return null;
    return structuredClone({ account: this.#account, activation: this.#activation,
      challenge: this.#challenge.challenge, challengeExpiresAt: this.#challenge.expiresAt });
  }

  async activateWithPasskey(value: { username: string; tokenHash: string; now: string; passkey: PlatformPasskey; session: PlatformSession }) {
    if (!this.#account || !this.#activation || this.#account.username !== value.username || this.#account.active ||
        this.#activation?.usedAt || this.#challenge?.tokenHash !== value.tokenHash ||
        Date.parse(this.#activation?.expiresAt ?? '') <= Date.parse(value.now) ||
        Date.parse(this.#challenge?.expiresAt ?? '') <= Date.parse(value.now)) return false;
    this.#account = { ...this.#account, active: true };
    this.#activation = { ...this.#activation, usedAt: value.now };
    this.#passkey = structuredClone(value.passkey);
    this.#challenge = null;
    this.#sessions.set(value.session.tokenHash, structuredClone(value.session));
    return true;
  }

  async saveAuthenticationChallenge(value: { tokenHash: string; username: string; challenge: string; expiresAt: string }) {
    this.#loginChallenge = structuredClone(value);
  }

  async authenticationForLogin(username: string, tokenHash: string, credentialId: string) {
    if (!this.#account?.active || this.#account.username !== username || this.#loginChallenge?.tokenHash !== tokenHash ||
        this.#loginChallenge.username !== username || this.#passkey?.id !== credentialId) return null;
    return structuredClone({ account: this.#account, passkey: this.#passkey,
      challenge: this.#loginChallenge.challenge, expiresAt: this.#loginChallenge.expiresAt });
  }

  async completeAuthentication(value: { username: string; tokenHash: string; now: string; credentialId: string; newCounter: number; session: PlatformSession }) {
    if (!this.#account?.active || this.#account.username !== value.username || this.#loginChallenge?.tokenHash !== value.tokenHash ||
        this.#loginChallenge.username !== value.username || this.#passkey?.id !== value.credentialId ||
        Date.parse(this.#loginChallenge.expiresAt) <= Date.parse(value.now)) return false;
    this.#passkey = { ...this.#passkey, counter: value.newCounter };
    this.#loginChallenge = null;
    this.#sessions.set(value.session.tokenHash, structuredClone(value.session));
    return true;
  }

  async session(tokenHash: string) {
    const session = this.#sessions.get(tokenHash);
    return session && this.#account?.id === session.adminId
      ? structuredClone({ account: this.#account, expiresAt: session.expiresAt }) : null;
  }

  async removeSession(tokenHash: string) { this.#sessions.delete(tokenHash); }
}
