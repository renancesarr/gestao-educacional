import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInstitutionOperationContextService, type PlatformPrincipal } from '../../src/super_admin/index.ts';

const superAdmin: PlatformPrincipal = {
  accountId: '00000000-0000-4000-8000-000000000001',
  role: 'SUPER_ADMIN',
  permissions: ['platform:institution:create'],
};

function setup() {
  return createInstitutionOperationContextService({
    targets: {
      exists: async tenantId => tenantId === '00000000-0000-4000-8000-000000000010',
    },
  });
}

test('SUPER_ADMIN resolve contexto institucional explícito para um tenant existente', async () => {
  const context = await setup().resolve(superAdmin, '00000000-0000-4000-8000-000000000010');

  assert.deepEqual(context, {
    actorId: '00000000-0000-4000-8000-000000000001',
    tenantId: '00000000-0000-4000-8000-000000000010',
    actorRole: 'SUPER_ADMIN',
  });
  assert.throws(() => { (context as { tenantId: string }).tenantId = 'outro-tenant'; }, TypeError);
});

test('contexto institucional global exige um ID interno textual informado em cada operação', async () => {
  for (const targetTenantId of [undefined, null, 10, '', '   ']) {
    await assert.rejects(setup().resolve(superAdmin, targetTenantId), { code: 'INVALID_INPUT' });
  }
});

test('contexto institucional global não resolve uma instituição inexistente', async () => {
  await assert.rejects(setup().resolve(superAdmin, '00000000-0000-4000-8000-000000000099'), { code: 'NOT_FOUND' });
});

test('somente SUPER_ADMIN resolve o contexto institucional global', async () => {
  const nonPlatformPrincipal = { ...superAdmin, role: 'TENANT_ADMIN' } as never;
  await assert.rejects(setup().resolve(nonPlatformPrincipal, '00000000-0000-4000-8000-000000000010'), { code: 'FORBIDDEN' });
});
