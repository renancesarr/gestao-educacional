import type { DatabaseSync } from 'node:sqlite';
import type { Credential, CredentialStore } from '../credential/index.ts';
import type { InstitutionOperationContext } from '../institution/index.ts';

function map(row: Record<string, unknown>): Credential {
  return { id: String(row.id), tenantId: String(row.tenant_id), studentId: String(row.student_id), courseId: String(row.course_id),
    type: row.type as Credential['type'], issuedOn: String(row.issued_on), holderName: String(row.holder_name),
    courseName: String(row.course_name), institutionName: String(row.institution_name), contentHash: String(row.content_hash),
    validationToken: String(row.validation_token), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

export function createSqliteCredentialStore(database: DatabaseSync): CredentialStore & {
  getCourseForCredential(context: InstitutionOperationContext, courseId: string): Promise<{ id: string; tenantId: string; name: string; institutionName: string }>;
} {
  database.exec(`CREATE TABLE IF NOT EXISTS academic_credentials (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('certificado', 'diploma')),
    issued_on TEXT NOT NULL CHECK (length(issued_on) = 10),
    holder_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    validation_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, student_id) REFERENCES people_people(tenant_id, id),
    FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id)
  );
  CREATE INDEX IF NOT EXISTS academic_credentials_student ON academic_credentials(tenant_id, student_id, issued_on);`);
  const columns = `id, tenant_id, student_id, course_id, type, issued_on, holder_name, course_name, institution_name,
    content_hash, validation_token, created_at, updated_at`;
  const insert = database.prepare(`INSERT INTO academic_credentials (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  return {
    async create(value) {
      try { insert.run(value.id, value.tenantId, value.studentId, value.courseId, value.type, value.issuedOn, value.holderName,
        value.courseName, value.institutionName, value.contentHash, value.validationToken, value.createdAt, value.updatedAt); return 'created'; }
      catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_CONSTRAINT_UNIQUE') return 'conflict';
        throw error;
      }
    },
    async list(tenantId) {
      return (database.prepare(`SELECT ${columns} FROM academic_credentials WHERE tenant_id = ? ORDER BY issued_on DESC, id`).all(tenantId) as Record<string, unknown>[]).map(map);
    },
    async get(tenantId, id) {
      const row = database.prepare(`SELECT ${columns} FROM academic_credentials WHERE tenant_id = ? AND id = ?`).get(tenantId, id) as Record<string, unknown> | undefined;
      return row ? map(row) : null;
    },
    async update(value) {
      try {
        const result = database.prepare(`UPDATE academic_credentials SET type = ?, issued_on = ?, content_hash = ?, validation_token = ?, updated_at = ?
          WHERE tenant_id = ? AND id = ?`).run(value.type, value.issuedOn, value.contentHash, value.validationToken, value.updatedAt, value.tenantId, value.id);
        return Number(result.changes) ? 'updated' : 'missing';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_CONSTRAINT_UNIQUE') return 'missing';
        throw error;
      }
    },
    async delete(tenantId, id) {
      return Number(database.prepare('DELETE FROM academic_credentials WHERE tenant_id = ? AND id = ?').run(tenantId, id).changes) > 0;
    },
    async findByToken(token) {
      const row = database.prepare(`SELECT ${columns} FROM academic_credentials WHERE validation_token = ?`).get(token) as Record<string, unknown> | undefined;
      return row ? map(row) : null;
    },
    async getCourseForCredential(context, courseId) {
      const row = database.prepare(`SELECT c.id, c.tenant_id, c.name, t.name AS institution_name FROM academic_courses c
        JOIN institution_tenants t ON t.id = c.tenant_id WHERE c.tenant_id = ? AND c.id = ?`).get(context.tenantId, courseId) as
        { id: string; tenant_id: string; name: string; institution_name: string } | undefined;
      if (!row) throw Object.assign(new Error('Curso não encontrado.'), { code: 'NOT_FOUND' });
      return { id: row.id, tenantId: row.tenant_id, name: row.name, institutionName: row.institution_name };
    },
  };
}
