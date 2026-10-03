import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createCredentialService } from '../../src/credential/index.ts';
import { createSqliteAcademicStore } from '../../src/database/sqlite-academic-store.ts';
import { createSqliteCredentialStore } from '../../src/database/sqlite-credential-store.ts';
import { createSqliteIdentityStore } from '../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../src/database/sqlite-people-store.ts';

test('SQLite persiste credencial e a edição troca token sem afetar outros tenants', async () => {
  const database = new DatabaseSync(':memory:');
  try {
    createSqliteIdentityStore(database);
    createSqliteInstitutionOnboardingStore(database);
    const people = createSqlitePeopleStore(database);
    createSqliteAcademicStore(database);
    const tenantId = 'tenant-credential';
    const context = { actorId: 'operator', tenantId, actorRole: 'SUPER_ADMIN' } as const;
    database.prepare('INSERT INTO institution_tenants (id, code, name, created_at) VALUES (?, ?, ?, ?)')
      .run(tenantId, 'credential-school', 'Escola Exemplo', '2026-10-03T12:00:00.000Z');
    database.prepare('INSERT INTO institution_education_scope_items (tenant_id, scope_code) VALUES (?, ?)').run(tenantId, 'BASIC_FUNDAMENTAL');
    database.prepare(`INSERT INTO people_people (id, tenant_id, name, cpf, institutional_id, birth_municipality, birth_uf, created_at)
      VALUES (?, ?, ?, NULL, ?, NULL, NULL, ?)`).run('student-credential', tenantId, 'Ana Exemplo', 'ana-cred', '2026-10-03T12:00:00.000Z');
    database.prepare(`INSERT INTO academic_courses (id, tenant_id, name, code, scope_code, active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)`).run('course-credential', tenantId, 'Administração', 'adm-cred', 'BASIC_FUNDAMENTAL', '2026-10-03T12:00:00.000Z');
    const credentialStore = createSqliteCredentialStore(database);
    const service = createCredentialService({ store: credentialStore, now: () => new Date('2026-10-03T12:00:00.000Z'),
      newId: () => 'credential-1', newToken: (() => { let number = 0; return () => `token-${++number}`; })(),
      students: { get: async (_context, id) => {
        const person = database.prepare('SELECT id, tenant_id, name FROM people_people WHERE tenant_id = ? AND id = ?').get(tenantId, id) as
          { id: string; tenant_id: string; name: string } | undefined;
        if (!person) throw Object.assign(new Error('Pessoa não encontrada.'), { code: 'NOT_FOUND' });
        return { id: person.id, tenantId: person.tenant_id, name: person.name };
      } },
      courses: { get: (operation, id) => credentialStore.getCourseForCredential(operation, id) },
    });
    const credential = await service.create(context, { studentId: 'student-credential', courseId: 'course-credential', type: 'diploma', issuedOn: '2026-10-03' });
    assert.equal((await service.list(context)).length, 1);
    assert.equal((await service.validate(credential.validationToken)).institutionName, 'Escola Exemplo');
    const changed = await service.update(context, credential.id, { issuedOn: '2026-10-02' });
    assert.notEqual(changed.validationToken, credential.validationToken);
    const otherTenant = { ...context, tenantId: 'another-tenant' };
    assert.deepEqual(await service.list(otherTenant), []);
    await assert.rejects(service.get(otherTenant, credential.id), { code: 'NOT_FOUND' });
    await service.delete(context, credential.id);
    await assert.rejects(service.validate(changed.validationToken), { code: 'NOT_FOUND' });
  } finally { database.close(); }
});
