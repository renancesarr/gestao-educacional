import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGlobalPeopleService } from '../../src/people/index.ts';
import { createInstitutionOperationContextService, type PlatformPrincipal } from '../../src/super_admin/index.ts';
import { MemoryPeopleStore } from '../support/memory-people-store.ts';

const tenantA = '00000000-0000-4000-8000-000000000010';
const tenantB = '00000000-0000-4000-8000-000000000020';
const superAdmin: PlatformPrincipal = {
  accountId: '00000000-0000-4000-8000-000000000001',
  role: 'SUPER_ADMIN',
  permissions: ['platform:institution:create'],
};

function setup() {
  let sequence = 100;
  const store = new MemoryPeopleStore();
  const context = createInstitutionOperationContextService({
    targets: { exists: async tenantId => [tenantA, tenantB].includes(tenantId) },
  });
  return {
    context,
    store,
    people: createGlobalPeopleService({
      store,
      now: () => new Date('2026-09-30T12:00:00.000Z'),
      newId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
    }),
  };
}

test('SUPER_ADMIN cadastra e consulta pessoa somente na instituição-alvo explícita', async () => {
  const { context, people } = setup();
  const targetA = await context.resolve(superAdmin, tenantA);
  const targetB = await context.resolve(superAdmin, tenantB);

  const created = await people.create(targetA, {
    name: '  Aluna Fictícia  ',
    institutionalId: 'ALUNA-001',
    birthMunicipality: 'Santos',
    birthUf: 'sp',
  });

  assert.deepEqual(await people.get(targetA, created.id), {
    id: '00000000-0000-4000-8000-000000000101',
    tenantId: tenantA,
    name: 'Aluna Fictícia',
    cpf: null,
    institutionalId: 'ALUNA-001',
    birthMunicipality: 'Santos',
    birthUf: 'SP',
    createdAt: '2026-09-30T12:00:00.000Z',
  });
  assert.deepEqual(await people.find(targetA, { institutionalId: ' ALUNA-001 ' }), created);
  await assert.rejects(people.get(targetB, created.id), { code: 'NOT_FOUND' });
  assert.equal(await people.find(targetB, { institutionalId: 'ALUNA-001' }), null);
});
