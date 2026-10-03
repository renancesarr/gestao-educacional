import { apiRequest } from './api.ts';

export interface PublicStudentSearchResult {
  readonly name: string;
  readonly courseName: string;
  readonly institutionName: string;
}

export interface PublicStudentSearchPage {
  readonly students: readonly PublicStudentSearchResult[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export const searchPublicStudents = (
  filters: { cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string; course?: string },
  pagination: { page: number; pageSize: number }, fetcher?: typeof fetch,
) => apiRequest<PublicStudentSearchPage>('/api/public/students/search', {
  method: 'POST', body: { ...filters, ...pagination },
}, fetcher);
