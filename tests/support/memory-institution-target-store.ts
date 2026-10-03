import type { InstitutionTargetReader } from '../../src/institution/index.ts';

export class MemoryInstitutionTargetStore implements InstitutionTargetReader {
  readonly #tenantIds: ReadonlySet<string>;

  constructor(tenantIds: readonly string[]) {
    this.#tenantIds = new Set(tenantIds);
  }

  async exists(tenantId: string): Promise<boolean> {
    return this.#tenantIds.has(tenantId);
  }
}
