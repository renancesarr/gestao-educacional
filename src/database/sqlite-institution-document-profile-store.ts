import type { DatabaseSync } from 'node:sqlite';
import type { InstitutionDocumentProfileStore, InstitutionEmployee, InstitutionImage, StoredDocumentAsset } from '../institution/document-profile.ts';

type EmployeeRow = { id: string; tenant_id: string; person_id: string; person_name: string; active: number; created_at: string; signature_configured: number; stamp_configured: number };
type ProfileRow = {
  tenant_id: string; code: string; name: string; logo_media_type: string | null;
  director_id: string | null; director_person_id: string | null; director_name: string | null; director_active: number | null;
  records_id: string | null; records_person_id: string | null; records_name: string | null; records_active: number | null;
};

const employee = (row: EmployeeRow): InstitutionEmployee => ({ id: row.id, tenantId: row.tenant_id,
  personId: row.person_id, personName: row.person_name, active: row.active === 1, administrative: true,
  createdAt: row.created_at, signatureConfigured: row.signature_configured === 1, stampConfigured: row.stamp_configured === 1 });

function atomic<T>(database: DatabaseSync, work: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try { const result = work(); database.exec('COMMIT'); return result; }
  catch (error) { try { database.exec('ROLLBACK'); } catch { /* preserve original error */ } throw error; }
}

export function createSqliteInstitutionDocumentProfileStore(database: DatabaseSync): InstitutionDocumentProfileStore {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS institution_document_employees (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
      person_id TEXT NOT NULL,
      administrative INTEGER NOT NULL DEFAULT 1 CHECK (administrative = 1),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL,
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, person_id),
      FOREIGN KEY (tenant_id, person_id) REFERENCES people_people(tenant_id, id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS institution_document_profiles (
      tenant_id TEXT PRIMARY KEY REFERENCES institution_tenants(id) ON DELETE CASCADE,
      logo_media_type TEXT CHECK (logo_media_type IS NULL OR logo_media_type IN ('image/png', 'image/svg+xml')),
      logo_bytes BLOB,
      director_employee_id TEXT,
      records_officer_employee_id TEXT,
      CHECK ((logo_media_type IS NULL) = (logo_bytes IS NULL)),
      FOREIGN KEY (tenant_id, director_employee_id) REFERENCES institution_document_employees(tenant_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (tenant_id, records_officer_employee_id) REFERENCES institution_document_employees(tenant_id, id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS institution_document_employee_assets (
      tenant_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('signature', 'stamp')),
      media_type TEXT NOT NULL CHECK (media_type = 'image/png'),
      bytes BLOB NOT NULL,
      PRIMARY KEY (tenant_id, employee_id, kind),
      FOREIGN KEY (tenant_id, employee_id) REFERENCES institution_document_employees(tenant_id, id) ON DELETE CASCADE
    );
  `);
  const employeeSelect = `SELECT e.id, e.tenant_id, e.person_id, p.name AS person_name, e.active, e.created_at,
    EXISTS(SELECT 1 FROM institution_document_employee_assets a WHERE a.tenant_id=e.tenant_id AND a.employee_id=e.id AND a.kind='signature') AS signature_configured,
    EXISTS(SELECT 1 FROM institution_document_employee_assets a WHERE a.tenant_id=e.tenant_id AND a.employee_id=e.id AND a.kind='stamp') AS stamp_configured
    FROM institution_document_employees e JOIN people_people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id`;

  return {
    async getProfile(tenantId) {
      const row = database.prepare(`SELECT t.id AS tenant_id, t.code, t.name, d.logo_media_type,
        director.id AS director_id, director.person_id AS director_person_id, director_person.name AS director_name, director.active AS director_active,
        records.id AS records_id, records.person_id AS records_person_id, records_person.name AS records_name, records.active AS records_active
        FROM institution_tenants t
        LEFT JOIN institution_document_profiles d ON d.tenant_id=t.id
        LEFT JOIN institution_document_employees director ON director.tenant_id=t.id AND director.id=d.director_employee_id
        LEFT JOIN people_people director_person ON director_person.tenant_id=t.id AND director_person.id=director.person_id
        LEFT JOIN institution_document_employees records ON records.tenant_id=t.id AND records.id=d.records_officer_employee_id
        LEFT JOIN people_people records_person ON records_person.tenant_id=t.id AND records_person.id=records.person_id
        WHERE t.id=?`).get(tenantId) as ProfileRow | undefined;
      if (!row) return null;
      const employees = (database.prepare(`${employeeSelect} WHERE e.tenant_id=? ORDER BY p.name, e.id`).all(tenantId) as EmployeeRow[]).map(employee);
      const director = employees.find(value => value.id === row.director_id) ?? null;
      const recordsOfficer = employees.find(value => value.id === row.records_id) ?? null;
      return { tenantId, code: row.code, name: row.name, logoConfigured: row.logo_media_type !== null,
        logoMediaType: row.logo_media_type as InstitutionImage['mediaType'] | null, employees, director, recordsOfficer,
        signatureConfigured: recordsOfficer?.signatureConfigured ?? false, stampConfigured: recordsOfficer?.stampConfigured ?? false };
    },
    async saveLogo(tenantId, image) {
      const result = database.prepare(`INSERT INTO institution_document_profiles (tenant_id, logo_media_type, logo_bytes)
        SELECT id, ?, ? FROM institution_tenants WHERE id=?
        ON CONFLICT(tenant_id) DO UPDATE SET logo_media_type=excluded.logo_media_type, logo_bytes=excluded.logo_bytes`)
        .run(image.mediaType, image.bytes, tenantId);
      return result.changes > 0;
    },
    async createEmployee(value) {
      if (!database.prepare('SELECT 1 FROM people_people WHERE tenant_id=? AND id=?').get(value.tenantId, value.personId)) return 'missing-person';
      try {
        database.prepare(`INSERT INTO institution_document_employees (id, tenant_id, person_id, created_at)
          VALUES (?, ?, ?, ?)`).run(value.id, value.tenantId, value.personId, value.createdAt);
        return 'created';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: institution_document_employees.tenant_id, institution_document_employees.person_id')) return 'duplicate';
        throw error;
      }
    },
    async listEmployees(tenantId) {
      return (database.prepare(`${employeeSelect} WHERE e.tenant_id=? ORDER BY p.name, e.id`).all(tenantId) as EmployeeRow[]).map(employee);
    },
    async updateEmployee(tenantId, employeeId, active) {
      database.prepare('UPDATE institution_document_employees SET active=? WHERE tenant_id=? AND id=?')
        .run(Number(active), tenantId, employeeId);
      const row = database.prepare(`${employeeSelect} WHERE e.tenant_id=? AND e.id=?`).get(tenantId, employeeId) as EmployeeRow | undefined;
      return row ? employee(row) : null;
    },
    async deleteEmployee(tenantId, employeeId) {
      const assigned = database.prepare(`SELECT 1 FROM institution_document_profiles
        WHERE tenant_id=? AND (director_employee_id=? OR records_officer_employee_id=?)`).get(tenantId, employeeId, employeeId);
      if (assigned) return 'assigned';
      const result = database.prepare('DELETE FROM institution_document_employees WHERE tenant_id=? AND id=?').run(tenantId, employeeId);
      return result.changes ? 'deleted' : 'missing';
    },
    async assignPositions(tenantId, directorId, recordsOfficerId) {
      return atomic(database, () => {
        const valid = (id: string | null) => id === null || Boolean(database.prepare(`SELECT 1 FROM institution_document_employees
          WHERE tenant_id=? AND id=? AND active=1 AND administrative=1`).get(tenantId, id));
        if (!valid(directorId)) return 'invalid-director';
        if (!valid(recordsOfficerId)) return 'invalid-records';
        database.prepare(`INSERT INTO institution_document_profiles (tenant_id, director_employee_id, records_officer_employee_id)
          SELECT id, ?, ? FROM institution_tenants WHERE id=?
          ON CONFLICT(tenant_id) DO UPDATE SET director_employee_id=excluded.director_employee_id,
            records_officer_employee_id=excluded.records_officer_employee_id`).run(directorId, recordsOfficerId, tenantId);
        return 'updated';
      });
    },
    async saveEmployeeAsset(tenantId, employeeId, kind, image) {
      return atomic(database, () => {
        const designated = database.prepare(`SELECT id, active FROM institution_document_employees
          WHERE tenant_id=? AND id=? AND administrative=1`).get(tenantId, employeeId) as { id: string; active: number } | undefined;
        if (!designated) return 'missing-employee';
        if (designated.active !== 1) return 'inactive-employee';
        database.prepare(`INSERT INTO institution_document_employee_assets (tenant_id, employee_id, kind, media_type, bytes)
          VALUES (?, ?, ?, ?, ?) ON CONFLICT(tenant_id, employee_id, kind)
          DO UPDATE SET media_type=excluded.media_type, bytes=excluded.bytes`)
          .run(tenantId, designated.id, kind, image.mediaType, image.bytes);
        return 'saved';
      });
    },
    async getAsset(tenantId, _kind) {
      const row = database.prepare(`SELECT logo_media_type AS media_type, logo_bytes AS bytes FROM institution_document_profiles
        WHERE tenant_id=?`).get(tenantId) as { media_type: string | null; bytes: Uint8Array | null } | undefined;
      if (!row?.media_type || !row.bytes) return null;
      return { mediaType: row.media_type as InstitutionImage['mediaType'], bytes: new Uint8Array(row.bytes), filename: 'marca-institucional' };
    },
    async getEmployeeAsset(tenantId, employeeId, kind) {
      const row = database.prepare(`SELECT a.media_type, a.bytes FROM institution_document_employee_assets a
        WHERE a.tenant_id=? AND a.employee_id=? AND a.kind=?`).get(tenantId, employeeId, kind) as { media_type: string; bytes: Uint8Array } | undefined;
      if (!row) return null;
      return { mediaType: row.media_type as 'image/png', bytes: new Uint8Array(row.bytes), filename: kind === 'signature' ? 'assinatura-responsavel' : 'carimbo-institucional' };
    },
    async deleteAsset(tenantId, _kind) {
      const result = database.prepare(`UPDATE institution_document_profiles SET logo_media_type=NULL, logo_bytes=NULL
        WHERE tenant_id=? AND logo_bytes IS NOT NULL`).run(tenantId);
      return result.changes > 0;
    },
    async deleteEmployeeAsset(tenantId, employeeId, kind) {
      const result = database.prepare(`DELETE FROM institution_document_employee_assets
        WHERE tenant_id=? AND employee_id=? AND kind=?`).run(tenantId, employeeId, kind);
      return result.changes > 0;
    },
  };
}
