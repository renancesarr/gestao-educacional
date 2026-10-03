import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN revisa, aplica e pesquisa uma exportação CSV oficial do INEP', async () => {
  const origin = 'http://127.0.0.1:4324';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-catalog' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4324, '127.0.0.1', resolve); });
  const csv = [
    'Código da Escola;Nome da Escola;Situação de funcionamento;UF;Código do município;Município;Etapa de ensino;Modalidade de ensino;Telefone',
    '33000001;Escola HTTP Fictícia;Em atividade;SP;3550308;São Paulo;Ensino Fundamental;Regular;11999999999',
  ].join('\r\n');
  const metadata = new URLSearchParams({ edition: 'Catálogo INEP 2025', collectedAt: '2026-09-30T12:00:00.000Z',
    sourceUrl: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/' });
  const headers = { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'text/csv' };
  try {
    const unauthorized = await fetch(`${origin}/api/platform/public-catalog/inep/preview?${metadata}`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'text/csv' }, body: csv,
    });
    assert.equal(unauthorized.status, 401);

    const previewResponse = await fetch(`${origin}/api/platform/public-catalog/inep/preview?${metadata}`, {
      method: 'POST', headers, body: csv,
    });
    assert.equal(previewResponse.status, 201);
    const preview = await previewResponse.json() as { id: string; validCount: number; rejectedCount: number; state: string; schools?: unknown };
    assert.equal(preview.validCount, 1);
    assert.equal(preview.rejectedCount, 0);
    assert.equal(preview.state, 'REVIEW');
    assert.equal('schools' in preview, false);

    const apply = await fetch(`${origin}/api/platform/public-catalog/inep/versions/${preview.id}/apply`, {
      method: 'POST', headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    });
    assert.equal(apply.status, 200);
    const search = await fetch(`${origin}/api/platform/public-catalog/inep/schools?sourceId=${encodeURIComponent('33000001')}`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    });
    assert.equal(search.status, 200);
    const schools = await search.json() as Array<{ sourceId: string; name: string }>;
    assert.deepEqual(schools.map(school => ({ sourceId: school.sourceId, name: school.name })), [
      { sourceId: '33000001', name: 'Escola HTTP Fictícia' },
    ]);
    assert.equal(JSON.stringify(schools).includes('11999999999'), false);
    assert.equal((await fetch(`${origin}/api/platform/public-catalog/inep/schools`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: endpoints e-MEC ficam indisponíveis na operação do MVP', async () => {
  const origin = 'http://127.0.0.1:4325';
  const services = await fixtureServices();
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4325, '127.0.0.1', resolve); });
  try {
    const denied = await fetch(`${origin}/api/platform/public-catalog/emec/preview`, { method: 'POST', headers: { Origin: origin } });
    assert.equal(denied.status, 404);
    const current = await fetch(`${origin}/api/platform/public-catalog/emec/current`);
    assert.equal(current.status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: rota de busca e-MEC não expõe o fixture local pela API operacional', async () => {
  const origin = 'http://127.0.0.1:4326';
  const services = await fixtureServices();
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4326, '127.0.0.1', resolve); });
  try {
    const search = await fetch(`${origin}/api/platform/public-catalog/emec/search?course=Administração`);
    assert.equal(search.status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
