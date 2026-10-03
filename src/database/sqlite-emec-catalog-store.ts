import type { DatabaseSync, StatementSync } from 'node:sqlite';
import type { EmecCourseRecord, EmecInstitutionRecord } from '../public_catalog/emec-csv.ts';
import type { EmecCatalogQuery, EmecCatalogStore, EmecCatalogVersion } from '../public_catalog/emec-catalog.ts';

const schema = `
  CREATE TABLE IF NOT EXISTS emec_catalog_versions (
    id TEXT PRIMARY KEY, edition TEXT NOT NULL, collected_at TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('REVIEW','APPLIED')),
    completeness TEXT NOT NULL CHECK (completeness IN ('COMPLETE','PARTIAL')),
    institution_count INTEGER NOT NULL, course_count INTEGER NOT NULL, duplicate_count INTEGER NOT NULL,
    rejected_count INTEGER NOT NULL, conflict_count INTEGER NOT NULL, applied_at TEXT
  );
  CREATE TABLE IF NOT EXISTS emec_catalog_institutions (
    version_id TEXT NOT NULL REFERENCES emec_catalog_versions(id), source_id TEXT NOT NULL,
    name TEXT NOT NULL, acronym TEXT, category TEXT, organization TEXT,
    municipality_code TEXT, municipality TEXT, state TEXT, status TEXT,
    record_json TEXT NOT NULL, PRIMARY KEY(version_id, source_id)
  );
  CREATE INDEX IF NOT EXISTS emec_institutions_name ON emec_catalog_institutions(name);
  CREATE TABLE IF NOT EXISTS emec_catalog_courses (
    version_id TEXT NOT NULL REFERENCES emec_catalog_versions(id), institution_code TEXT NOT NULL,
    institution_name TEXT, source_id TEXT NOT NULL, name TEXT NOT NULL, degree TEXT, area TEXT,
    modality TEXT, status TEXT, workload TEXT, municipality_code TEXT NOT NULL DEFAULT '',
    municipality TEXT, state TEXT NOT NULL DEFAULT '', record_json TEXT NOT NULL,
    PRIMARY KEY(version_id, institution_code, source_id, municipality_code, state)
  );
  CREATE INDEX IF NOT EXISTS emec_courses_name ON emec_catalog_courses(name);
  CREATE TABLE IF NOT EXISTS emec_catalog_issues (
    version_id TEXT NOT NULL REFERENCES emec_catalog_versions(id), issue_order INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('REJECTED','CONFLICT')),
    source TEXT NOT NULL CHECK(source IN ('institutions','courses')), line INTEGER NOT NULL, reason TEXT NOT NULL,
    PRIMARY KEY(version_id, issue_order)
  );
  CREATE TABLE IF NOT EXISTS emec_catalog_current_version (
    singleton INTEGER PRIMARY KEY CHECK(singleton=1), version_id TEXT NOT NULL UNIQUE REFERENCES emec_catalog_versions(id)
  );`;

interface VersionRow {
  id: string; edition: string; collected_at: string; state: 'REVIEW' | 'APPLIED'; completeness: 'COMPLETE' | 'PARTIAL';
  institution_count: number; course_count: number; duplicate_count: number; rejected_count: number; conflict_count: number; applied_at: string | null;
}
interface InstitutionRow {
  source_id: string; name: string; acronym: string | null; category: string | null; organization: string | null;
  municipality_code: string | null; municipality: string | null; state: string | null; status: string | null; record_json: string;
}
interface CourseRow {
  institution_code: string; institution_name: string | null; source_id: string; name: string; degree: string | null;
  area: string | null; modality: string | null; status: string | null; workload: string | null;
  municipality_code: string; municipality: string | null; state: string; record_json: string;
}

function versionFromRow(row: VersionRow, issues: EmecCatalogVersion['issues']): EmecCatalogVersion {
  return { id: row.id, edition: row.edition, collectedAt: row.collected_at, source: 'EMEC_DADOS_ABERTOS', state: row.state,
    completeness: row.completeness, institutionCount: row.institution_count, courseCount: row.course_count,
    duplicateCount: row.duplicate_count, rejectedCount: row.rejected_count, conflictCount: row.conflict_count,
    ...(row.applied_at ? { appliedAt: row.applied_at } : {}), issues };
}

function contains(value: string): string {
  return `%${value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\\%_]/g, '\\$&').toLocaleLowerCase('pt-BR')}%`;
}

function searchable(column: string): string {
  let expression = column;
  const accents = { a: 'áàâãäÁÀÂÃÄ', c: 'çÇ', e: 'éèêëÉÈÊË', i: 'íìîïÍÌÎÏ', n: 'ñÑ', o: 'óòôõöÓÒÔÕÖ', u: 'úùûüÚÙÛÜ', y: 'ýÿÝŸ' };
  for (const [plain, characters] of Object.entries(accents)) {
    for (const character of characters) expression = `replace(${expression}, '${character}', '${plain}')`;
  }
  return `lower(${expression})`;
}

export function createSqliteEmecCatalogStore(database: DatabaseSync): EmecCatalogStore {
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(schema);
  let activeTransaction = false;
  let nextIssueOrder = 0;
  let insertInstitution: StatementSync | undefined;
  let insertCourse: StatementSync | undefined;
  let selectInstitution: StatementSync | undefined;
  let selectCourse: StatementSync | undefined;
  return {
    async beginPreview(version) {
      database.exec('BEGIN IMMEDIATE'); activeTransaction = true; nextIssueOrder = 0;
      database.prepare(`INSERT INTO emec_catalog_versions
        (id,edition,collected_at,state,completeness,institution_count,course_count,duplicate_count,rejected_count,conflict_count,applied_at)
        VALUES(?,?,?,'REVIEW','COMPLETE',0,0,0,0,0,NULL)`)
        .run(version.id, version.edition, version.collectedAt);
      insertInstitution = database.prepare(`INSERT INTO emec_catalog_institutions
        (version_id,source_id,name,acronym,category,organization,municipality_code,municipality,state,status,record_json)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
      selectInstitution = database.prepare('SELECT record_json FROM emec_catalog_institutions WHERE version_id=? AND source_id=?');
      insertCourse = database.prepare(`INSERT INTO emec_catalog_courses
        (version_id,institution_code,institution_name,source_id,name,degree,area,modality,status,workload,municipality_code,municipality,state,record_json)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
      selectCourse = database.prepare(`SELECT record_json FROM emec_catalog_courses WHERE version_id=? AND institution_code=? AND source_id=?
        AND municipality_code=? AND state=?`);
    },
    async addInstitution(versionId, value) {
      const existing = selectInstitution!.get(versionId, value.sourceId) as { record_json: string } | undefined;
      if (existing) return existing.record_json === JSON.stringify(value) ? 'duplicate' : 'conflict';
      insertInstitution!.run(versionId, value.sourceId, value.name, value.acronym, value.category, value.organization,
        value.municipalityCode, value.municipality, value.state, value.status, JSON.stringify(value));
      return 'created';
    },
    async addCourse(versionId, value) {
      const municipalityCode = value.municipalityCode ?? ''; const state = value.state ?? '';
      const existing = selectCourse!.get(versionId, value.institutionCode, value.sourceId, municipalityCode, state) as { record_json: string } | undefined;
      if (existing) return existing.record_json === JSON.stringify(value) ? 'duplicate' : 'conflict';
      insertCourse!.run(versionId, value.institutionCode, value.institutionName, value.sourceId, value.name, value.degree,
        value.area, value.modality, value.status, value.workload, municipalityCode, value.municipality, state, JSON.stringify(value));
      return 'created';
    },
    async listInstitutionCodes(versionId) {
      return (database.prepare('SELECT source_id FROM emec_catalog_institutions WHERE version_id=?').all(versionId) as { source_id: string }[])
        .map(row => row.source_id);
    },
    async addIssue(versionId, issue) {
      database.prepare(`INSERT INTO emec_catalog_issues(version_id,issue_order,kind,source,line,reason) VALUES(?,?,?,?,?,?)`)
        .run(versionId, nextIssueOrder++, issue.kind, issue.source, issue.line, issue.reason);
    },
    async completePreview(version) {
      database.prepare(`UPDATE emec_catalog_versions SET completeness=?,institution_count=?,course_count=?,duplicate_count=?,rejected_count=?,conflict_count=? WHERE id=?`)
        .run(version.completeness, version.institutionCount, version.courseCount, version.duplicateCount,
          version.rejectedCount, version.conflictCount, version.id);
      database.exec('COMMIT'); activeTransaction = false;
    },
    async abortPreview() { if (activeTransaction) { database.exec('ROLLBACK'); activeTransaction = false; } },
    async getVersion(id) {
      const row = database.prepare('SELECT * FROM emec_catalog_versions WHERE id=?').get(id) as VersionRow | undefined;
      if (!row) return null;
      const issues = database.prepare(`SELECT kind,source,line,reason FROM emec_catalog_issues WHERE version_id=? ORDER BY issue_order LIMIT 100`)
        .all(id) as { kind: 'REJECTED' | 'CONFLICT'; source: 'institutions' | 'courses'; line: number; reason: string }[];
      return versionFromRow(row, issues.map(issue => ({ ...issue, line: Number(issue.line) })));
    },
    async applyVersion(id, appliedAt) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const result = database.prepare(`UPDATE emec_catalog_versions SET state='APPLIED',applied_at=? WHERE id=? AND state='REVIEW'`)
          .run(appliedAt, id);
        if (!result.changes) { database.exec('ROLLBACK'); return null; }
        database.prepare(`INSERT INTO emec_catalog_current_version(singleton,version_id) VALUES(1,?)
          ON CONFLICT(singleton) DO UPDATE SET version_id=excluded.version_id`).run(id);
        database.exec('COMMIT');
      } catch (error) { try { database.exec('ROLLBACK'); } catch { /* Preserve the write failure. */ } throw error; }
      return this.getVersion(id);
    },
    async listCurrentInstitutions() {
      const rows = database.prepare(`SELECT institutions.* FROM emec_catalog_institutions institutions
        JOIN emec_catalog_current_version current ON current.version_id=institutions.version_id ORDER BY institutions.name LIMIT 100`)
        .all() as unknown as InstitutionRow[];
      return rows.map(row => JSON.parse(row.record_json) as EmecInstitutionRecord);
    },
    async listCurrentCourses() {
      const rows = database.prepare(`SELECT courses.* FROM emec_catalog_courses courses
        JOIN emec_catalog_current_version current ON current.version_id=courses.version_id
        ORDER BY courses.institution_code,courses.name LIMIT 100`).all() as unknown as CourseRow[];
      return rows.map(row => JSON.parse(row.record_json) as EmecCourseRecord);
    },
    async searchCurrent(query: EmecCatalogQuery, page: number, pageSize: number) {
      const institutionWhere: string[] = ['current.singleton=1'];
      const institutionParams: Array<string | number> = [];
      const courseWhere: string[] = ['current.singleton=1'];
      const courseParams: Array<string | number> = [];
      if (query.name) {
        institutionWhere.push(`${searchable('institutions.name')} LIKE ? ESCAPE '\\'`);
        institutionParams.push(contains(query.name));
        courseWhere.push(`${searchable('institutions.name')} LIKE ? ESCAPE '\\'`);
        courseParams.push(contains(query.name));
      }
      if (query.course) {
        institutionWhere.push(`EXISTS (SELECT 1 FROM emec_catalog_courses matching_courses
          WHERE matching_courses.version_id=institutions.version_id AND matching_courses.institution_code=institutions.source_id
            AND ${searchable('matching_courses.name')} LIKE ? ESCAPE '\\'
            ${query.municipality ? `AND ${searchable("COALESCE(matching_courses.municipality, '')")} LIKE ? ESCAPE '\\' AND upper(COALESCE(matching_courses.state, '')) = ?` : ''})`);
        institutionParams.push(contains(query.course));
        if (query.municipality && query.state) institutionParams.push(contains(query.municipality), query.state);
        courseWhere.push(`${searchable('courses.name')} LIKE ? ESCAPE '\\'`);
        courseParams.push(contains(query.course));
      }
      if (query.municipality && query.state) {
        if (query.course) {
          courseWhere.push(`${searchable("COALESCE(courses.municipality, '')")} LIKE ? ESCAPE '\\'`);
          courseParams.push(contains(query.municipality));
          courseWhere.push('upper(COALESCE(courses.state, \'\')) = ?');
          courseParams.push(query.state);
        } else {
          institutionWhere.push(`${searchable("COALESCE(institutions.municipality, '')")} LIKE ? ESCAPE '\\'`);
          institutionWhere.push('upper(COALESCE(institutions.state, \'\')) = ?');
          institutionParams.push(contains(query.municipality), query.state);
        }
      }
      const institutionFrom = `FROM emec_catalog_institutions institutions
        JOIN emec_catalog_current_version current ON current.version_id=institutions.version_id`;
      const courseFrom = `FROM emec_catalog_courses courses
        JOIN emec_catalog_current_version current ON current.version_id=courses.version_id
        JOIN emec_catalog_institutions institutions ON institutions.version_id=courses.version_id
          AND institutions.source_id=courses.institution_code`;
      const institutionCount = database.prepare(`SELECT count(*) AS count ${institutionFrom} WHERE ${institutionWhere.join(' AND ')}`)
        .get(...institutionParams) as { count: number };
      const courseCount = database.prepare(`SELECT count(*) AS count ${courseFrom} WHERE ${courseWhere.join(' AND ')}`)
        .get(...courseParams) as { count: number };
      const offset = (page - 1) * pageSize;
      const institutionRows = database.prepare(`SELECT institutions.record_json ${institutionFrom}
        WHERE ${institutionWhere.join(' AND ')} ORDER BY institutions.name COLLATE NOCASE, institutions.source_id LIMIT ? OFFSET ?`)
        .all(...institutionParams, pageSize, offset) as { record_json: string }[];
      const courseRows = database.prepare(`SELECT courses.record_json ${courseFrom}
        WHERE ${courseWhere.join(' AND ')} ORDER BY courses.institution_code,courses.name COLLATE NOCASE,courses.source_id,
          courses.municipality_code,courses.state LIMIT ? OFFSET ?`)
        .all(...courseParams, pageSize, offset) as { record_json: string }[];
      return {
        institutions: institutionRows.map(row => JSON.parse(row.record_json) as EmecInstitutionRecord),
        courses: courseRows.map(row => JSON.parse(row.record_json) as EmecCourseRecord),
        totalInstitutions: institutionCount.count,
        totalCourses: courseCount.count,
      };
    },
  };
}
