import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { createAcademicService } from '../../../src/academic/index.ts';
import { createIdentityService } from '../../../src/identity/index.ts';
import { createSqliteAcademicStore } from '../../../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../../../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../../../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../../../src/database/sqlite-people-store.ts';
import { createSqlitePublicCatalogStore } from '../../../src/database/sqlite-public-catalog-store.ts';
import { createHttpServer } from '../../../src/http/server.ts';
import { createGlobalPeopleService, createPeopleService } from '../../../src/people/index.ts';
import { createGlobalStudentSearchService } from '../../../src/people/student-search.ts';
import { createPublicStudentSearchService } from '../../../src/people/public-student-search.ts';
import { createSqlitePublicStudentSearchStore } from '../../../src/database/sqlite-public-student-search-store.ts';
import { createSqliteCredentialStore } from '../../../src/database/sqlite-credential-store.ts';
import { createCredentialService } from '../../../src/credential/index.ts';
import { createAcademicHistoryService } from '../../../src/academic/history.ts';
import { createSqliteAcademicHistoryStore } from '../../../src/database/sqlite-academic-history-store.ts';
import { createInstitutionOperationContextService, createSuperAdminService } from '../../../src/super_admin/index.ts';
import { createPublicCatalogService } from '../../../src/public_catalog/index.ts';
import { fixtureServices } from '../../../tests/support/fixture.ts';

const database = new DatabaseSync(':memory:');
const catalogDatabase = new DatabaseSync(fileURLToPath(new URL('../../../tests/fixtures/catalog-listing.sqlite', import.meta.url)), { readOnly: true });
const scenarioDatabase = new DatabaseSync(fileURLToPath(new URL('../../../tests/fixtures/academic-scenario.sqlite', import.meta.url)), { readOnly: true });
const scenarioManifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../../tests/fixtures/academic-scenario.manifest.json', import.meta.url)), 'utf8')) as {
  readonly scenarios: { readonly school: { readonly tenant: { readonly id: string };
    readonly courses: readonly { readonly id: string; readonly code: string }[] };
    readonly higherEducation: { readonly tenant: { readonly id: string } } };
};
const scenarioTenantIds = new Set([scenarioManifest.scenarios.school.tenant.id, scenarioManifest.scenarios.higherEducation.tenant.id]);
const identityStore = createSqliteIdentityStore(database);
const peopleStore = createSqlitePeopleStore(database);
const institutionStore = createSqliteInstitutionOnboardingStore(database);
const academicStore = createSqliteAcademicStore(database);
const auth = await fixtureServices();
const now = () => new Date();
const globalPeople = createGlobalPeopleService({ store: peopleStore, now, newId: randomUUID });
function copyFixtureRows(table: string, columns: readonly string[]) {
  const rows = scenarioDatabase.prepare(`SELECT ${columns.join(', ')} FROM ${table}`).all() as Record<string, unknown>[];
  const insert = database.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`);
  for (const row of rows) insert.run(...columns.map(column => row[column] as string | number | bigint | null));
}
const preparedCourse = scenarioManifest.scenarios.school.courses.find(course => course.code === 'tec-administracao');
if (!preparedCourse) throw new Error('Estado-base E2E inválido: curso técnico tec-administracao ausente do manifesto.');
const preparedSubject = scenarioDatabase.prepare(`SELECT id FROM academic_subjects
  WHERE tenant_id = ? AND course_id = ? ORDER BY code LIMIT 1`)
  .get(scenarioManifest.scenarios.school.tenant.id, preparedCourse.id) as { id: string } | undefined;
if (!preparedSubject) throw new Error('Estado-base E2E inválido: o curso técnico não possui matéria.');
copyFixtureRows('institution_tenants', ['id', 'code', 'name', 'created_at']);
copyFixtureRows('institution_education_scope_items', ['tenant_id', 'scope_code']);
copyFixtureRows('identity_accounts', ['id', 'tenant_id', 'username', 'account_context', 'role', 'password_hash', 'active']);
copyFixtureRows('people_people', ['id', 'tenant_id', 'name', 'cpf', 'institutional_id', 'birth_municipality', 'birth_uf', 'created_at']);
copyFixtureRows('academic_courses', ['id', 'tenant_id', 'name', 'code', 'scope_code', 'active', 'created_at']);
copyFixtureRows('academic_collaborators', ['id', 'tenant_id', 'person_id', 'active', 'created_at']);
copyFixtureRows('academic_subjects', ['id', 'tenant_id', 'course_id', 'name', 'code', 'workload_hours', 'active', 'created_at']);
copyFixtureRows('academic_subject_collaborators', ['tenant_id', 'subject_id', 'collaborator_id']);
const globalAcademic = createAcademicService({ store: academicStore, people: globalPeople, now, newId: randomUUID });
const credentialStore = createSqliteCredentialStore(database);
const credentials = createCredentialService({ store: credentialStore, students: globalPeople, now, newId: randomUUID,
  newToken: () => randomUUID(), courses: { get: async (operation, courseId) => {
    if (scenarioTenantIds.has(operation.tenantId)) {
      const row = scenarioDatabase.prepare(`SELECT c.id, c.tenant_id, c.name, t.name AS institution_name FROM academic_courses c
        JOIN institution_tenants t ON t.id = c.tenant_id WHERE c.tenant_id = ? AND c.id = ?`).get(operation.tenantId, courseId) as
        { id: string; tenant_id: string; name: string; institution_name: string } | undefined;
      if (!row) throw Object.assign(new Error('Curso não encontrado.'), { code: 'NOT_FOUND' });
      return { id: row.id, tenantId: row.tenant_id, name: row.name, institutionName: row.institution_name };
    }
    return credentialStore.getCourseForCredential(operation, courseId);
  } },
});
const academicHistory = createAcademicHistoryService({ store: createSqliteAcademicHistoryStore(database), students: globalPeople, now, newId: randomUUID });
catalogDatabase.exec('PRAGMA query_only = ON');
scenarioDatabase.exec('PRAGMA query_only = ON');
const services = {
  ...auth,
  identity: createIdentityService({ store: identityStore, now,
    newToken: () => `${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}` }),
  platformIdentity: auth.platformIdentity,
  people: createPeopleService({ store: peopleStore, now, newId: randomUUID }),
  globalPeople,
  institutionOperationContext: createInstitutionOperationContextService({ targets: {
    exists: async tenantId => scenarioTenantIds.has(tenantId) || peopleStore.exists(tenantId),
  } }),
  superAdmin: createSuperAdminService({ store: institutionStore, now, newId: randomUUID }),
  globalAcademic,
  globalStudentSearch: createGlobalStudentSearchService({ people: globalPeople, academic: globalAcademic }),
  publicStudentSearch: createPublicStudentSearchService({ store: createSqlitePublicStudentSearchStore(database) }),
  publicCatalog: createPublicCatalogService({ store: createSqlitePublicCatalogStore(catalogDatabase), now, newId: randomUUID }),
  credentials,
  academicHistory,
};
const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-cypress-e2e' });
if (provisioned.activationCode !== 'fixture-one-time-activation-code') throw new Error('Activation fixture changed unexpectedly.');
const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
const activated = await services.platformIdentity.completeActivation({ username: provisioned.username,
  ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
if (process.env.GESTAO_E2E_TICKET === 'onboarding-super-admin/02-recuperar-conta-super-admin') {
  const recovered = await services.platformIdentity.recover({ username: provisioned.username });
  if (recovered.activationCode !== 'fixture-recovery-code') throw new Error('Recovery fixture changed unexpectedly.');
}
const context = await services.institutionOperationContext.resolve(activated.principal, scenarioManifest.scenarios.school.tenant.id);
const seededStudent = await services.globalPeople.create(context, { name: 'Aluno E2E preparado', institutionalId: 'aluno-e2e-preparado',
  cpf: '12345678901', birthMunicipality: 'Porto Velho', birthUf: 'RO' });
const seededEnrollment = await services.globalAcademic.createEnrollment(context, {
  personId: seededStudent.id, courseId: preparedCourse.id,
});
if (seededEnrollment.status !== 'ativa' || seededEnrollment.personName !== 'Aluno E2E preparado') {
  throw new Error('Estado-base E2E inválido: não foi possível preparar a matrícula acadêmica.');
}

const server = createHttpServer(services, { origin: 'http://localhost:3000', platformPostLimit: 100 });
server.listen(3001, '127.0.0.1', () => console.log('Cypress test backend ready on 127.0.0.1:3001'));
server.on('error', error => { console.error('Cypress test backend failed to start.', error); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
  server.closeAllConnections();
  server.close(() => { catalogDatabase.close(); scenarioDatabase.close(); database.close(); process.exit(0); });
});
