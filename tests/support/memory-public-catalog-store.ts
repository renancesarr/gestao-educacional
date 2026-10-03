import type { InepSchool, InepSchoolQuery, PublicCatalogStore, PublicCatalogVersion } from '../../src/public_catalog/index.ts';

export class MemoryPublicCatalogStore implements PublicCatalogStore {
  readonly versions = new Map<string, PublicCatalogVersion>();
  private currentSchools: readonly InepSchool[] = [];

  async savePreview(version: PublicCatalogVersion): Promise<void> {
    this.versions.set(version.id, structuredClone(version));
  }

  async getVersion(id: string): Promise<PublicCatalogVersion | null> {
    const version = this.versions.get(id);
    return version ? structuredClone(version) : null;
  }

  async applyVersion(id: string, appliedAt: string): Promise<PublicCatalogVersion | null> {
    const version = this.versions.get(id);
    if (!version || version.state !== 'REVIEW') return null;
    const applied: PublicCatalogVersion = { ...version, state: 'APPLIED', appliedAt };
    this.versions.set(id, applied);
    this.currentSchools = structuredClone(version.schools.map(school => ({ ...school, versionId: version.id })));
    return structuredClone(applied);
  }

  async listSchools(query?: InepSchoolQuery, limit = 100): Promise<readonly InepSchool[]> {
    const normalized = (value?: string) => value?.trim().toLocaleLowerCase('pt-BR');
    const name = normalized(query?.name); const sourceId = normalized(query?.sourceId);
    const municipality = normalized(query?.municipality); const state = normalized(query?.state);
    return structuredClone(this.currentSchools.filter(school =>
      (!name || school.name.toLocaleLowerCase('pt-BR').includes(name)) &&
      (!sourceId || school.sourceId.toLocaleLowerCase('pt-BR').includes(sourceId)) &&
      (!municipality || [school.municipality?.label, school.municipality?.code].some(value => value?.toLocaleLowerCase('pt-BR').includes(municipality))) &&
      (!state || [school.state?.label, school.state?.code].some(value => value?.toLocaleLowerCase('pt-BR') === state)))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      .slice(0, limit));
  }
}
