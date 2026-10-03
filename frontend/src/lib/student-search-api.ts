import { apiRequest, withTargetTenant } from './api.ts';

export interface StudentSearchPerson {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly cpf: string | null;
  readonly institutionalId: string | null;
  readonly birthMunicipality: string | null;
  readonly birthUf: string | null;
  readonly createdAt: string;
}

export interface StudentSearchResult {
  readonly person: StudentSearchPerson;
  readonly courses: readonly { readonly courseId: string; readonly courseName: string; readonly courseCode: string; readonly status: string }[];
}

export interface StudentSearchPage {
  readonly students: readonly StudentSearchResult[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export const searchStudents = (tenantId: string,
  filters: { cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string; course?: string },
  pagination: { page: number; pageSize: number }, fetcher?: typeof fetch) =>
  apiRequest<StudentSearchPage>('/api/platform/students/search', {
    method: 'POST', body: withTargetTenant(tenantId, { ...filters, ...pagination }),
  }, fetcher);
