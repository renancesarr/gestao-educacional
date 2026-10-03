export interface ApiRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}, fetcher: typeof fetch = fetch): Promise<T> {
  const hasBody = options.body !== undefined;
  const response = await fetcher(path, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    ...(hasBody ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.body),
    } : {}),
  });

  if (response.status === 204) return null as T;

  let value: unknown;
  try { value = await response.json(); }
  catch { value = null; }

  if (!response.ok) {
    const message = value && typeof value === 'object' && 'message' in value && typeof value.message === 'string'
      ? value.message : 'Não foi possível concluir. Tente novamente.';
    throw new Error(message);
  }
  return value as T;
}

export function withTargetTenant<T extends Record<string, unknown>>(targetTenantId: string, operation: T): T & { targetTenantId: string } {
  return { ...operation, targetTenantId };
}
