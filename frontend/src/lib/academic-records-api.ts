import { apiRequest, withTargetTenant } from './api.ts';

export type Assessment = { readonly id: string; readonly courseId: string; readonly subjectId: string; readonly title: string;
  readonly occursOn: string; readonly maxPoints: number; readonly createdAt: string; readonly updatedAt: string };
export type Grade = { readonly id: string; readonly enrollmentId: string; readonly assessmentId: string; readonly value: number;
  readonly createdAt: string; readonly updatedAt: string };
export type AttendanceStatus = 'presente' | 'ausente';
export type Attendance = { readonly id: string; readonly courseId: string; readonly enrollmentId: string; readonly subjectId: string;
  readonly occursOn: string; readonly status: AttendanceStatus; readonly createdAt: string; readonly updatedAt: string };

export const createAssessment = (tenantId: string, courseId: string, subjectId: string,
  input: { title: string; occursOn: string; maxPoints: number }, fetcher?: typeof fetch) =>
  apiRequest<Assessment>(`/api/platform/courses/${encodeURIComponent(courseId)}/subjects/${encodeURIComponent(subjectId)}/assessments`,
    { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listAssessments = (tenantId: string, courseId: string, subjectId: string, fetcher?: typeof fetch) =>
  apiRequest<readonly Assessment[]>('/api/platform/assessments/search',
    { method: 'POST', body: withTargetTenant(tenantId, { courseId, subjectId }) }, fetcher);
export const updateAssessment = (tenantId: string, assessmentId: string,
  input: { title?: string; occursOn?: string; maxPoints?: number }, fetcher?: typeof fetch) =>
  apiRequest<Assessment>(`/api/platform/assessments/${encodeURIComponent(assessmentId)}`,
    { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
export const deleteAssessment = (tenantId: string, assessmentId: string, fetcher?: typeof fetch) =>
  apiRequest<{ deleted: boolean }>(`/api/platform/assessments/${encodeURIComponent(assessmentId)}`,
    { method: 'DELETE', body: withTargetTenant(tenantId, {}) }, fetcher);

export const createGrade = (tenantId: string, input: { enrollmentId: string; assessmentId: string; value: number }, fetcher?: typeof fetch) =>
  apiRequest<Grade>('/api/platform/grades', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listGrades = (tenantId: string, filter: { enrollmentId?: string; assessmentId?: string }, fetcher?: typeof fetch) =>
  apiRequest<readonly Grade[]>('/api/platform/grades/search', { method: 'POST', body: withTargetTenant(tenantId, filter) }, fetcher);
export const updateGrade = (tenantId: string, gradeId: string, value: number, fetcher?: typeof fetch) =>
  apiRequest<Grade>(`/api/platform/grades/${encodeURIComponent(gradeId)}`,
    { method: 'PATCH', body: withTargetTenant(tenantId, { value }) }, fetcher);
export const deleteGrade = (tenantId: string, gradeId: string, fetcher?: typeof fetch) =>
  apiRequest<{ deleted: boolean }>(`/api/platform/grades/${encodeURIComponent(gradeId)}`,
    { method: 'DELETE', body: withTargetTenant(tenantId, {}) }, fetcher);

export const createAttendance = (tenantId: string, courseId: string, subjectId: string,
  input: { enrollmentId: string; occursOn: string; status: AttendanceStatus }, fetcher?: typeof fetch) =>
  apiRequest<Attendance>(`/api/platform/courses/${encodeURIComponent(courseId)}/subjects/${encodeURIComponent(subjectId)}/attendance`,
    { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listAttendance = (tenantId: string, filter: { enrollmentId?: string; subjectId?: string }, fetcher?: typeof fetch) =>
  apiRequest<readonly Attendance[]>('/api/platform/attendance/search', { method: 'POST', body: withTargetTenant(tenantId, filter) }, fetcher);
export const updateAttendance = (tenantId: string, attendanceId: string,
  input: { occursOn?: string; status?: AttendanceStatus }, fetcher?: typeof fetch) =>
  apiRequest<Attendance>(`/api/platform/attendance/${encodeURIComponent(attendanceId)}`,
    { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
export const deleteAttendance = (tenantId: string, attendanceId: string, fetcher?: typeof fetch) =>
  apiRequest<{ deleted: boolean }>(`/api/platform/attendance/${encodeURIComponent(attendanceId)}`,
    { method: 'DELETE', body: withTargetTenant(tenantId, {}) }, fetcher);
