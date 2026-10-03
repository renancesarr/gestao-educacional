import type { InstitutionEducationScopeItem } from '../../src/institution/index.ts';

export interface MemoryInstitutionRecord {
  readonly tenantId: string;
  readonly accountId: string;
  readonly code: string;
  readonly name: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly occurredAt: string;
  readonly educationScope: readonly InstitutionEducationScopeItem[];
}

export class MemoryInstitutionOnboardingStore {
  readonly records: MemoryInstitutionRecord[] = [];
  failWrites = false;

  async create(value: MemoryInstitutionRecord): Promise<'created' | 'duplicate'> {
    if (this.failWrites) throw new Error('simulated persistence failure');
    if (this.records.some(record => record.code === value.code)) return 'duplicate';
    this.records.push(structuredClone(value));
    return 'created';
  }
}
