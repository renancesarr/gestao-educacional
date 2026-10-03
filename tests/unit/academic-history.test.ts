import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAcademicHistoryService } from '../../src/academic/history.ts';
import type { InstitutionOperationContext } from '../../src/institution/index.ts';

const tenantId = 'tenant-history';
const context = { actorId: 'platform-admin', tenantId, actorRole: 'SUPER_ADMIN' } as const satisfies InstitutionOperationContext;
const personId = 'person-history';

class MemoryHistoryStore {
  readonly items = new Map<string, any>();
  async create(value: any) { this.items.set(value.id, value); return 'created' as const; }
  async list(targetTenantId: string, studentId?: string) { return [...this.items.values()].filter(item => item.tenantId === targetTenantId && (!studentId || item.studentId === studentId)); }
  async get(targetTenantId: string, id: string) { const item = this.items.get(id); return item?.tenantId === targetTenantId ? item : null; }
  async update(value: any) { if (!this.items.has(value.id)) return 'missing' as const; this.items.set(value.id, value); return 'updated' as const; }
  async delete(targetTenantId: string, id: string) { return this.items.get(id)?.tenantId === targetTenantId && this.items.delete(id); }
}

function fixture(personTenantId = tenantId) {
  const store = new MemoryHistoryStore();
  let nextId = 0;
  const service = createAcademicHistoryService({ store, now: () => new Date('2026-10-03T12:00:00.000Z'),
    newId: () => `history-${++nextId}`, students: { get: async (_context: InstitutionOperationContext, id: string) => ({
      id, tenantId: personTenantId, name: 'Aluno Transferido',
    }) },
  });
  return { store, service };
}

const completeInput = { studentId: personId, sourceInstitution: 'Escola Anterior', courseName: 'Ensino Fundamental',
  academicYear: 2022, period: '2º bimestre', subjectName: 'Matemática', workloadHours: 80,
  result: 'Aprovado', gradeOrConcept: 'B', absenceCount: 3, notes: 'Registro transferido manualmente' };

test('histórico manual aceita curso de origem que não existe no catálogo atual', async () => {
  const { service } = fixture();
  const item = await service.create(context, completeInput);
  assert.equal(item.courseName, 'Ensino Fundamental');
  assert.equal(item.sourceInstitution, 'Escola Anterior');
  assert.equal(item.studentName, 'Aluno Transferido');
  assert.equal(item.createdAt, '2026-10-03T12:00:00.000Z');
  assert.deepEqual(await service.list(context, personId), [item]);
});

test('histórico exige pessoa do tenant-alvo e não pode ser lido em outro tenant', async () => {
  const { service } = fixture();
  const item = await service.create(context, completeInput);
  const otherTenant = { ...context, tenantId: 'another-tenant' };
  assert.deepEqual(await service.list(otherTenant), []);
  await assert.rejects(service.get(otherTenant, item.id), { code: 'NOT_FOUND' });
  const foreign = fixture('another-tenant');
  await assert.rejects(foreign.service.create(context, completeInput), { code: 'NOT_FOUND' });
});

test('histórico pode ser corrigido e removido no CRUD', async () => {
  const { service } = fixture();
  const item = await service.create(context, completeInput);
  const changed = await service.update(context, item.id, { result: 'Recuperação concluída', absenceCount: 4 });
  assert.equal((await service.get(context, item.id)).result, 'Recuperação concluída');
  assert.equal(changed.updatedAt, '2026-10-03T12:00:00.000Z');
  await service.delete(context, item.id);
  await assert.rejects(service.get(context, item.id), { code: 'NOT_FOUND' });
});

test('histórico aceita campos opcionais vazios, mas rejeita carga horária e ano inválidos', async () => {
  const { service } = fixture();
  const { gradeOrConcept: _grade, absenceCount: _absences, notes: _notes, ...withoutOptional } = completeInput;
  const item = await service.create(context, withoutOptional);
  assert.equal(item.gradeOrConcept, null);
  assert.equal(item.absenceCount, null);
  assert.equal(item.notes, null);
  await assert.rejects(service.create(context, { ...withoutOptional, workloadHours: 0 }), { code: 'INVALID_INPUT' });
  await assert.rejects(service.create(context, { ...withoutOptional, academicYear: 10000 }), { code: 'INVALID_INPUT' });
});
