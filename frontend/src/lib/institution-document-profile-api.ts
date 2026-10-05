export type InstitutionImageType = 'image/png' | 'image/svg+xml';
export type InstitutionEmployee = {
  readonly id: string;
  readonly tenantId: string;
  readonly personId: string;
  readonly personName: string;
  readonly active: boolean;
  readonly administrative: true;
  readonly createdAt: string;
  readonly signatureConfigured: boolean;
  readonly stampConfigured: boolean;
};
export type InstitutionDocumentProfile = {
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly logoConfigured: boolean;
  readonly logoMediaType: InstitutionImageType | null;
  readonly employees: readonly InstitutionEmployee[];
  readonly director: InstitutionEmployee | null;
  readonly recordsOfficer: InstitutionEmployee | null;
  readonly signatureConfigured: boolean;
  readonly stampConfigured: boolean;
  readonly readiness: { readonly ready: boolean; readonly missing: readonly string[] };
};

async function jsonRequest<T>(path: string, method: 'POST' | 'PATCH' | 'PUT', body: unknown): Promise<T> {
  const response = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body) });
  const value = await response.json() as { message?: string } & T;
  if (!response.ok) throw new Error(value.message ?? 'Não foi possível concluir.');
  return value;
}

async function imageRequest<T>(path: string, method: 'PUT', image: Blob): Promise<T> {
  const response = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': image.type }, body: image });
  const value = await response.json() as { message?: string } & T;
  if (!response.ok) throw new Error(value.message ?? 'Não foi possível salvar a imagem.');
  return value;
}

const target = (tenantId: string) => `targetTenantId=${encodeURIComponent(tenantId)}`;

export async function getInstitutionDocumentProfile(tenantId: string): Promise<InstitutionDocumentProfile> {
  const response = await fetch(`/api/platform/institution/document-profile?${target(tenantId)}`, { credentials: 'same-origin' });
  const value = await response.json() as { message?: string } & InstitutionDocumentProfile;
  if (!response.ok) throw new Error(value.message ?? 'Não foi possível consultar o perfil documental.');
  return value;
}

export const saveInstitutionLogo = (tenantId: string, image: Blob) => imageRequest<InstitutionDocumentProfile>(
  `/api/platform/institution/document-profile/logo?${target(tenantId)}`, 'PUT', image);

export async function deleteInstitutionLogo(tenantId: string): Promise<void> {
  const response = await fetch(`/api/platform/institution/document-profile/logo?${target(tenantId)}`, {
    method: 'DELETE', credentials: 'same-origin',
  });
  if (response.ok) return;
  const value = await response.json() as { message?: string };
  throw new Error(value.message ?? 'Não foi possível remover a imagem institucional.');
}

export const createInstitutionEmployee = (tenantId: string, personId: string) => jsonRequest<InstitutionEmployee>(
  '/api/platform/institution/employees', 'POST', { targetTenantId: tenantId, personId });

export const updateInstitutionEmployee = (tenantId: string, employeeId: string, active: boolean) => jsonRequest<InstitutionEmployee>(
  `/api/platform/institution/employees/${encodeURIComponent(employeeId)}`, 'PATCH', { targetTenantId: tenantId, active });

export async function deleteInstitutionEmployee(tenantId: string, employeeId: string): Promise<void> {
  const response = await fetch(`/api/platform/institution/employees/${encodeURIComponent(employeeId)}`, { method: 'DELETE', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetTenantId: tenantId }) });
  if (response.ok) return;
  const value = await response.json() as { message?: string };
  throw new Error(value.message ?? 'Não foi possível remover o vínculo funcional.');
}

export const assignInstitutionDocumentRoles = (tenantId: string, input: {
  readonly directorEmployeeId: string | null; readonly recordsOfficerEmployeeId: string | null;
}) => jsonRequest<InstitutionDocumentProfile>('/api/platform/institution/document-profile/positions', 'PUT', {
  targetTenantId: tenantId, ...input,
});

export const saveEmployeeDocumentAsset = (tenantId: string, employeeId: string, kind: 'signature' | 'stamp', image: Blob) =>
  imageRequest<InstitutionDocumentProfile>(`/api/platform/institution/employees/${encodeURIComponent(employeeId)}/${kind}?${target(tenantId)}`, 'PUT', image);

export async function deleteEmployeeDocumentAsset(tenantId: string, employeeId: string, kind: 'signature' | 'stamp'): Promise<void> {
  const response = await fetch(`/api/platform/institution/employees/${encodeURIComponent(employeeId)}/${kind}?${target(tenantId)}`, {
    method: 'DELETE', credentials: 'same-origin',
  });
  if (response.ok) return;
  const value = await response.json() as { message?: string };
  throw new Error(value.message ?? 'Não foi possível remover o ativo documental do funcionário.');
}
