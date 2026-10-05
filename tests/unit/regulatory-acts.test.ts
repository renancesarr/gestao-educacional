import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApplicationError } from '../../src/shared/errors.ts';
import { createRegulatoryActsService } from '../../src/regulatory_acts/index.ts';
import { MemoryRegulatoryActStore } from '../support/memory-regulatory-act-store.ts';

test('ato associado a uma operação não pode ser excluído', async () => {
  const service = createRegulatoryActsService({ store: new MemoryRegulatoryActStore(),
    courses: { belongsToTenant: async () => true }, newId: (() => { let id = 0; return () => `id-${++id}`; })() });
  const context = { actorId: 'admin-1', tenantId: 'tenant-1', actorRole: 'SUPER_ADMIN' as const };
  const act = await service.create(context, { target: 'institution', text: 'Credenciamento de teste.', status: 'ativo' });
  await service.registerUse(context, act.id, act.currentVersionId, { operationType: 'historico', operationId: 'history-1' });
  await assert.rejects(() => service.delete(context, act.id), (error: unknown) =>
    error instanceof ApplicationError && error.code === 'CONFLICT');
  assert.deepEqual((await service.list(context, { target: 'institution' })).map(item => item.id), [act.id]);
});
