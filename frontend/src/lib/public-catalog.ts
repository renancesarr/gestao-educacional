const CATALOG_API = '/api/platform/public-catalog/inep';

export interface InepVersionSummary {
  readonly id: string;
  readonly source: 'INEP_CENSO_ESCOLAR';
  readonly edition: string;
  readonly collectedAt: string;
  readonly sourceUrl: string;
  readonly state: 'REVIEW' | 'APPLIED';
  readonly completeness: 'COMPLETE' | 'PARTIAL';
  readonly validCount: number;
  readonly rejectedCount: number;
  readonly conflictCount: number;
  readonly appliedAt?: string;
  readonly rejected: readonly { readonly sourceId: string | null; readonly reason: string }[];
  readonly rejectionsTruncated: boolean;
}

export interface InepSchoolResult {
  readonly sourceId: string;
  readonly name: string;
  readonly situation: { readonly code: string | null; readonly label: string | null } | null;
  readonly state: { readonly code: string | null; readonly label: string | null } | null;
  readonly municipality: { readonly code: string | null; readonly label: string | null } | null;
  readonly educationalOffers: readonly {
    readonly scope: { readonly level: 'BASIC'; readonly stage: 'FUNDAMENTAL' | 'MEDIO'; readonly modality?: 'EJA' };
    readonly stageLabel: string;
    readonly modalityLabel: string | null;
  }[];
  readonly versionId: string;
}

async function responseValue<T>(response: Response): Promise<T> {
  let value: unknown;
  try { value = await response.json(); } catch { value = null; }
  if (!response.ok) {
    const message = value && typeof value === 'object' && 'message' in value && typeof value.message === 'string'
      ? value.message : 'Não foi possível concluir. Tente novamente.';
    throw new Error(message);
  }
  return value as T;
}

export async function previewInepSchoolImport(input: {
  readonly file: Blob;
  readonly edition: string;
  readonly collectedAt: string;
  readonly sourceUrl: string;
}, fetcher: typeof fetch = fetch): Promise<InepVersionSummary> {
  const query = new URLSearchParams({ edition: input.edition, collectedAt: input.collectedAt, sourceUrl: input.sourceUrl });
  const response = await fetcher(`${CATALOG_API}/preview?${query}`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'text/csv' }, body: input.file,
  });
  return responseValue<InepVersionSummary>(response);
}

export async function applyInepSchoolImport(versionId: string, fetcher: typeof fetch = fetch): Promise<InepVersionSummary> {
  const response = await fetcher(`${CATALOG_API}/versions/${encodeURIComponent(versionId)}/apply`, {
    method: 'POST', credentials: 'same-origin',
  });
  return responseValue<InepVersionSummary>(response);
}

export async function searchInepSchools(query: { name?: string; sourceId?: string; municipality?: string; state?: string }, fetcher: typeof fetch = fetch): Promise<readonly InepSchoolResult[]> {
  const params = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const response = await fetcher(`${CATALOG_API}/schools?${params}`, {
    credentials: 'same-origin',
  });
  return responseValue<readonly InepSchoolResult[]>(response);
}
