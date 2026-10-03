import assert from 'node:assert/strict';
import test from 'node:test';
import { createCredentialService } from '../../src/credential/index.ts';
import type { InstitutionOperationContext } from '../../src/institution/index.ts';

const tenantA = '00000000-0000-4000-8000-000000000010';
const tenantB = '00000000-0000-4000-8000-000000000020';
const studentId = '00000000-0000-4000-8000-000000000101';
const courseId = '00000000-0000-4000-8000-000000000201';
const context = { actorId: 'operator', tenantId: tenantA, actorRole: 'SUPER_ADMIN' } as const satisfies InstitutionOperationContext;

class MemoryCredentialStore {
  readonly records = new Map<string, any>();
  async create(value: any) { this.records.set(value.id, value); return 'created' as const; }
  async list(tenantId: string) { return [...this.records.values()].filter(value => value.tenantId === tenantId); }
  async get(tenantId: string, id: string) { const value = this.records.get(id); return value?.tenantId === tenantId ? value : null; }
  async update(value: any) { if (!this.records.has(value.id)) return 'missing' as const; this.records.set(value.id, value); return 'updated' as const; }
  async delete(tenantId: string, id: string) { return this.records.get(id)?.tenantId === tenantId && this.records.delete(id); }
  async findByToken(token: string) { return [...this.records.values()].find(value => value.validationToken === token) ?? null; }
}

function fixture(tenantId = tenantA) {
  const store = new MemoryCredentialStore();
  let id = 0;
  let token = 0;
  const service = createCredentialService({ store, now: () => new Date('2026-10-03T12:00:00.000Z'),
    newId: () => `credential-${++id}`, newToken: () => `opaque-token-${++token}`,
    students: { get: async (_context: InstitutionOperationContext, value: string) => ({ id: value, tenantId, name: 'Ana Exemplo' }) },
    courses: { get: async (_context: InstitutionOperationContext, value: string) => ({ id: value, tenantId, name: 'Administração', institutionName: 'Escola Exemplo' }) },
  });
  return { service, store };
}

test('credencial emitida é consultável pelo token e expõe somente a projeção pública aprovada', async () => {
  const { service } = fixture();
  const credential = await service.create(context, { studentId, courseId, type: 'diploma', issuedOn: '2026-10-03' });
  const validated = await service.validate(credential.validationToken);
  assert.deepEqual(validated, { status: 'valida', type: 'diploma', holderName: 'Ana Exemplo', courseName: 'Administração',
    institutionName: 'Escola Exemplo', issuedOn: '2026-10-03', demonstrative: true });
  assert.equal('studentId' in validated, false);
  assert.equal('tenantId' in validated, false);
});

test('editar credencial emitida recalcula seu hash e invalida token anterior', async () => {
  const { service } = fixture();
  const credential = await service.create(context, { studentId, courseId, type: 'diploma', issuedOn: '2026-10-03' });
  const edited = await service.update(context, credential.id, { type: 'certificado', issuedOn: '2026-10-02' });
  assert.notEqual(edited.contentHash, credential.contentHash);
  assert.notEqual(edited.validationToken, credential.validationToken);
  await assert.rejects(service.validate(credential.validationToken), { code: 'NOT_FOUND' });
  assert.equal((await service.validate(edited.validationToken)).type, 'certificado');
});

test('exclusão de credencial emitida faz token antigo deixar de localizar documento', async () => {
  const { service } = fixture();
  const credential = await service.create(context, { studentId, courseId, type: 'diploma', issuedOn: '2026-10-03' });
  await service.delete(context, credential.id);
  await assert.rejects(service.validate(credential.validationToken), { code: 'NOT_FOUND' });
});

test('credencial não aceita aluno ou curso de outro tenant', async () => {
  const { service } = fixture(tenantB);
  await assert.rejects(service.create(context, { studentId, courseId, type: 'diploma', issuedOn: '2026-10-03' }), { code: 'NOT_FOUND' });
});
