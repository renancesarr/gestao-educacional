import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyInepSchoolImport, previewInepSchoolImport, searchInepSchools } from './public-catalog.ts';

test('INEP file upload sends the file with explicit release metadata and same-origin credentials', async () => {
  let request: RequestInit | undefined;
  let path = '';
  const preview = { id: 'version-1', state: 'REVIEW' };
  await previewInepSchoolImport({ file: new Blob(['csv']), edition: 'Censo 2025',
    collectedAt: '2026-09-30T12:00:00.000Z', sourceUrl: 'https://download.inep.gov.br/catalogo.csv' },
  async (input, init) => {
    path = String(input); request = init;
    return new Response(JSON.stringify(preview), { status: 201, headers: { 'Content-Type': 'application/json' } });
  });

  const url = new URL(path, 'http://localhost');
  assert.equal(url.pathname, '/api/platform/public-catalog/inep/preview');
  assert.equal(url.searchParams.get('edition'), 'Censo 2025');
  assert.equal(request?.method, 'POST');
  assert.equal(request?.credentials, 'same-origin');
  assert.equal((request?.headers as Record<string, string>)['Content-Type'], 'text/csv');
  assert.equal(request?.body instanceof Blob, true);
});

test('INEP operator can apply a reviewed version and search by official code', async () => {
  const calls: Array<{ path: string; method: string | undefined }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ path: String(input), method: init?.method });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  await applyInepSchoolImport('version/1', fetcher);
  await searchInepSchools({ sourceId: '33000001', municipality: 'São Paulo', state: 'SP' }, fetcher);

  assert.deepEqual(calls, [
    { path: '/api/platform/public-catalog/inep/versions/version%2F1/apply', method: 'POST' },
    { path: '/api/platform/public-catalog/inep/schools?sourceId=33000001&municipality=S%C3%A3o+Paulo&state=SP', method: undefined },
  ]);
});
