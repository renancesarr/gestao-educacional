import type { RegulatoryAct, RegulatoryActOperation, RegulatoryActStore, RegulatoryActTarget } from '../../src/regulatory_acts/index.ts';

export class MemoryRegulatoryActStore implements RegulatoryActStore {
  readonly #acts: RegulatoryAct[] = [];
  readonly #uses: Array<{ tenantId: string; actId: string; versionId: string; operationType: RegulatoryActOperation; operationId: string }> = [];

  async create(act: RegulatoryAct): Promise<void> {
    this.#acts.push(structuredClone(act));
  }

  async list(tenantId: string, filter: { target?: RegulatoryActTarget; courseId?: string }): Promise<readonly RegulatoryAct[]> {
    return structuredClone(this.#acts.filter(act => act.tenantId === tenantId &&
      (!filter.target || act.target === filter.target) && (!filter.courseId || act.courseId === filter.courseId)));
  }

  async get(tenantId: string, actId: string): Promise<RegulatoryAct | null> {
    const act = this.#acts.find(value => value.tenantId === tenantId && value.id === actId);
    return act ? structuredClone(act) : null;
  }

  async update(tenantId: string, actId: string, change: {
    readonly text?: string;
    readonly status?: RegulatoryAct['status'];
    readonly preservePreviousVersion: boolean;
    readonly newVersionId: string;
  }): Promise<RegulatoryAct | null> {
    const index = this.#acts.findIndex(value => value.tenantId === tenantId && value.id === actId);
    if (index < 0) return null;
    const act = this.#acts[index]!;
    const current = act.versions.find(version => version.id === act.currentVersionId)!;
    const version = { ...current, ...(change.text !== undefined ? { text: change.text } : {}),
      ...(change.status !== undefined ? { status: change.status } : {}) };
    const versions = change.preservePreviousVersion
      ? [...act.versions, { ...version, id: change.newVersionId, number: Math.max(...act.versions.map(item => item.number)) + 1 }]
      : act.versions.map(item => item.id === current.id ? version : item);
    const updated: RegulatoryAct = { ...act, currentVersionId: change.preservePreviousVersion ? change.newVersionId : current.id,
      versions, text: version.text, status: version.status };
    this.#acts[index] = updated;
    return structuredClone(updated);
  }

  async registerUse(tenantId: string, actId: string, versionId: string, operation: {
    readonly operationType: RegulatoryActOperation;
    readonly operationId: string;
  }): Promise<boolean> {
    const act = this.#acts.find(value => value.tenantId === tenantId && value.id === actId);
    if (!act || !act.versions.some(version => version.id === versionId)) return false;
    if (!this.#uses.some(value => value.tenantId === tenantId && value.actId === actId &&
        value.operationType === operation.operationType && value.operationId === operation.operationId)) {
      this.#uses.push({ tenantId, actId, versionId, ...operation });
    }
    return true;
  }

  async delete(tenantId: string, actId: string): Promise<'deleted' | 'missing' | 'used'> {
    const index = this.#acts.findIndex(value => value.tenantId === tenantId && value.id === actId);
    if (index < 0) return 'missing';
    if (this.#uses.some(value => value.tenantId === tenantId && value.actId === actId)) return 'used';
    this.#acts.splice(index, 1);
    return 'deleted';
  }
}
