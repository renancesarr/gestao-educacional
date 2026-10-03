import { apiRequest, withTargetTenant } from './api.ts';

export type EnrollmentStatus = 'ativa' | 'trancada' | 'cancelada' | 'jubilada';
export type Enrollment = { readonly id: string; readonly personId: string; readonly personName: string; readonly courseId: string; readonly status: EnrollmentStatus; readonly studentProfileId: string };
export const createEnrollment = (tenantId: string, input: { personId: string; courseId: string }, fetcher?: typeof fetch) =>
  apiRequest<Enrollment>('/api/platform/enrollments', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listEnrollments = (tenantId: string, courseId: string, status?: EnrollmentStatus, fetcher?: typeof fetch) =>
  apiRequest<readonly Enrollment[]>('/api/platform/enrollments/search', { method: 'POST', body: withTargetTenant(tenantId, { courseId, ...(status ? { status } : {}) }) }, fetcher);
export const transitionEnrollment = (tenantId: string, courseId: string, enrollmentId: string, status: EnrollmentStatus, fetcher?: typeof fetch) =>
  apiRequest<Enrollment>(`/api/platform/courses/${encodeURIComponent(courseId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
    { method: 'PATCH', body: withTargetTenant(tenantId, { status }) }, fetcher);
