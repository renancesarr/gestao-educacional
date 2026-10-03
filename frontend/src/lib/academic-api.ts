import { apiRequest, withTargetTenant } from './api.ts';

export type Person = { readonly id: string; readonly name: string; readonly cpf?: string; readonly institutionalId?: string;
  readonly birthMunicipality?: string | null; readonly birthUf?: string | null };
export type Collaborator = { readonly id: string; readonly personId: string; readonly personName: string; readonly active: boolean };
export type Course = { readonly id: string; readonly name: string; readonly code: string; readonly educationScope: object; readonly active: boolean };
export type Subject = { readonly id: string; readonly name: string; readonly code: string; readonly workloadHours: number;
  readonly active: boolean; readonly collaborators: readonly Collaborator[] };
export type CourseDetail = Course & { readonly subjects: readonly Subject[] };

export const createPerson = (tenantId: string, input: { name: string; cpf?: string; institutionalId?: string; birthMunicipality?: string; birthUf?: string }, fetcher?: typeof fetch) =>
  apiRequest<Person>('/api/platform/people', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const searchPerson = (tenantId: string, identifier: { cpf?: string; institutionalId?: string }, fetcher?: typeof fetch) =>
  apiRequest<Person | null>('/api/platform/people/search', { method: 'POST', body: withTargetTenant(tenantId, identifier) }, fetcher);
export const createCollaborator = (tenantId: string, personId: string, fetcher?: typeof fetch) =>
  apiRequest<Collaborator>('/api/platform/collaborators', { method: 'POST', body: withTargetTenant(tenantId, { personId }) }, fetcher);
export const listCollaborators = (tenantId: string, fetcher?: typeof fetch) =>
  apiRequest<readonly Collaborator[]>('/api/platform/collaborators/search', { method: 'POST', body: withTargetTenant(tenantId, {}) }, fetcher);
export const updateCollaborator = (tenantId: string, id: string, active: boolean, fetcher?: typeof fetch) =>
  apiRequest<Collaborator>(`/api/platform/collaborators/${encodeURIComponent(id)}`, { method: 'PATCH', body: withTargetTenant(tenantId, { active }) }, fetcher);
export const createCourse = (tenantId: string, input: { name: string; code: string; educationScope: object }, fetcher?: typeof fetch) =>
  apiRequest<Course>('/api/platform/courses', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listCourses = (tenantId: string, educationScope?: object, fetcher?: typeof fetch) =>
  apiRequest<readonly Course[]>('/api/platform/courses/search', { method: 'POST', body: withTargetTenant(tenantId, educationScope ? { educationScope } : {}) }, fetcher);
export const updateCourse = (tenantId: string, id: string, input: { name?: string; active?: boolean }, fetcher?: typeof fetch) =>
  apiRequest<Course>(`/api/platform/courses/${encodeURIComponent(id)}`, { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
export const getCourseDetail = (tenantId: string, courseId: string, fetcher?: typeof fetch) =>
  apiRequest<CourseDetail>('/api/platform/courses/detail', { method: 'POST', body: withTargetTenant(tenantId, { courseId }) }, fetcher);
export const createSubject = (tenantId: string, courseId: string, input: { name: string; code: string; workloadHours: number; collaboratorIds: readonly string[] }, fetcher?: typeof fetch) =>
  apiRequest<Subject>(`/api/platform/courses/${encodeURIComponent(courseId)}/subjects`, { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const updateSubject = (tenantId: string, courseId: string, subjectId: string, input: { name?: string; workloadHours?: number; active?: boolean; collaboratorIds?: readonly string[] }, fetcher?: typeof fetch) =>
  apiRequest<Subject>(`/api/platform/courses/${encodeURIComponent(courseId)}/subjects/${encodeURIComponent(subjectId)}`, { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
