import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { InepSchool, InepSchoolQuery, PublicCatalogStore, PublicCatalogVersion } from '../public_catalog/index.ts';

const schema = `
  CREATE TABLE public_catalog_versions (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source = 'INEP_CENSO_ESCOLAR'),
    edition TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    source_url TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('REVIEW', 'APPLIED')),
    completeness TEXT NOT NULL CHECK (completeness IN ('COMPLETE', 'PARTIAL')),
    valid_count INTEGER NOT NULL CHECK (valid_count >= 0),
    rejected_count INTEGER NOT NULL CHECK (rejected_count >= 0),
    conflict_count INTEGER NOT NULL CHECK (conflict_count >= 0),
    applied_at TEXT
  );
  CREATE TABLE public_catalog_inep_school_versions (
    version_id TEXT NOT NULL REFERENCES public_catalog_versions(id),
    source_id TEXT NOT NULL,
    name TEXT NOT NULL,
    situation_code TEXT,
    situation_label TEXT,
    state_code TEXT,
    state_label TEXT,
    municipality_code TEXT,
    municipality_label TEXT,
    educational_offers_json TEXT NOT NULL,
    PRIMARY KEY (version_id, source_id)
  );
  CREATE TABLE public_catalog_rejections (
    version_id TEXT NOT NULL REFERENCES public_catalog_versions(id),
    rejection_order INTEGER NOT NULL,
    source_id TEXT,
    reason TEXT NOT NULL,
    PRIMARY KEY (version_id, rejection_order)
  );
  CREATE TABLE public_catalog_current_versions (
    source TEXT PRIMARY KEY CHECK (source = 'INEP_CENSO_ESCOLAR'),
    version_id TEXT NOT NULL UNIQUE REFERENCES public_catalog_versions(id)
  );
  CREATE INDEX public_catalog_inep_schools_by_name ON public_catalog_inep_school_versions(name);
`;
const schemaChecksum = createHash('sha256').update(schema).digest('hex');

interface VersionRow {
  id: string; source: 'INEP_CENSO_ESCOLAR'; edition: string; collected_at: string; source_url: string;
  state: 'REVIEW' | 'APPLIED'; completeness: 'COMPLETE' | 'PARTIAL'; valid_count: number;
  rejected_count: number; conflict_count: number; applied_at: string | null;
}
interface SchoolRow {
  version_id: string; source_id: string; name: string; situation_code: string | null; situation_label: string | null;
  state_code: string | null; state_label: string | null; municipality_code: string | null; municipality_label: string | null;
  educational_offers_json: string;
}

function pair(code: string | null, label: string | null) {
  return code === null && label === null ? null : { code, label };
}

function schoolFromRow(row: SchoolRow, versionId = row.version_id): InepSchool {
  return {
    sourceId: row.source_id,
    name: row.name,
    situation: pair(row.situation_code, row.situation_label),
    state: pair(row.state_code, row.state_label),
    municipality: pair(row.municipality_code, row.municipality_label),
    educationalOffers: JSON.parse(row.educational_offers_json) as InepSchool['educationalOffers'],
    versionId,
  };
}

export function createSqlitePublicCatalogStore(database: DatabaseSync): PublicCatalogStore {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(`CREATE TABLE IF NOT EXISTS public_catalog_schema_migrations (
    version INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, checksum TEXT NOT NULL, applied_at TEXT NOT NULL
  )`);
  const migration = database.prepare('SELECT checksum FROM public_catalog_schema_migrations WHERE version = 1').get() as { checksum: string } | undefined;
  if (migration && migration.checksum !== schemaChecksum) throw new Error('Migração SQLite do catálogo público foi alterada após aplicação.');
  if (!migration) {
    database.exec('BEGIN IMMEDIATE');
    try {
      database.exec(schema);
      database.prepare(`INSERT INTO public_catalog_schema_migrations(version, name, checksum, applied_at)
        VALUES (1, 'public_catalog_initial', ?, ?)`).run(schemaChecksum, new Date().toISOString());
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* Preserve the schema error. */ }
      throw error;
    }
  }

  return {
    async savePreview(version) {
      database.exec('BEGIN IMMEDIATE');
      try {
        database.prepare(`INSERT INTO public_catalog_versions
          (id, source, edition, collected_at, source_url, state, completeness, valid_count, rejected_count, conflict_count, applied_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`)
          .run(version.id, version.source, version.edition, version.collectedAt, version.sourceUrl, version.state,
            version.completeness, version.validCount, version.rejectedCount, version.conflictCount);
        const addSchool = database.prepare(`INSERT INTO public_catalog_inep_school_versions
          (version_id, source_id, name, situation_code, situation_label, state_code, state_label,
           municipality_code, municipality_label, educational_offers_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const school of version.schools) {
          addSchool.run(version.id, school.sourceId, school.name, school.situation?.code ?? null,
            school.situation?.label ?? null, school.state?.code ?? null, school.state?.label ?? null,
            school.municipality?.code ?? null, school.municipality?.label ?? null,
            JSON.stringify(school.educationalOffers));
        }
        const addRejection = database.prepare(`INSERT INTO public_catalog_rejections
          (version_id, rejection_order, source_id, reason) VALUES (?, ?, ?, ?)`);
        version.rejected.forEach((item, index) => addRejection.run(version.id, index, item.sourceId, item.reason));
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve the write error. */ }
        throw error;
      }
    },
    async getVersion(id) {
      const row = database.prepare('SELECT * FROM public_catalog_versions WHERE id = ?').get(id) as VersionRow | undefined;
      if (!row) return null;
      const schoolRows = database.prepare(`SELECT * FROM public_catalog_inep_school_versions
        WHERE version_id = ? ORDER BY source_id`).all(id) as unknown as SchoolRow[];
      const rejected = database.prepare(`SELECT source_id, reason FROM public_catalog_rejections
        WHERE version_id = ? ORDER BY rejection_order`).all(id) as unknown as { source_id: string | null; reason: string }[];
      return {
        id: row.id,
        source: row.source,
        edition: row.edition,
        collectedAt: row.collected_at,
        sourceUrl: row.source_url,
        state: row.state,
        completeness: row.completeness,
        validCount: row.valid_count,
        rejectedCount: row.rejected_count,
        conflictCount: row.conflict_count,
        ...(row.applied_at ? { appliedAt: row.applied_at } : {}),
        schools: schoolRows.map(school => schoolFromRow(school, id)),
        rejected: rejected.map(item => ({ sourceId: item.source_id, reason: item.reason })),
      };
    },
    async applyVersion(id, appliedAt) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const result = database.prepare(`UPDATE public_catalog_versions SET state = 'APPLIED', applied_at = ?
          WHERE id = ? AND state = 'REVIEW'`).run(appliedAt, id);
        if (!result.changes) {
          database.exec('ROLLBACK');
          return null;
        }
        database.prepare(`INSERT INTO public_catalog_current_versions(source, version_id)
          VALUES ('INEP_CENSO_ESCOLAR', ?)
          ON CONFLICT(source) DO UPDATE SET version_id = excluded.version_id`).run(id);
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve the write error. */ }
        throw error;
      }
      return this.getVersion(id);
    },
    async listSchools(query: InepSchoolQuery = {}, limit = 100) {
      const normalized = (value?: string) => value?.trim().toLocaleLowerCase('pt-BR');
      const name = normalized(query.name); const sourceId = normalized(query.sourceId);
      const municipality = normalized(query.municipality); const state = normalized(query.state);
      const rows = database.prepare(`SELECT schools.* FROM public_catalog_inep_school_versions schools
        JOIN public_catalog_current_versions current ON current.version_id = schools.version_id
        WHERE (? IS NULL OR lower(schools.name) LIKE ? ESCAPE '\\')
          AND (? IS NULL OR lower(schools.source_id) LIKE ? ESCAPE '\\')
          AND (? IS NULL OR lower(COALESCE(schools.municipality_label, '')) LIKE ? ESCAPE '\\' OR schools.municipality_code LIKE ? ESCAPE '\\')
          AND (? IS NULL OR lower(COALESCE(schools.state_code, '')) = ? OR lower(COALESCE(schools.state_label, '')) = ?)
        ORDER BY schools.name COLLATE NOCASE, schools.source_id LIMIT ?`).all(
          name ?? null, name === undefined ? null : `%${name.replace(/[\\%_]/g, '\\$&')}%`,
          sourceId ?? null, sourceId === undefined ? null : `%${sourceId.replace(/[\\%_]/g, '\\$&')}%`,
          municipality ?? null, municipality === undefined ? null : `%${municipality.replace(/[\\%_]/g, '\\$&')}%`,
          municipality === undefined ? null : `%${municipality.replace(/[\\%_]/g, '\\$&')}%`,
          state ?? null, state ?? null, state ?? null,
          limit,
        ) as unknown as SchoolRow[];
      return rows.map(row => schoolFromRow(row));
    },
  };
}
