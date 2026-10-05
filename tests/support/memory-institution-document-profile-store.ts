import type { InstitutionDocumentProfileStore, InstitutionEmployee, InstitutionImage, StoredDocumentAsset } from '../../src/institution/document-profile.ts';

type Tenant = { id: string; code: string; name: string };
type Employee = InstitutionEmployee;

export class MemoryInstitutionDocumentProfileStore implements InstitutionDocumentProfileStore {
  private readonly tenants: readonly Tenant[];
  private readonly employees: Employee[] = [];
  private readonly logos = new Map<string, InstitutionImage>();
  private readonly positions = new Map<string, { directorId: string | null; recordsOfficerId: string | null }>();
  private readonly assets = new Map<string, InstitutionImage>();

  constructor(tenants: readonly Tenant[]) { this.tenants = tenants; }

  async getProfile(tenantId: string) {
    const tenant = this.tenants.find(value => value.id === tenantId);
    if (!tenant) return null;
    const position = this.positions.get(tenantId) ?? { directorId: null, recordsOfficerId: null };
    const employees = this.employees.filter(value => value.tenantId === tenantId).map(value => ({
      ...value,
      signatureConfigured: this.assets.has(`${tenantId}:${value.id}:signature`),
      stampConfigured: this.assets.has(`${tenantId}:${value.id}:stamp`),
    }));
    const director = employees.find(value => value.id === position.directorId) ?? null;
    const recordsOfficer = employees.find(value => value.id === position.recordsOfficerId) ?? null;
    return { tenantId, code: tenant.code, name: tenant.name, logoConfigured: this.logos.has(tenantId),
      logoMediaType: this.logos.get(tenantId)?.mediaType ?? null, employees, director, recordsOfficer,
      signatureConfigured: Boolean(recordsOfficer && this.assets.has(`${tenantId}:${recordsOfficer.id}:signature`)),
      stampConfigured: Boolean(recordsOfficer && this.assets.has(`${tenantId}:${recordsOfficer.id}:stamp`)) };
  }

  async saveLogo(tenantId: string, image: InstitutionImage) {
    if (!this.tenants.some(value => value.id === tenantId)) return false;
    this.logos.set(tenantId, { mediaType: image.mediaType, bytes: new Uint8Array(image.bytes) });
    return true;
  }

  async createEmployee(value: { id: string; tenantId: string; personId: string; personName: string; createdAt: string }) {
    if (!this.tenants.some(tenant => tenant.id === value.tenantId)) return 'missing-person' as const;
    if (this.employees.some(employee => employee.tenantId === value.tenantId && employee.personId === value.personId)) return 'duplicate' as const;
    this.employees.push({ ...value, active: true, administrative: true, signatureConfigured: false, stampConfigured: false });
    return 'created' as const;
  }

  async listEmployees(tenantId: string) { return this.employees.filter(value => value.tenantId === tenantId).map(value => ({ ...value })); }

  async updateEmployee(tenantId: string, employeeId: string, active: boolean) {
    const value = this.employees.find(employee => employee.tenantId === tenantId && employee.id === employeeId);
    if (!value) return null;
    const updated = { ...value, active };
    this.employees[this.employees.indexOf(value)] = updated;
    return { ...updated };
  }

  async deleteEmployee(tenantId: string, employeeId: string) {
    const employeeIndex = this.employees.findIndex(value => value.tenantId === tenantId && value.id === employeeId);
    if (employeeIndex < 0) return 'missing' as const;
    const position = this.positions.get(tenantId);
    if (position?.directorId === employeeId || position?.recordsOfficerId === employeeId) return 'assigned' as const;
    this.employees.splice(employeeIndex, 1);
    return 'deleted' as const;
  }

  async assignPositions(tenantId: string, directorId: string | null, recordsOfficerId: string | null) {
    const valid = (id: string | null) => id === null || this.employees.some(value => value.tenantId === tenantId && value.id === id && value.active && value.administrative);
    if (!valid(directorId)) return 'invalid-director' as const;
    if (!valid(recordsOfficerId)) return 'invalid-records' as const;
    if (!this.tenants.some(value => value.id === tenantId)) return 'invalid-director' as const;
    this.positions.set(tenantId, { directorId, recordsOfficerId });
    return 'updated' as const;
  }

  async saveEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp', image: InstitutionImage) {
    const employee = this.employees.find(value => value.tenantId === tenantId && value.id === employeeId && value.administrative);
    if (!employee) return 'missing-employee' as const;
    if (!employee.active) return 'inactive-employee' as const;
    this.assets.set(`${tenantId}:${employee.id}:${kind}`, { mediaType: image.mediaType, bytes: new Uint8Array(image.bytes) });
    return 'saved' as const;
  }

  async getAsset(tenantId: string, _kind: 'logo'): Promise<StoredDocumentAsset | null> {
    const image = this.logos.get(tenantId);
    return image ? { ...image, bytes: new Uint8Array(image.bytes), filename: 'marca-institucional' } : null;
  }

  async getEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp'): Promise<StoredDocumentAsset | null> {
    const image = this.assets.get(`${tenantId}:${employeeId}:${kind}`);
    return image ? { ...image, bytes: new Uint8Array(image.bytes), filename: kind === 'stamp' ? 'carimbo-institucional' : 'assinatura-responsavel' } : null;
  }

  async deleteAsset(tenantId: string, _kind: 'logo') { return this.logos.delete(tenantId); }

  async deleteEmployeeAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp') {
    return this.assets.delete(`${tenantId}:${employeeId}:${kind}`);
  }
}
