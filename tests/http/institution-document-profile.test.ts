import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHttpServer } from '../../src/http/server.ts';
import { fixtureServices } from '../support/fixture.ts';

test('HTTP: SUPER_ADMIN consulta o perfil documental incompleto da instituição-alvo', async () => {
  const origin = 'http://127.0.0.1:4337';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'profile-fixture' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username,
    activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'profile-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4337, '127.0.0.1', resolve); });
  try {
    assert.equal((await fetch(`${origin}/api/platform/session`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    })).status, 200);
    const response = await fetch(`${origin}/api/platform/institution/document-profile?targetTenantId=00000000-0000-4000-8000-000000000010`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      tenantId: '00000000-0000-4000-8000-000000000010',
      code: 'escola-ficticia', name: 'Escola Fictícia · demonstração',
      logoConfigured: false, logoMediaType: null, director: null, recordsOfficer: null, employees: [],
      signatureConfigured: false, stampConfigured: false,
      readiness: { ready: false, missing: ['logo', 'director', 'recordsOfficer', 'signature', 'stamp'] },
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: instituição designa diretor e responsável administrativo e rejeita função em outro tenant', async () => {
  const origin = 'http://127.0.0.1:4338';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'staff-fixture' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username,
    activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'staff-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4338, '127.0.0.1', resolve); });
  const headers = { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json' };
  const targetTenantId = '00000000-0000-4000-8000-000000000010';
  try {
    const personResponse = await fetch(`${origin}/api/platform/people`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, name: 'Ana Responsável', institutionalId: 'FUNC-001' }) });
    assert.equal(personResponse.status, 201);
    const person = await personResponse.json() as { id: string };
    const employeeResponse = await fetch(`${origin}/api/platform/institution/employees`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, personId: person.id }) });
    assert.equal(employeeResponse.status, 201);
    const employee = await employeeResponse.json() as { id: string; administrative: boolean; active: boolean };
    assert.equal(employee.administrative, true);
    assert.equal(employee.active, true);

    const assigned = await fetch(`${origin}/api/platform/institution/document-profile/positions`, { method: 'PUT', headers,
      body: JSON.stringify({ targetTenantId, directorEmployeeId: employee.id, recordsOfficerEmployeeId: employee.id }) });
    assert.equal(assigned.status, 200);
    const profile = await assigned.json() as { director: { id: string } | null; recordsOfficer: { id: string } | null };
    assert.equal(profile.director?.id, employee.id);
    assert.equal(profile.recordsOfficer?.id, employee.id);

    const signature = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
    const logoBytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><title>Marca da Escola</title></svg>');
    const logoUrl = `${origin}/api/platform/institution/document-profile/logo?targetTenantId=${targetTenantId}`;
    const savedLogo = await fetch(logoUrl, { method: 'PUT', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/svg+xml' }, body: logoBytes });
    assert.equal(savedLogo.status, 200);
    const invalidLogo = await fetch(logoUrl, { method: 'PUT', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' });
    assert.equal(invalidLogo.status, 400);
    const malformedLogo = await fetch(logoUrl, { method: 'PUT', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg"><g></svg>' });
    assert.equal(malformedLogo.status, 400);
    const readLogo = await fetch(logoUrl, { headers: { Origin: origin, Cookie: `platform_session=${session.token}` } });
    assert.equal(readLogo.status, 200);
    assert.deepEqual(Buffer.from(await readLogo.arrayBuffer()), logoBytes);
    for (const kind of ['signature', 'stamp'] as const) {
      const response = await fetch(`${origin}/api/platform/institution/employees/${employee.id}/${kind}?targetTenantId=${targetTenantId}`, {
        method: 'PUT', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/png' }, body: signature,
      });
      assert.equal(response.status, 200);
    }
    const readyProfile = await fetch(`${origin}/api/platform/institution/document-profile?targetTenantId=${targetTenantId}`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    });
    const ready = await readyProfile.json() as { readiness: { ready: boolean; missing: readonly string[] } };
    assert.deepEqual(ready.readiness, { ready: true, missing: [] });

    const nextPersonResponse = await fetch(`${origin}/api/platform/people`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, name: 'Novo Responsável', institutionalId: 'FUNC-002' }) });
    assert.equal(nextPersonResponse.status, 201);
    const nextPerson = await nextPersonResponse.json() as { id: string };
    const nextEmployeeResponse = await fetch(`${origin}/api/platform/institution/employees`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, personId: nextPerson.id }) });
    assert.equal(nextEmployeeResponse.status, 201);
    const nextEmployee = await nextEmployeeResponse.json() as { id: string; signatureConfigured: boolean; stampConfigured: boolean };
    assert.deepEqual([nextEmployee.signatureConfigured, nextEmployee.stampConfigured], [false, false]);
    const reassigned = await fetch(`${origin}/api/platform/institution/document-profile/positions`, { method: 'PUT', headers,
      body: JSON.stringify({ targetTenantId, directorEmployeeId: employee.id, recordsOfficerEmployeeId: nextEmployee.id }) });
    assert.equal(reassigned.status, 200);
    const reassignedProfile = await reassigned.json() as { signatureConfigured: boolean; stampConfigured: boolean; readiness: { missing: readonly string[] } };
    assert.deepEqual([reassignedProfile.signatureConfigured, reassignedProfile.stampConfigured], [false, false]);
    assert.deepEqual(reassignedProfile.readiness.missing, ['signature', 'stamp']);
    const originalAssets = await fetch(`${origin}/api/platform/institution/employees/${employee.id}/signature?targetTenantId=${targetTenantId}`,
      { headers: { Origin: origin, Cookie: `platform_session=${session.token}` } });
    assert.equal(originalAssets.status, 200);

    const otherEmployee = await fetch(`${origin}/api/platform/institution/document-profile/positions`, { method: 'PUT', headers,
      body: JSON.stringify({ targetTenantId, directorEmployeeId: employee.id, recordsOfficerEmployeeId: 'not-in-this-tenant' }) });
    assert.equal(otherEmployee.status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: marca institucional pode ser removida e a prontidão volta a exigir configuração', async () => {
  const origin = 'http://127.0.0.1:4339';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'delete-logo-fixture' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username,
    activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'delete-logo-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4339, '127.0.0.1', resolve); });
  const targetTenantId = '00000000-0000-4000-8000-000000000010';
  const headers = { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/svg+xml' };
  const logoUrl = `${origin}/api/platform/institution/document-profile/logo?targetTenantId=${targetTenantId}`;
  try {
    const saved = await fetch(logoUrl, { method: 'PUT', headers, body: '<svg xmlns="http://www.w3.org/2000/svg"><title>Logo</title></svg>' });
    assert.equal(saved.status, 200);
    const deleted = await fetch(logoUrl, { method: 'DELETE', headers: { Origin: origin, Cookie: `platform_session=${session.token}` } });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { deleted: true });
    assert.equal((await fetch(logoUrl, { headers: { Origin: origin, Cookie: `platform_session=${session.token}` } })).status, 404);
    const profile = await fetch(`${origin}/api/platform/institution/document-profile?targetTenantId=${targetTenantId}`, {
      headers: { Origin: origin, Cookie: `platform_session=${session.token}` },
    });
    assert.deepEqual((await profile.json() as { readiness: { missing: readonly string[] } }).readiness.missing,
      ['logo', 'director', 'recordsOfficer', 'signature', 'stamp']);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('HTTP: assinatura e carimbo são ativos do funcionário e podem ser consultados por esse vínculo', async () => {
  const origin = 'http://127.0.0.1:4340';
  const services = await fixtureServices();
  const provisioned = await services.platformIdentity.provisionInitial({ username: 'employee-assets-fixture' });
  const activation = await services.platformIdentity.beginActivation({ username: provisioned.username,
    activationCode: provisioned.activationCode });
  const session = await services.platformIdentity.completeActivation({ username: provisioned.username,
    ceremonyToken: activation.ceremonyToken, response: { id: 'employee-assets-passkey' } });
  const server = createHttpServer(services, { origin });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(4340, '127.0.0.1', resolve); });
  const targetTenantId = '00000000-0000-4000-8000-000000000010';
  const headers = { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'application/json' };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  try {
    const person = await fetch(`${origin}/api/platform/people`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, name: 'Secretária de Registros', institutionalId: 'FUNC-ASSET-01' }) });
    assert.equal(person.status, 201);
    const personId = (await person.json() as { id: string }).id;
    const created = await fetch(`${origin}/api/platform/institution/employees`, { method: 'POST', headers,
      body: JSON.stringify({ targetTenantId, personId }) });
    assert.equal(created.status, 201);
    const employeeId = (await created.json() as { id: string }).id;
    const assetUrl = `${origin}/api/platform/institution/employees/${employeeId}/signature?targetTenantId=${targetTenantId}`;
    const saved = await fetch(assetUrl, { method: 'PUT', headers: { Origin: origin, Cookie: `platform_session=${session.token}`, 'Content-Type': 'image/png' }, body: png });
    assert.equal(saved.status, 200, await saved.text());
    const loaded = await fetch(assetUrl, { headers: { Origin: origin, Cookie: `platform_session=${session.token}` } });
    assert.equal(loaded.status, 200);
    assert.deepEqual(Buffer.from(await loaded.arrayBuffer()), png);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
