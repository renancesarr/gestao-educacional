import { apiRequest } from './api.ts';

export type PlatformSession = { readonly accountId?: string; readonly username: string; readonly role?: string };
export type InstitutionScope =
  | { readonly level: 'BASIC'; readonly stage: string; readonly modality?: string }
  | { readonly level: 'TECHNICAL'; readonly courseType: 'TECNICO_NIVEL_MEDIO' }
  | { readonly level: 'HIGHER'; readonly courseType: string };
export type InstitutionInput = { readonly code: string; readonly name: string; readonly username: string;
  readonly password: string; readonly educationScope: readonly InstitutionScope[] };
export type InstitutionResult = { readonly tenantId: string; readonly name: string; readonly code: string };

export const beginPlatformLogin = (username: string, fetcher?: typeof fetch) =>
  apiRequest<Record<string, unknown>>('/api/platform/login/options', { method: 'POST', body: { username } }, fetcher);
export const verifyPlatformLogin = (username: string, response: unknown, fetcher?: typeof fetch) =>
  apiRequest<PlatformSession>('/api/platform/login/verify', { method: 'POST', body: { username, response } }, fetcher);
export const beginPlatformActivation = (username: string, activationCode: string, fetcher?: typeof fetch) =>
  apiRequest<Record<string, unknown>>('/api/platform/activation/options', { method: 'POST', body: { username, activationCode } }, fetcher);
export const verifyPlatformActivation = (username: string, response: unknown, fetcher?: typeof fetch) =>
  apiRequest<PlatformSession>('/api/platform/activation/verify', { method: 'POST', body: { username, response } }, fetcher);
export const getPlatformSession = (fetcher?: typeof fetch) => apiRequest<PlatformSession>('/api/platform/session', {}, fetcher);
export const logoutPlatformSession = (fetcher?: typeof fetch) => apiRequest<null>('/api/platform/session', { method: 'DELETE' }, fetcher);
export const createInstitution = (input: InstitutionInput, fetcher?: typeof fetch) =>
  apiRequest<InstitutionResult>('/api/platform/institutions', { method: 'POST', body: input }, fetcher);
