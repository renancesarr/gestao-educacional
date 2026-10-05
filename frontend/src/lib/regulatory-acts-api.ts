import { apiRequest, withTargetTenant } from './api.ts';

export type RegulatoryActStatus = 'ativo' | 'vencido' | 'suspenso' | 'revogado';
export type RegulatoryActTarget = 'institution' | 'course';
export type RegulatoryActVersion = {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly status: RegulatoryActStatus;
};
export type RegulatoryAct = {
  readonly id: string;
  readonly target: RegulatoryActTarget;
  readonly courseId?: string;
  readonly currentVersionId: string;
  readonly versions: readonly RegulatoryActVersion[];
  readonly text: string;
  readonly status: RegulatoryActStatus;
};

export const createRegulatoryAct = (tenantId: string, input: {
  target: RegulatoryActTarget;
  courseId?: string;
  text: string;
  status: RegulatoryActStatus;
}, fetcher?: typeof fetch) => apiRequest<RegulatoryAct>('/api/platform/regulatory-acts', {
  method: 'POST', body: withTargetTenant(tenantId, input),
}, fetcher);

export const listRegulatoryActs = (tenantId: string, filter: {
  target?: RegulatoryActTarget;
  courseId?: string;
}, fetcher?: typeof fetch) => apiRequest<readonly RegulatoryAct[]>('/api/platform/regulatory-acts/search', {
  method: 'POST', body: withTargetTenant(tenantId, filter),
}, fetcher);

export const updateRegulatoryAct = (tenantId: string, actId: string, input: {
  text?: string;
  status?: RegulatoryActStatus;
  preservePreviousVersion: boolean;
}, fetcher?: typeof fetch) => apiRequest<RegulatoryAct>(`/api/platform/regulatory-acts/${encodeURIComponent(actId)}`, {
  method: 'PATCH', body: withTargetTenant(tenantId, input),
}, fetcher);

export const deleteRegulatoryAct = (tenantId: string, actId: string, fetcher?: typeof fetch) =>
  apiRequest<{ readonly deleted: true }>(`/api/platform/regulatory-acts/${encodeURIComponent(actId)}`, {
    method: 'DELETE', body: withTargetTenant(tenantId, {}),
  }, fetcher);
