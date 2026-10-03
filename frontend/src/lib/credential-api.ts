import { apiRequest, withTargetTenant } from './api.ts';

export type CredentialType = 'certificado' | 'diploma';
export type Credential = { readonly id: string; readonly studentId: string; readonly courseId: string; readonly type: CredentialType;
  readonly issuedOn: string; readonly holderName: string; readonly courseName: string; readonly institutionName: string;
  readonly contentHash: string; readonly validationToken: string; readonly createdAt: string; readonly updatedAt: string };
export type PublicCredential = { readonly status: 'valida'; readonly type: CredentialType; readonly holderName: string;
  readonly courseName: string; readonly institutionName: string; readonly issuedOn: string; readonly demonstrative: true };

export const createCredential = (tenantId: string, input: { studentId: string; courseId: string; type: CredentialType; issuedOn: string }, fetcher?: typeof fetch) =>
  apiRequest<Credential>('/api/platform/credentials', { method: 'POST', body: withTargetTenant(tenantId, input) }, fetcher);
export const listCredentials = (tenantId: string, fetcher?: typeof fetch) =>
  apiRequest<readonly Credential[]>('/api/platform/credentials/search', { method: 'POST', body: withTargetTenant(tenantId, {}) }, fetcher);
export const updateCredential = (tenantId: string, id: string, input: { type?: CredentialType; issuedOn?: string }, fetcher?: typeof fetch) =>
  apiRequest<Credential>(`/api/platform/credentials/${encodeURIComponent(id)}`, { method: 'PATCH', body: withTargetTenant(tenantId, input) }, fetcher);
export const deleteCredential = (tenantId: string, id: string, fetcher?: typeof fetch) =>
  apiRequest<{ deleted: boolean }>(`/api/platform/credentials/${encodeURIComponent(id)}`, { method: 'DELETE', body: withTargetTenant(tenantId, {}) }, fetcher);
export const validateCredential = (token: string, fetcher?: typeof fetch) =>
  apiRequest<PublicCredential>(`/api/credentials/validate/${encodeURIComponent(token)}`, {}, fetcher);
