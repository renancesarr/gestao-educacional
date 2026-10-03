import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createAcademicHistoryService } from '../../src/academic/history.ts';
import { createSqliteAcademicHistoryStore } from '../../src/database/sqlite-academic-history-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';

test('SQLite persiste histórico manual por pessoa e mantém o isolamento entre tenants', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    const peopleStore = createSqlitePeopleStore(database);
    const tenantId = 'tenant-history';
    const context = { actorId: 'operator', tenantId, actorRole: 'SUPER_ADMIN' } as const;
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'history-school', 'Escola Atual', '2026-10-03T12:00:00.000Z');
    database.prepare(`INSERT INTO people_people (id, tenant_id, name, cpf, institutional_id, birth_municipality, birth_uf, created_at)
      VALUES (?, ?, ?, NULL, ?, NULL, NULL, ?)`).run('student-history', tenantId, 'Aluno Transferido', 'transf-1', '2026-10-03T12:00:00.000Z');
    const service = createAcademicHistoryService({ store: createSqliteAcademicHistoryStore(database), students: { get: async (operation, id) => {
      const person = await peopleStore.get(operation.tenantId, id);
      if (!person) throw Object.assign(new Error('Aluno não encontrado.'), { code: 'NOT_FOUND' });
      return { id: person.id, tenantId: person.tenantId, name: person.name };
    } },
      now: () => new Date('2026-10-03T12:00:00.000Z'), newId: () => 'history-1' });
    const history = await service.create(context, { studentId: 'student-history', sourceInstitution: 'Escola Anterior',
      courseName: 'Ensino Fundamental', academicYear: 2022, period: '2º bimestre', subjectName: 'Matemática',
      workloadHours: 80, result: 'Aprovado' });
    assert.equal(history.studentName, 'Aluno Transferido');
    assert.equal((await service.list(context))[0]!.sourceInstitution, 'Escola Anterior');
    const otherTenant = { ...context, tenantId: 'another-tenant' };
    assert.deepEqual(await service.list(otherTenant), []);
    await assert.rejects(service.get(otherTenant, history.id), { code: 'NOT_FOUND' });
    await service.update(context, history.id, { gradeOrConcept: 'B', absenceCount: 3 });
    assert.deepEqual((await service.get(context, history.id)).gradeOrConcept, 'B');
    await service.delete(context, history.id);
    assert.deepEqual(await service.list(context), []);
  } finally { database.close(); }
});
