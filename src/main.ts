import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { databasePool } from './database/connection.ts';
import { postgresPeopleStore } from './database/people-store.ts';
import { postgresIdentityStore } from './database/identity-store.ts';
import { postgresPlatformIdentityStore } from './database/platform-identity-store.ts';
import { postgresInstitutionOnboardingStore } from './database/institution-onboarding-store.ts';
import { createGlobalPeopleService, createPeopleService } from './people/index.ts';
import { createAcademicService } from './academic/index.ts';
import { createGlobalStudentSearchService } from './people/student-search.ts';
import { createPublicStudentSearchService } from './people/public-student-search.ts';
import { postgresAcademicStore } from './database/academic-store.ts';
import { createSqliteIdentityStore } from './database/sqlite-identity-store.ts';
import { createSqlitePeopleStore } from './database/sqlite-people-store.ts';
import { createSqliteInstitutionOnboardingStore } from './database/sqlite-institution-onboarding-store.ts';
import { createSqliteAcademicStore } from './database/sqlite-academic-store.ts';
import { createSqlitePlatformIdentityStore } from './database/sqlite-platform-identity-store.ts';
import { createSqlitePublicCatalogStore } from './database/sqlite-public-catalog-store.ts';
import { createIdentityService, createPlatformIdentityService, createPlatformWebAuthn } from './identity/index.ts';
import { createInstitutionOperationContextService, createSuperAdminService } from './super_admin/index.ts';
import { createHttpServer } from './http/server.ts';
import { createPublicCatalogService } from './public_catalog/index.ts';
import { createSqlitePublicStudentSearchStore } from './database/sqlite-public-student-search-store.ts';
import { createSqliteCredentialStore } from './database/sqlite-credential-store.ts';
import { createCredentialService } from './credential/index.ts';
import { createAcademicHistoryService } from './academic/history.ts';
import { createSqliteAcademicHistoryStore } from './database/sqlite-academic-history-store.ts';

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const origin = process.env.PUBLIC_ORIGIN ?? `http://127.0.0.1:${port}`;
if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) throw new Error('PUBLIC_ORIGIN deve usar HTTPS em produção.');
const adapter = process.env.DATABASE_ADAPTER ?? 'sqlite';
if (adapter !== 'sqlite' && adapter !== 'postgres') throw new Error('DATABASE_ADAPTER deve ser sqlite ou postgres.');
const sqlitePath = resolve(process.env.SQLITE_DATABASE_PATH ?? './data/gestao-educacional.sqlite');
let database: DatabaseSync | undefined;
let pool: ReturnType<typeof databasePool> | undefined;
if (adapter === 'sqlite') {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  database = new DatabaseSync(sqlitePath);
}
if (adapter === 'postgres') {
  pool = databasePool();
  pool.on('error', () => console.error('Conexão PostgreSQL indisponível.'));
}
const identityStore = database ? createSqliteIdentityStore(database) : postgresIdentityStore(pool!);
const store = database ? createSqlitePeopleStore(database) : postgresPeopleStore(pool!);
const onboardingStore = database ? createSqliteInstitutionOnboardingStore(database) : postgresInstitutionOnboardingStore(pool!);
const academicStore = database ? createSqliteAcademicStore(database) : postgresAcademicStore(pool!);
const platformIdentityStore = database ? createSqlitePlatformIdentityStore(database) : postgresPlatformIdentityStore(pool!);
if (!database) throw new Error('O catálogo público do MVP requer o adaptador SQLite.');
const credentialStore = createSqliteCredentialStore(database);
const academicHistoryStore = createSqliteAcademicHistoryStore(database);
const publicCatalog = createPublicCatalogService({ store: createSqlitePublicCatalogStore(database), now: () => new Date(), newId: randomUUID });
const globalPeople = createGlobalPeopleService({ store, now: () => new Date(), newId: randomUUID });
const globalAcademic = createAcademicService({ store: academicStore, people: globalPeople, now: () => new Date(), newId: randomUUID });
const publicStudentSearch = createPublicStudentSearchService({ store: createSqlitePublicStudentSearchStore(database!) });
const server = createHttpServer({
  identity: createIdentityService({ store: identityStore, now: () => new Date(), newToken: () => randomBytes(32).toString('hex') }),
  platformIdentity: createPlatformIdentityService({ store: platformIdentityStore, now: () => new Date(),
    newId: randomUUID, newActivationCode: () => randomBytes(32).toString('base64url'),
    newCeremonyToken: () => randomBytes(32).toString('base64url'), newLoginToken: () => randomBytes(32).toString('base64url'),
    newToken: () => randomBytes(32).toString('base64url'),
    newRecoveryCode: () => randomBytes(32).toString('base64url'),
    webAuthn: createPlatformWebAuthn({ origin, rpName: 'Gestão acadêmica' }) }),
  people: createPeopleService({ store, now: () => new Date(), newId: randomUUID }),
  globalPeople,
  superAdmin: createSuperAdminService({ store: onboardingStore, now: () => new Date(), newId: randomUUID }),
  globalAcademic,
  globalStudentSearch: createGlobalStudentSearchService({ people: globalPeople, academic: globalAcademic }),
  publicStudentSearch,
  institutionOperationContext: createInstitutionOperationContextService({ targets: store }),
  publicCatalog,
  credentials: createCredentialService({ store: credentialStore, students: globalPeople, courses: { get: (context, courseId) => credentialStore.getCourseForCredential(context, courseId) },
    now: () => new Date(), newId: randomUUID, newToken: () => randomBytes(32).toString('base64url') }),
  academicHistory: createAcademicHistoryService({ store: academicHistoryStore, students: globalPeople, now: () => new Date(), newId: randomUUID }),
}, { origin });
server.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`Gestão acadêmica: ${origin}`));
server.on('error', async () => { console.error('Não foi possível iniciar o servidor.'); await pool?.end(); database?.close(); process.exitCode = 1; });
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
  if (stopping) return;
  stopping = true;
  server.close(() => { void pool?.end(); database?.close(); });
});
