import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

test('fixture acadêmico local contém cursos de exemplo, sem matrícula, e não altera o catálogo de origem', async () => {
  const catalogPath = new URL('../../tests/fixtures/catalog-listing.sqlite', import.meta.url);
  const scenarioPath = new URL('../../tests/fixtures/academic-scenario.sqlite', import.meta.url);
  const manifestPath = new URL('../../tests/fixtures/academic-scenario.manifest.json', import.meta.url);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    readonly catalogSha256: string;
    readonly sources: { readonly inepSchool: { readonly sourceId: string; readonly name: string; readonly municipality: string; readonly state: string };
      readonly higherEducation: { readonly institutionCode: string; readonly institutionName: string; readonly courseSourceId: string; readonly courseName: string; readonly municipality: string; readonly state: string } };
    readonly expected: { readonly tenants: number; readonly courses: number; readonly subjects: number; readonly enrollments: number;
      readonly auditEvents: number; readonly auditPlatformEvents: number };
  };
  const catalogHash = createHash('sha256').update(await readFile(catalogPath)).digest('hex');
  assert.equal(catalogHash, manifest.catalogSha256);

  const catalog = new DatabaseSync(catalogPath, { readOnly: true });
  const scenario = new DatabaseSync(scenarioPath, { readOnly: true });
  try {
    catalog.exec('PRAGMA query_only = ON');
    scenario.exec('PRAGMA query_only = ON');
    const sourceSchool = catalog.prepare(`SELECT source_id AS sourceId, name, municipality_label AS municipality,
      state_code AS state FROM public_catalog_inep_school_versions WHERE source_id = ?`).get(manifest.sources.inepSchool.sourceId);
    assert.deepEqual({ ...sourceSchool }, manifest.sources.inepSchool);
    const sourceCourse = catalog.prepare(`SELECT institution_code AS institutionCode, institution_name AS institutionName,
      source_id AS courseSourceId, name AS courseName, municipality, state FROM emec_catalog_courses
      WHERE institution_code = ? AND source_id = ? AND name = ? AND municipality = ? AND state = ?`).get(
      manifest.sources.higherEducation.institutionCode, manifest.sources.higherEducation.courseSourceId,
      manifest.sources.higherEducation.courseName, manifest.sources.higherEducation.municipality,
      manifest.sources.higherEducation.state);
    assert.deepEqual({ ...sourceCourse }, manifest.sources.higherEducation);
    const selectedSources = scenario.prepare(`SELECT source_kind, source_id, institution_code, name, municipality, state, edition
      FROM academic_scenario_sources ORDER BY source_kind`).all() as unknown as Record<string, unknown>[];
    assert.deepEqual(selectedSources.map(row => ({ ...row })), [
      { source_kind: 'HIGHER_EDUCATION_OFFER', source_id: manifest.sources.higherEducation.courseSourceId,
        institution_code: manifest.sources.higherEducation.institutionCode, name: manifest.sources.higherEducation.courseName,
        municipality: manifest.sources.higherEducation.municipality, state: manifest.sources.higherEducation.state,
        edition: 'Fixture de catálogo local' },
      { source_kind: 'INEP_SCHOOL', source_id: manifest.sources.inepSchool.sourceId, institution_code: null,
        name: manifest.sources.inepSchool.name, municipality: manifest.sources.inepSchool.municipality,
        state: manifest.sources.inepSchool.state, edition: 'Fixture de catálogo local' },
    ]);
    const tables = scenario.prepare(`SELECT
      (SELECT count(*) FROM institution_tenants) AS tenants,
      (SELECT count(*) FROM academic_courses) AS courses,
      (SELECT count(*) FROM academic_subjects) AS subjects,
      (SELECT count(*) FROM academic_enrollments) AS enrollments,
      (SELECT count(*) FROM audit_events) AS auditEvents,
      (SELECT count(*) FROM audit_platform_events) AS auditPlatformEvents`).get();
    assert.deepEqual({ ...tables }, manifest.expected);
    assert.equal((scenario.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check, 'ok');
  } finally { catalog.close(); scenario.close(); }
});
