import { apiRequest, withTargetTenant } from './api.ts';

export type AcademicHistory = { readonly id: string; readonly studentId: string; readonly studentName: string;
  readonly sourceInstitution: string; readonly courseName: string; readonly academicYear: number; readonly period: string;
  readonly subjectName: string; readonly workloadHours: number; readonly gradeOrConcept: string | null;
  readonly absenceCount: number | null; readonly result: string; readonly notes: string | null;
  readonly createdAt: string; readonly updatedAt: string };
export type AcademicHistoryInput = { studentId: string; sourceInstitution: string; courseName: string; academicYear: number;
  period: string; subjectName: string; workloadHours: number; gradeOrConcept?: string | null; absenceCount?: number | null;
  result: string; notes?: string | null };

export const createAcademicHistory = (tenantId: string, input: AcademicHistoryInput, fetcher?: typeof fetch) =>
  apiRequest<AcademicHistory>('/api/platform/histories', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listAcademicHistories = (tenantId: string, studentId?: string, fetcher?: typeof fetch) =>
  apiRequest<readonly AcademicHistory[]>('/api/platform/histories/search', {
    method: 'POST', body: withTargetTenant(tenantId, studentId ? { studentId } : {}),
  }, fetcher);
export const getAcademicHistory = (tenantId: string, id: string, fetcher?: typeof fetch) =>
  apiRequest<AcademicHistory>('/api/platform/histories/get', { method: 'POST', body: withTargetTenant(tenantId, { id }) }, fetcher);
export const updateAcademicHistory = (tenantId: string, id: string, input: Partial<AcademicHistoryInput>, fetcher?: typeof fetch) =>
  apiRequest<AcademicHistory>(`/api/platform/histories/${encodeURIComponent(id)}`, { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
export const deleteAcademicHistory = (tenantId: string, id: string, fetcher?: typeof fetch) =>
  apiRequest<{ deleted: boolean }>(`/api/platform/histories/${encodeURIComponent(id)}`, { method: 'DELETE', body: withTargetTenant(tenantId, {}) }, fetcher);
