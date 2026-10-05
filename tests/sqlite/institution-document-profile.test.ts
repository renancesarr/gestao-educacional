import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';
import { createSqliteInstitutionDocumentProfileStore } from '../../src/database/sqlite-institution-document-profile-store.ts';

const tenantId = '00000000-0000-4000-8000-000000000010';
const personId = '00000000-0000-4000-8000-000000000011';
const employeeId = '00000000-0000-4000-8000-000000000012';
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');

function setup() {
  const database = new DatabaseSync(':memory:');
  createSqliteIdentityStore(database);
  const people = createSqlitePeopleStore(database);
  database.prepare('INSERT INTO institution_tenants (id,code,name,created_at) VALUES (?,?,?,?)')
    .run(tenantId, 'profile-test', 'Escola de Teste', '2026-10-05T00:00:00.000Z');
  return { database, people, store: createSqliteInstitutionDocumentProfileStore(database) };
}

test('SQLite: perfil documental conserva logo, cargos e ativos do funcionário do próprio tenant', async () => {
  const { database, people, store } = setup();
  try {
    await people.insertForGlobalOperation({ id: personId, tenantId, name: 'Diretora Teste', cpf: null,
      institutionalId: 'func-teste', birthMunicipality: null, birthUf: null, createdAt: '2026-10-05T00:00:00.000Z' });
    assert.equal(await store.saveLogo(tenantId, { mediaType: 'image/svg+xml',
      bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>') }), true);
    assert.equal(await store.createEmployee({ id: employeeId, tenantId, personId, personName: 'Diretora Teste',
      createdAt: '2026-10-05T00:00:00.000Z' }), 'created');
    assert.equal(await store.assignPositions(tenantId, employeeId, employeeId), 'updated');
    const image = { mediaType: 'image/png' as const, bytes: onePixelPng };
    assert.equal(await store.saveEmployeeAsset(tenantId, employeeId, 'signature', image), 'saved');
    assert.equal(await store.saveEmployeeAsset(tenantId, employeeId, 'stamp', image), 'saved');
    const profile = await store.getProfile(tenantId);
    assert.equal(profile?.logoConfigured, true);
    assert.equal(profile?.director?.personName, 'Diretora Teste');
    assert.equal(profile?.recordsOfficer?.personName, 'Diretora Teste');
    assert.equal(profile?.signatureConfigured, true);
    assert.equal(profile?.stampConfigured, true);
    assert.deepEqual((await store.getEmployeeAsset(tenantId, employeeId, 'signature'))?.bytes, new Uint8Array(onePixelPng));
    assert.equal(await store.deleteEmployee(tenantId, employeeId), 'assigned');
  } finally { database.close(); }
});

test('SQLite: cargo documental não aceita funcionário de outro tenant', async () => {
  const { database, store } = setup();
  try {
    assert.equal(await store.assignPositions(tenantId, employeeId, null), 'invalid-director');
  } finally { database.close(); }
});
