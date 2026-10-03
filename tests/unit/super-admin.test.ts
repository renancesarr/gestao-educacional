import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSuperAdminService } from '../../src/super_admin/index.ts';
import { MemoryInstitutionOnboardingStore } from '../support/memory-institution-onboarding-store.ts';

test('SUPER_ADMIN registra o escopo educacional no onboarding institucional', async () => {
  const store = new MemoryInstitutionOnboardingStore();
  let id = 0;
  const service = createSuperAdminService({ store, now: () => new Date('2026-09-29T12:00:00.000Z'), newId: () => `id-${++id}` });

  const result = await service.createInstitution({ accountId: 'platform-admin-1', role: 'SUPER_ADMIN',
    permissions: ['platform:institution:create'] }, {
    code: 'instituto-misto', name: 'Instituto Misto', username: 'gestora', password: 'senha-inicial-segura',
    educationScope: [
      { level: 'BASIC', stage: 'FUNDAMENTAL' },
      { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' },
      { level: 'BASIC', stage: 'MEDIO' },
      { level: 'HIGHER', courseType: 'GRADUACAO' },
    ],
  });

  assert.deepEqual(result, { tenantId: 'id-1', code: 'instituto-misto', name: 'Instituto Misto', username: 'gestora' });
  assert.equal(store.records.length, 1);
  assert.deepEqual(store.records[0]?.educationScope, [
    { level: 'BASIC', stage: 'FUNDAMENTAL' },
    { level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA' },
    { level: 'BASIC', stage: 'MEDIO' },
    { level: 'HIGHER', courseType: 'GRADUACAO' },
  ]);
  assert.equal(store.records[0]?.tenantId, 'id-1');
});

test('onboarding rejeita escopo vazio, fora do MVP ou estruturalmente inválido', async () => {
  const store = new MemoryInstitutionOnboardingStore();
  const service = createSuperAdminService({ store, now: () => new Date('2026-09-29T12:00:00.000Z'), newId: () => 'unused' });
  const principal = { accountId: 'platform-admin-1', role: 'SUPER_ADMIN' as const,
    permissions: ['platform:institution:create'] };
  const base = { code: 'escola-nova', name: 'Escola Nova', username: 'gestora', password: 'senha-inicial-segura' };
  const invalidScopes = [
    [],
    [{ level: 'BASIC', stage: 'INFANTIL' }],
    [{ level: 'BASIC', stage: 'MEDIO', modality: 'EJA', courseType: 'GRADUACAO' }],
    [{ level: 'HIGHER', stage: 'MEDIO', courseType: 'GRADUACAO' }],
    [{ level: 'HIGHER', courseType: 'POS_GRADUACAO' }],
    [{ level: 'BASIC', stage: 'MEDIO' }, { level: 'BASIC', stage: 'MEDIO' }],
    [{ level: 'BASIC', stage: 'FUNDAMENTAL', modality: 'EJA', tenantId: 'another-tenant' }],
  ];

  for (const educationScope of invalidScopes) {
    await assert.rejects(service.createInstitution(principal, { ...base, educationScope }), { code: 'INVALID_INPUT' });
  }
  await assert.rejects(service.createInstitution(principal, base), { code: 'INVALID_INPUT' });
  assert.equal(store.records.length, 0);
});

test('falha ao persistir onboarding não deixa instituição, escopo ou administrador parcial', async () => {
  const store = new MemoryInstitutionOnboardingStore();
  store.failWrites = true;
  const service = createSuperAdminService({ store, now: () => new Date('2026-09-29T12:00:00.000Z'), newId: () => 'id' });
  await assert.rejects(service.createInstitution({ accountId: 'platform-admin-1', role: 'SUPER_ADMIN',
    permissions: ['platform:institution:create'] }, { code: 'escola-nova', name: 'Escola Nova', username: 'gestora',
    password: 'senha-inicial-segura', educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), { code: 'UNAVAILABLE' });
  assert.equal(store.records.length, 0);
});

test('SUPER_ADMIN cria instituição e primeiro TENANT_ADMIN pelo contrato público', async () => {
  const created: unknown[] = [];
  const service = createSuperAdminService({ store: { create: async value => { created.push(value); return 'created'; } },
    now: () => new Date('2026-09-29T12:00:00.000Z'), newId: (() => { let n = 0; return () => `generated-${++n}`; })() });
  const result = await service.createInstitution({ accountId: 'admin-1', role: 'SUPER_ADMIN', permissions: ['platform:institution:create'] },
    { code: 'escola-nova', name: ' Escola Nova ', username: ' secretaria ', password: 'senha-inicial-segura',
      educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] });
  assert.deepEqual(result, { tenantId: 'generated-1', code: 'escola-nova', name: 'Escola Nova', username: 'secretaria' });
  const write = created[0] as { tenantId: string; accountId: string; passwordHash: string; code: string };
  assert.equal(write.tenantId, 'generated-1'); assert.equal(write.accountId, 'generated-2');
  assert.equal(write.code, 'escola-nova');
  assert.notEqual(write.passwordHash, 'senha-inicial-segura');
});

test('cadastro global exige permissão, rejeita tenant informado e não mascara duplicidade', async () => {
  let writes = 0;
  const service = createSuperAdminService({ store: { create: async () => { writes++; return 'duplicate'; } },
    now: () => new Date('2026-09-29T12:00:00.000Z'), newId: () => 'id' });
  await assert.rejects(service.createInstitution({ accountId: 'x', role: 'SUPER_ADMIN', permissions: [] },
    { code: 'escola', name: 'Escola', username: 'admin', password: 'senha-inicial-segura' }), { code: 'FORBIDDEN' });
  await assert.rejects(service.createInstitution({ accountId: 'x', role: 'SUPER_ADMIN', permissions: ['platform:institution:create'] },
    { tenantId: 'attacker', code: 'escola', name: 'Escola', username: 'admin', password: 'senha-inicial-segura' }), { code: 'INVALID_INPUT' });
  await assert.rejects(service.createInstitution({ accountId: 'x', role: 'SUPER_ADMIN', permissions: ['platform:institution:create'] },
    { code: 'escola', name: 'Escola', username: 'admin', password: 'senha-inicial-segura',
      educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), { code: 'CONFLICT' });
  assert.equal(writes, 1);
});
