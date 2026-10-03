import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createAcademicService } from '../src/academic/index.ts';
import { createSqliteAcademicStore } from '../src/database/sqlite-academic-store.ts';
import { createSqliteIdentityStore } from '../src/database/sqlite-identity-store.ts';
import { createSqliteInstitutionOnboardingStore } from '../src/database/sqlite-institution-onboarding-store.ts';
import { createSqlitePeopleStore } from '../src/database/sqlite-people-store.ts';
import { createGlobalPeopleService } from '../src/people/index.ts';
import { createSuperAdminService } from '../src/super_admin/index.ts';
import type { InstitutionEducationScopeItem, InstitutionOperationContext } from '../src/institution/index.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = resolve(root, 'tests/fixtures/academic-scenario.sqlite');
const manifestPath = resolve(root, 'tests/fixtures/academic-scenario.manifest.json');
const catalogPath = resolve(root, 'tests/fixtures/catalog-listing.sqlite');
const now = () => new Date('2026-10-03T12:00:00.000Z');

const basicTracks = [
  { name: 'Ensino Fundamental — Anos Iniciais (1º ao 5º ano)', code: 'fund-anos-iniciais', scope: { level: 'BASIC', stage: 'FUNDAMENTAL' } as const,
    subjects: [['Língua Portuguesa', 200], ['Matemática', 200], ['Ciências', 120], ['História', 120], ['Geografia', 120], ['Arte', 80], ['Educação Física', 80]] as const },
  { name: 'Ensino Fundamental — Anos Finais (6º ao 9º ano)', code: 'fund-anos-finais', scope: { level: 'BASIC', stage: 'FUNDAMENTAL' } as const,
    subjects: [['Língua Portuguesa', 160], ['Matemática', 160], ['Ciências', 120], ['História', 120], ['Geografia', 120], ['Arte', 80], ['Educação Física', 80], ['Língua Inglesa', 80]] as const },
  { name: 'Ensino Médio (1º ao 3º ano)', code: 'medio-regular', scope: { level: 'BASIC', stage: 'MEDIO' } as const,
    subjects: [['Linguagens e suas Tecnologias', 180], ['Matemática e suas Tecnologias', 180], ['Ciências da Natureza e suas Tecnologias', 180], ['Ciências Humanas e Sociais Aplicadas', 180]] as const },
];
const technicalTrack = { name: 'Técnico em Administração', code: 'tec-administracao',
  scope: { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' } as const,
  subjects: [['Gestão de Pessoas', 100], ['Gestão de Materiais, Produção e Serviços', 100], ['Finanças e Orçamento', 100],
    ['Mercado e Marketing', 100], ['Sistemas de Informação', 100], ['Apoio à Decisão', 100], ['Contabilidade Aplicada', 100], ['Projeto Integrador', 100]] as const };
const higherTrack = { name: 'Bacharelado em Administração', code: 'bach-administracao',
  scope: { level: 'HIGHER', courseType: 'GRADUACAO' } as const,
  subjects: [['Administração Geral', 60], ['Contabilidade', 60], ['Economia', 60], ['Finanças', 60], ['Marketing', 60],
    ['Gestão de Pessoas', 60], ['Operações', 60], ['Métodos Quantitativos', 60]] as const };

const catalog = new DatabaseSync(catalogPath, { readOnly: true });
let database: DatabaseSync | undefined;
try {
  catalog.exec('PRAGMA query_only = ON');
  const school = catalog.prepare(`SELECT source_id AS sourceId, name, state_code AS state,
    municipality_label AS municipality FROM public_catalog_inep_school_versions
    WHERE version_id = 'catalog-listing-fixture-inep' ORDER BY source_id LIMIT 1`).get() as {
      sourceId: string; name: string; state: string; municipality: string;
    } | undefined;
  const offering = catalog.prepare(`SELECT institution_code AS institutionCode, institution_name AS institutionName,
    source_id AS courseSourceId, name AS courseName, municipality, state FROM emec_catalog_courses
    WHERE institution_code = '2' AND name = 'ADMINISTRAÇÃO' AND degree = 'Bacharelado'
      AND municipality = 'Brasília' AND state = 'DF' ORDER BY source_id LIMIT 1`).get() as {
        institutionCode: string; institutionName: string; courseSourceId: string; courseName: string; municipality: string; state: string;
      } | undefined;
  if (!school || !offering) throw new Error('O fixture de catálogo não contém as fontes locais esperadas.');

  await mkdir(dirname(fixturePath), { recursive: true });
  let fixtureExists = true;
  try { await access(fixturePath); } catch { fixtureExists = false; }
  if (fixtureExists) {
    const existing = new DatabaseSync(fixturePath, { readOnly: true });
    try {
      existing.exec('PRAGMA query_only = ON');
      const integrity = existing.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
      if (integrity.integrity_check !== 'ok') throw new Error('O fixture acadêmico existente está inválido; não foi substituído.');
      const hasSources = existing.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'academic_scenario_sources'`).get();
      if (!hasSources) throw new Error('O fixture acadêmico existente não corresponde à versão atual; não foi substituído.');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { expected: Record<string, number>; catalogSha256: string };
      const totals = existing.prepare(`SELECT (SELECT count(*) FROM institution_tenants) AS tenants,
        (SELECT count(*) FROM academic_courses) AS courses, (SELECT count(*) FROM academic_subjects) AS subjects,
        (SELECT count(*) FROM academic_enrollments) AS enrollments, (SELECT count(*) FROM audit_events) AS auditEvents,
        (SELECT count(*) FROM audit_platform_events) AS auditPlatformEvents`).get();
      if (JSON.stringify(totals) !== JSON.stringify(manifest.expected) ||
          createHash('sha256').update(await readFile(catalogPath)).digest('hex') !== manifest.catalogSha256) {
        throw new Error('O manifesto do cenário ou hash da fonte não corresponde; a fixture não foi substituída.');
      }
      console.log(`Fixture acadêmico já preparado e íntegro: ${fixturePath}`);
    } finally { existing.close(); }
    process.exit(0);
  }

  database = new DatabaseSync(fixturePath);
  createSqliteIdentityStore(database);
  const peopleStore = createSqlitePeopleStore(database);
  const institutionStore = createSqliteInstitutionOnboardingStore(database);
  database.exec(`CREATE TABLE academic_scenario_sources (
    source_kind TEXT PRIMARY KEY CHECK (source_kind IN ('INEP_SCHOOL', 'HIGHER_EDUCATION_OFFER')),
    source_id TEXT NOT NULL, institution_code TEXT, name TEXT NOT NULL, municipality TEXT NOT NULL,
    state TEXT NOT NULL, edition TEXT NOT NULL
  )`);
  database.prepare(`INSERT INTO academic_scenario_sources
    (source_kind, source_id, institution_code, name, municipality, state, edition) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('INEP_SCHOOL', school.sourceId, null, school.name, school.municipality, school.state, 'Fixture de catálogo local');
  database.prepare(`INSERT INTO academic_scenario_sources
    (source_kind, source_id, institution_code, name, municipality, state, edition) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('HIGHER_EDUCATION_OFFER', offering.courseSourceId, offering.institutionCode, offering.courseName,
      offering.municipality, offering.state, 'Fixture de catálogo local');
  let sequence = 0;
  const newId = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
  const people = createGlobalPeopleService({ store: peopleStore, now, newId });
  const academic = createAcademicService({ store: createSqliteAcademicStore(database),
    people, now, newId });
  const superAdmin = createSuperAdminService({ store: institutionStore, now, newId });
  const platform = { accountId: 'fixture-platform-admin', role: 'SUPER_ADMIN' as const, permissions: ['platform:institution:create'] };

  async function createScenario(input: { code: string; name: string; scope: readonly InstitutionEducationScopeItem[];
    tracks: readonly { name: string; code: string; scope: InstitutionEducationScopeItem; subjects: readonly (readonly [string, number])[] }[] }) {
    const tenant = await superAdmin.createInstitution(platform, { code: input.code, name: input.name,
      username: 'fixture-admin', password: 'fixture-only-password-123', educationScope: input.scope });
    const context: InstitutionOperationContext = { actorId: platform.accountId, tenantId: tenant.tenantId, actorRole: 'SUPER_ADMIN' };
    const person = await people.create(context, { name: 'Colaborador Fictício do Cenário', institutionalId: `colaborador-${input.code}` });
    const collaborator = await academic.createCollaborator(context, { personId: person.id });
    const courses = [] as { id: string; name: string; code: string; subjects: number }[];
    for (const track of input.tracks) {
      const course = await academic.createCourse(context, { name: track.name, code: track.code, educationScope: track.scope });
      for (const [index, [name, workloadHours]] of track.subjects.entries()) {
        await academic.createSubject(context, course.id, { name, code: `mat-${String(index + 1).padStart(2, '0')}`,
          workloadHours, collaboratorIds: [collaborator.id] });
      }
      courses.push({ id: course.id, name: course.name, code: course.code, subjects: track.subjects.length });
    }
    return { tenant: { id: tenant.tenantId, code: input.code, name: input.name }, collaboratorId: collaborator.id, courses };
  }

  const schoolScenario = await createScenario({ code: 'fixture-escola-local',
    name: `${school.name} — cenário demonstrativo`, scope: [
      { level: 'BASIC', stage: 'FUNDAMENTAL' }, { level: 'BASIC', stage: 'MEDIO' }, technicalTrack.scope,
    ], tracks: [...basicTracks, technicalTrack] });
  const higherScenario = await createScenario({ code: 'fixture-ies-local',
    name: `${offering.institutionName} — cenário demonstrativo`, scope: [higherTrack.scope], tracks: [higherTrack] });
  const catalogHash = createHash('sha256').update(await readFile(catalogPath)).digest('hex');
  const manifest = { edition: 'Fixture acadêmico local 2026-10-03', preparedAt: now().toISOString(),
    source: 'tests/fixtures/catalog-listing.sqlite (somente leitura)', catalogSha256: catalogHash,
    sources: { inepSchool: school, higherEducation: offering },
    scenarios: { school: schoolScenario, higherEducation: { ...higherScenario, referenceInstitutionCode: offering.institutionCode,
      referenceCourseSourceId: offering.courseSourceId } },
    expected: { tenants: 2, courses: 5, subjects: 35, enrollments: 0, auditEvents: 0, auditPlatformEvents: 0 } };
  const totals = database.prepare(`SELECT (SELECT count(*) FROM institution_tenants) AS tenants,
    (SELECT count(*) FROM academic_courses) AS courses, (SELECT count(*) FROM academic_subjects) AS subjects,
    (SELECT count(*) FROM academic_enrollments) AS enrollments,
    (SELECT count(*) FROM audit_events) AS auditEvents,
    (SELECT count(*) FROM audit_platform_events) AS auditPlatformEvents`).get();
  if (JSON.stringify(totals) !== JSON.stringify(manifest.expected)) throw new Error(`Contagens inesperadas no fixture: ${JSON.stringify(totals)}`);
  database.exec('PRAGMA journal_mode = DELETE');
  database.close(); database = undefined;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  console.log(`Fixture acadêmico criado: ${fixturePath}`);
} finally {
  database?.close();
  catalog.close();
}
