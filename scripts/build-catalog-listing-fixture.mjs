import assert from 'node:assert/strict';
import { readFileSync, createReadStream, rmSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseInepSchoolCsv } from '../src/public_catalog/inep-csv.ts';
import { createPublicCatalogService } from '../src/public_catalog/index.ts';
import { readEmecCsv } from '../src/public_catalog/emec-csv.ts';
import { createEmecCatalogService } from '../src/public_catalog/emec-catalog.ts';
import { createSqlitePublicCatalogStore } from '../src/database/sqlite-public-catalog-store.ts';
import { createSqliteEmecCatalogStore } from '../src/database/sqlite-emec-catalog-store.ts';

const outputPath = fileURLToPath(new URL('../tests/fixtures/catalog-listing.sqlite', import.meta.url));
const manifestPath = fileURLToPath(new URL('../tests/fixtures/catalog-listing.manifest.json', import.meta.url));
const operator = { accountId: 'fixture-builder', role: 'SUPER_ADMIN' };
const edition = 'Fixture de listagem — dados abertos locais';
const collectedAt = '2026-10-03T00:00:00.000Z';

const schoolSource = new URL('../CSV_DADOS_ABERTOS/Análise - Tabela da lista das escolas.csv', import.meta.url);
const inepParsed = parseInepSchoolCsv(readFileSync(schoolSource), {
  edition,
  collectedAt,
  sourceUrl: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/',
});
const schoolsByMunicipality = new Map();
for (const school of inepParsed.records) {
  const state = school.state?.code?.trim();
  const municipality = school.municipality?.label?.trim();
  if (!state || !municipality) continue;
  const key = `${state}|${municipality}`;
  const existing = schoolsByMunicipality.get(key);
  if (!existing || school.sourceId.localeCompare(existing.sourceId, 'en') < 0) schoolsByMunicipality.set(key, school);
}
const schools = [...schoolsByMunicipality.values()].sort((left, right) =>
  (left.state?.code ?? '').localeCompare(right.state?.code ?? '') ||
  (left.municipality?.label ?? '').localeCompare(right.municipality?.label ?? '', 'pt-BR') ||
  left.sourceId.localeCompare(right.sourceId, 'en'));

const institutionPath = new URL('../CSV_DADOS_ABERTOS/PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv', import.meta.url);
const coursePath = new URL('../CSV_DADOS_ABERTOS/PDA_Dados_Cursos_Graduacao_Brasil.csv', import.meta.url);
const institutions = [];
for await (const row of readEmecCsv(createReadStream(institutionPath), 'institutions')) {
  if (row.type === 'institution' && /^[A-Z]{2}$/.test(row.value.state ?? '')) institutions.push(row);
}
const institutionByCode = new Map(institutions.map(row => [row.value.sourceId, row.value]));
const institutionsWithCourses = new Set();
for await (const row of readEmecCsv(createReadStream(coursePath), 'courses')) {
  if (row.type === 'course' && institutionByCode.has(row.value.institutionCode)) institutionsWithCourses.add(row.value.institutionCode);
}

const selectedByState = new Map();
for (const [code, institution] of [...institutionByCode].sort(([left], [right]) => Number(left) - Number(right))) {
  if (!institutionsWithCourses.has(code) || selectedByState.has(institution.state)) continue;
  selectedByState.set(institution.state, code);
}
const selectedCodes = new Set(selectedByState.values());
const selectedInstitutions = institutions.filter(row => selectedCodes.has(row.value.sourceId));
const selectedCourses = [];
for await (const row of readEmecCsv(createReadStream(coursePath), 'courses')) {
  if (row.type === 'course' && selectedCodes.has(row.value.institutionCode)) selectedCourses.push(row);
}

assert.equal(schools.length, 5567, 'A cobertura de município/UF do CSV INEP mudou; revise o manifesto do fixture.');
assert.equal(selectedByState.size, 27, 'A cobertura estadual de IES e-MEC mudou; revise o manifesto do fixture.');
assert.equal(selectedCourses.length, 5358, 'A quantidade de ofertas das IES escolhidas mudou; revise o manifesto do fixture.');

rmSync(outputPath, { force: true });
const database = new DatabaseSync(outputPath);
try {
  const publicCatalog = createPublicCatalogService({
    store: createSqlitePublicCatalogStore(database),
    now: () => new Date(collectedAt),
    newId: () => 'catalog-listing-fixture-inep',
  });
  const inepVersion = await publicCatalog.previewInepSchools(operator, {
    edition, collectedAt,
    sourceUrl: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/',
    records: schools,
  });
  assert.equal(inepVersion.validCount, schools.length);
  assert.equal(inepVersion.rejectedCount, 0);
  await publicCatalog.applyInepSchools(operator, inepVersion.id);

  const emecCatalog = createEmecCatalogService({
    store: createSqliteEmecCatalogStore(database),
    newId: () => 'catalog-listing-fixture-emec',
  });
  const emecVersion = await emecCatalog.preview(operator, {
    edition, collectedAt,
    institutions: (async function* () { yield* selectedInstitutions; })(),
    courses: (async function* () { yield* selectedCourses; })(),
  });
  assert.equal(emecVersion.institutionCount, selectedInstitutions.length);
  assert.equal(emecVersion.institutionCount, 27);
  assert.equal(emecVersion.courseCount, 5358);
  await emecCatalog.apply(operator, emecVersion.id);

  const integrity = database.prepare('PRAGMA integrity_check').get();
  assert.equal(Object.values(integrity)[0], 'ok');
  const schoolCount = database.prepare(`SELECT count(*) AS count FROM public_catalog_inep_school_versions
    WHERE version_id = 'catalog-listing-fixture-inep'`).get().count;
  const institutionCount = database.prepare(`SELECT count(*) AS count FROM emec_catalog_institutions
    WHERE version_id = 'catalog-listing-fixture-emec'`).get().count;
  const courseCount = database.prepare(`SELECT count(*) AS count FROM emec_catalog_courses
    WHERE version_id = 'catalog-listing-fixture-emec'`).get().count;
  const stateCoverage = database.prepare(`SELECT count(DISTINCT state) AS count FROM emec_catalog_institutions
    WHERE version_id = 'catalog-listing-fixture-emec' AND length(state) = 2`).get().count;
  const offeringsWithoutIes = database.prepare(`SELECT count(*) AS count FROM emec_catalog_courses courses
    LEFT JOIN emec_catalog_institutions institutions ON institutions.version_id = courses.version_id
      AND institutions.source_id = courses.institution_code
    WHERE courses.version_id = 'catalog-listing-fixture-emec' AND institutions.source_id IS NULL`).get().count;
  assert.equal(schoolCount, 5567);
  assert.equal(institutionCount, 27);
  assert.equal(courseCount, 5358);
  assert.equal(stateCoverage, 27);
  assert.equal(offeringsWithoutIes, 0);
  const operatingData = database.prepare(`SELECT
    (SELECT count(*) FROM sqlite_master WHERE type='table' AND name LIKE 'academic_%') +
    (SELECT count(*) FROM sqlite_master WHERE type='table' AND name LIKE 'institution_%') +
    (SELECT count(*) FROM sqlite_master WHERE type='table' AND name LIKE 'people_%') AS count`).get().count;
  assert.equal(operatingData, 0, 'O fixture contém tabelas operacionais, que não fazem parte do catálogo de referência.');

  const manifest = {
    edition,
    sources: [
      'CSV_DADOS_ABERTOS/Análise - Tabela da lista das escolas.csv',
      'CSV_DADOS_ABERTOS/PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv',
      'CSV_DADOS_ABERTOS/PDA_Dados_Cursos_Graduacao_Brasil.csv',
    ],
    selection: {
      inepSchool: 'Menor código INEP por nome de município e UF publicados.',
      emecInstitution: 'Menor código e-MEC por UF entre IES com ofertas publicadas; inclui todas as ofertas desses códigos.',
    },
    counts: { schools: schoolCount, municipalityStates: schools.length, institutions: institutionCount,
      institutionStates: stateCoverage, courses: courseCount, offeringsWithoutInstitution: offeringsWithoutIes },
    institutions: [...selectedByState.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([state, code]) => ({
      state, code, name: institutionByCode.get(code).name,
    })),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  database.exec('PRAGMA optimize');
  database.exec('VACUUM');
  console.log(JSON.stringify({ outputPath, manifestPath, integrity: 'ok', ...manifest.counts }, null, 2));
} finally {
  database.close();
}
