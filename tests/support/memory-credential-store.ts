import type { Credential, CredentialStore } from '../../src/credential/index.ts';

export class MemoryCredentialStore implements CredentialStore {
  private readonly records = new Map<string, Credential>();
  async create(value: Credential) {
    if ([...this.records.values()].some(item => item.validationToken === value.validationToken)) return 'conflict' as const;
    this.records.set(value.id, value); return 'created' as const;
  }
  async list(tenantId: string) { return [...this.records.values()].filter(item => item.tenantId === tenantId); }
  async get(tenantId: string, id: string) { const value = this.records.get(id); return value?.tenantId === tenantId ? value : null; }
  async update(value: Credential) {
    if (!this.records.has(value.id) || [...this.records.values()].some(item => item.id !== value.id && item.validationToken === value.validationToken)) return 'missing' as const;
    this.records.set(value.id, value); return 'updated' as const;
  }
  async delete(tenantId: string, id: string) { const value = await this.get(tenantId, id); return value ? this.records.delete(id) : false; }
  async findByToken(token: string) { return [...this.records.values()].find(value => value.validationToken === token) ?? null; }
}
