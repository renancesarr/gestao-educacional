import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import type { AcademicStore, Course, Collaborator } from '../../../src/academic/index.ts';
import type { InstitutionEducationScopeItem } from '../../../src/institution/index.ts';
import { createAcademicService } from '../../../src/academic/index.ts';
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
createSqliteIdentityStore(database);
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
const scopeCode = (scope: InstitutionEducationScopeItem) => scope.level === 'HIGHER' ? 'HIGHER_GRADUATION'
  : scope.level === 'TECHNICAL' ? 'TECHNICAL_MIDDLE' : `BASIC_${scope.stage}${scope.modality === 'EJA' ? '_EJA' : ''}`;
const scenarioScope = (code: string): InstitutionEducationScopeItem => code === 'HIGHER_GRADUATION'
  ? { level: 'HIGHER', courseType: 'GRADUACAO' }
  : code === 'TECHNICAL_MIDDLE' ? { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' }
  : { level: 'BASIC', stage: code.includes('FUNDAMENTAL') ? 'FUNDAMENTAL' : 'MEDIO', ...(code.endsWith('_EJA') ? { modality: 'EJA' } : {}) };
const scenarioCourse = (row: Record<string, unknown>): Course => ({ id: String(row.id), tenantId: String(row.tenant_id),
  name: String(row.name), code: String(row.code), educationScope: scenarioScope(String(row.scope_code)),
  active: Boolean(row.active), createdAt: String(row.created_at) });
const readOnlyAcademicStore: AcademicStore = {
  ...academicStore,
  async hasEducationScope(tenantId, scope) {
    if (!scenarioTenantIds.has(tenantId)) return academicStore.hasEducationScope(tenantId, scope);
    return Boolean(scenarioDatabase.prepare('SELECT 1 FROM institution_education_scope_items WHERE tenant_id = ? AND scope_code = ?')
      .get(tenantId, scopeCode(scope)));
  },
  async listCourses(tenantId, scope) {
    if (!scenarioTenantIds.has(tenantId)) return academicStore.listCourses(tenantId, scope);
    const rows = scenarioDatabase.prepare(`SELECT id, tenant_id, name, code, scope_code, active, created_at
      FROM academic_courses WHERE tenant_id = ?${scope ? ' AND scope_code = ?' : ''} ORDER BY code`)
      .all(...(scope ? [tenantId, scopeCode(scope)] : [tenantId])) as unknown as Record<string, unknown>[];
    return rows.map(scenarioCourse);
  },
  async getCourse(tenantId, courseId) {
    if (!scenarioTenantIds.has(tenantId)) return academicStore.getCourse(tenantId, courseId);
    const row = scenarioDatabase.prepare(`SELECT id, tenant_id, name, code, scope_code, active, created_at
      FROM academic_courses WHERE tenant_id = ? AND id = ?`).get(tenantId, courseId) as Record<string, unknown> | undefined;
    return row ? scenarioCourse(row) : null;
  },
  async listSubjects(tenantId, courseId) {
    if (!scenarioTenantIds.has(tenantId)) return academicStore.listSubjects(tenantId, courseId);
    const rows = scenarioDatabase.prepare(`SELECT s.id, s.tenant_id, s.course_id, s.name, s.code, s.workload_hours,
      s.active, s.created_at, group_concat(sc.collaborator_id, ',') AS collaborator_ids
      FROM academic_subjects s LEFT JOIN academic_subject_collaborators sc
        ON sc.tenant_id = s.tenant_id AND sc.subject_id = s.id
      WHERE s.tenant_id = ? AND s.course_id = ? GROUP BY s.id ORDER BY s.code`).all(tenantId, courseId) as unknown as Record<string, unknown>[];
    return rows.map(row => ({ id: String(row.id), tenantId: String(row.tenant_id), courseId: String(row.course_id),
      name: String(row.name), code: String(row.code), workloadHours: Number(row.workload_hours), active: Boolean(row.active),
      createdAt: String(row.created_at), collaboratorIds: String(row.collaborator_ids ?? '').split(',').filter(Boolean) }));
  },
  async listCollaboratorsByIds(tenantId, collaboratorIds) {
    if (!scenarioTenantIds.has(tenantId)) return academicStore.listCollaboratorsByIds(tenantId, collaboratorIds);
    if (!collaboratorIds.length) return [];
    const rows = scenarioDatabase.prepare(`SELECT c.id, c.tenant_id, c.person_id, p.name AS person_name, c.active, c.created_at
      FROM academic_collaborators c JOIN people_people p ON p.tenant_id = c.tenant_id AND p.id = c.person_id
      WHERE c.tenant_id = ? AND c.id IN (${collaboratorIds.map(() => '?').join(',')})`).all(tenantId, ...collaboratorIds) as unknown as Record<string, unknown>[];
    return rows.map(row => ({ id: String(row.id), tenantId: String(row.tenant_id), personId: String(row.person_id),
      personName: String(row.person_name), active: Boolean(row.active), createdAt: String(row.created_at) } satisfies Collaborator));
  },
};
const globalAcademic = createAcademicService({ store: readOnlyAcademicStore, people: globalPeople, now, newId: randomUUID });
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
catalogDatabase.exec('PRAGMA query_only = ON');
scenarioDatabase.exec('PRAGMA query_only = ON');
const services = {
  ...auth,
  identity: auth.identity,
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
};
const provisioned = await services.platformIdentity.provisionInitial({ username: 'root-cypress-e2e' });
if (provisioned.activationCode !== 'fixture-one-time-activation-code') throw new Error('Activation fixture changed unexpectedly.');
const activation = await services.platformIdentity.beginActivation({ username: provisioned.username, activationCode: provisioned.activationCode });
const activated = await services.platformIdentity.completeActivation({ username: provisioned.username,
  ceremonyToken: activation.ceremonyToken, response: { id: 'fixture-passkey' } });
const context = await services.institutionOperationContext.resolve(activated.principal, scenarioManifest.scenarios.school.tenant.id);
const seededStudent = await services.globalPeople.create(context, { name: 'Aluno E2E preparado', institutionalId: 'aluno-e2e-preparado' });
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
