import { apiRequest, withTargetTenant } from './api.ts';

export type EnrollmentStatus = 'ativa' | 'trancada' | 'cancelada' | 'jubilada';
export type EnrollmentActSelection = { readonly target: 'institution' | 'course'; readonly actId: string | null; readonly versionId: string | null };
export type EnrollmentActSnapshot = EnrollmentActSelection & { readonly versionNumber: number | null; readonly text: string | null;
  readonly status: 'ativo' | 'vencido' | 'suspenso' | 'revogado' | 'ausente' };
export type EnrollmentRegulatoryException = { readonly responsibleId: string; readonly recordedAt: string; readonly reason: string };
export type Enrollment = { readonly id: string; readonly personId: string; readonly personName: string; readonly courseId: string;
  readonly status: EnrollmentStatus; readonly studentProfileId: string; readonly regulatoryActs?: readonly EnrollmentActSnapshot[];
  readonly regulatoryException?: EnrollmentRegulatoryException };
export const createEnrollment = (tenantId: string, input: { personId: string; courseId: string;
  regulatoryActs: readonly EnrollmentActSelection[]; allowRegulatoryException?: boolean; regulatoryExceptionReason?: string }, fetcher?: typeof fetch) =>
  apiRequest<Enrollment>('/api/platform/enrollments', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listEnrollments = (tenantId: string, courseId: string, status?: EnrollmentStatus, fetcher?: typeof fetch) =>
  apiRequest<readonly Enrollment[]>('/api/platform/enrollments/search', { method: 'POST', body: withTargetTenant(tenantId, { courseId, ...(status ? { status } : {}) }) }, fetcher);
export const transitionEnrollment = (tenantId: string, courseId: string, enrollmentId: string, status: EnrollmentStatus, fetcher?: typeof fetch) =>
  apiRequest<Enrollment>(`/api/platform/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
    { method: 'PATCH', body: withTargetTenant(tenantId, { status }) }, fetcher);
