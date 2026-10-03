import type { EmecCourseRecord, EmecInstitutionRecord } from '../../src/public_catalog/emec-csv.ts';
import type { EmecCatalogQuery, EmecCatalogStore, EmecCatalogVersion } from '../../src/public_catalog/emec-catalog.ts';

export class MemoryEmecCatalogStore implements EmecCatalogStore {
  readonly versions = new Map<string, EmecCatalogVersion>();
  readonly institutions = new Map<string, EmecInstitutionRecord[]>();
  readonly courses = new Map<string, EmecCourseRecord[]>();
  readonly issues = new Map<string, Array<{ kind: 'REJECTED' | 'CONFLICT'; source: 'institutions' | 'courses'; line: number; reason: string }>>();
  currentVersionId: string | null = null;

  async beginPreview(version: EmecCatalogVersion) {
    this.versions.set(version.id, structuredClone(version));
    this.institutions.set(version.id, []); this.courses.set(version.id, []); this.issues.set(version.id, []);
  }
  async addInstitution(id: string, value: EmecInstitutionRecord) {
    const values = this.institutions.get(id)!; const existing = values.find(item => item.sourceId === value.sourceId);
    if (!existing) { values.push(structuredClone(value)); return 'created' as const; }
    return JSON.stringify(existing) === JSON.stringify(value) ? 'duplicate' as const : 'conflict' as const;
  }
  async addCourse(id: string, value: EmecCourseRecord) {
    const values = this.courses.get(id)!;
    const key = (item: EmecCourseRecord) => JSON.stringify([item.institutionCode, item.sourceId, item.municipalityCode, item.state]);
    const existing = values.find(item => key(item) === key(value));
    if (!existing) { values.push(structuredClone(value)); return 'created' as const; }
    return JSON.stringify(existing) === JSON.stringify(value) ? 'duplicate' as const : 'conflict' as const;
  }
  async listInstitutionCodes(id: string) { return (this.institutions.get(id) ?? []).map(item => item.sourceId); }
  async addIssue(id: string, issue: { kind: 'REJECTED' | 'CONFLICT'; source: 'institutions' | 'courses'; line: number; reason: string }) {
    this.issues.get(id)!.push(structuredClone(issue));
  }
  async completePreview(version: EmecCatalogVersion) { this.versions.set(version.id, structuredClone(version)); }
  async abortPreview() { /* Each test store instance is disposable. */ }
  async getVersion(id: string) { return structuredClone(this.versions.get(id) ?? null); }
  async applyVersion(id: string, appliedAt: string) {
    const version = this.versions.get(id);
    if (!version || version.state !== 'REVIEW') return null;
    const applied = { ...version, state: 'APPLIED' as const, appliedAt };
    this.versions.set(id, applied); this.currentVersionId = id;
    return structuredClone(applied);
  }
  async listCurrentInstitutions() {
    return structuredClone(this.currentVersionId ? this.institutions.get(this.currentVersionId) ?? [] : []);
  }
  async listCurrentCourses() {
    return structuredClone(this.currentVersionId ? this.courses.get(this.currentVersionId) ?? [] : []);
  }
  async searchCurrent(query: EmecCatalogQuery, page: number, pageSize: number) {
    const allInstitutions = this.currentVersionId ? this.institutions.get(this.currentVersionId) ?? [] : [];
    const allCourses = this.currentVersionId ? this.courses.get(this.currentVersionId) ?? [] : [];
    const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const includes = (value: string | null | undefined, filter: string | undefined) =>
      !filter || key(value ?? '').includes(key(filter));
    const matchesCourse = (value: EmecCourseRecord) => includes(value.name, query.course) &&
      (!query.course || includes(value.municipality, query.municipality) && includes(value.state, query.state));
    let matchingCourses = query.course
      ? allCourses.filter(matchesCourse)
      : allCourses.filter(value => includes(value.municipality, undefined));
    let matchingInstitutions = query.course
      ? allInstitutions.filter(value => matchingCourses.some(course => course.institutionCode === value.sourceId))
      : allInstitutions;
    matchingInstitutions = matchingInstitutions.filter(value => includes(value.name, query.name) &&
      (query.course || !query.municipality || includes(value.municipality, query.municipality) && value.state?.toUpperCase() === query.state));
    const institutionCodes = new Set(matchingInstitutions.map(value => value.sourceId));
    if (!query.course) matchingCourses = allCourses.filter(value => institutionCodes.has(value.institutionCode));
    else matchingCourses = matchingCourses.filter(value => institutionCodes.has(value.institutionCode));
    const sortInstitutions = (left: EmecInstitutionRecord, right: EmecInstitutionRecord) => left.name.localeCompare(right.name) || left.sourceId.localeCompare(right.sourceId);
    const sortCourses = (left: EmecCourseRecord, right: EmecCourseRecord) => left.institutionCode.localeCompare(right.institutionCode) ||
      left.name.localeCompare(right.name) || left.sourceId.localeCompare(right.sourceId) ||
      (left.municipalityCode ?? '').localeCompare(right.municipalityCode ?? '') || (left.state ?? '').localeCompare(right.state ?? '');
    matchingInstitutions.sort(sortInstitutions);
    matchingCourses.sort(sortCourses);
    const offset = (page - 1) * pageSize;
    return {
      institutions: structuredClone(matchingInstitutions.slice(offset, offset + pageSize)),
      courses: structuredClone(matchingCourses.slice(offset, offset + pageSize)),
      totalInstitutions: matchingInstitutions.length,
      totalCourses: matchingCourses.length,
    };
  }
}
