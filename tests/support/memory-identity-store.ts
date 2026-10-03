import type { Account, IdentityStore, StoredSession } from '../../src/identity/index.ts';

export class MemoryIdentityStore implements IdentityStore {
  #accounts: Account[];
  #sessions = new Map<string, StoredSession>();
  constructor(accounts: Account[]) { this.#accounts = structuredClone(accounts); }
  async accountForLogin(institution: string, username: string): Promise<Account | null> {
    return structuredClone(this.#accounts.find(a => a.institution === institution && a.username === username) ?? null);
  }
  async saveSession(session: StoredSession) { this.#sessions.set(session.tokenHash, structuredClone(session)); }
  async session(tokenHash: string) {
    const session = this.#sessions.get(tokenHash);
    const account = this.#accounts.find(a => a.id === session?.accountId && a.tenantId === session?.tenantId);
    return session && account ? structuredClone({ account, expiresAt: session.expiresAt }) : null;
  }
  async removeSession(tokenHash: string) { this.#sessions.delete(tokenHash); }
  disableAccount(id: string) { const account = this.#accounts.find(a => a.id === id); if (account) account.active = false; }
}
