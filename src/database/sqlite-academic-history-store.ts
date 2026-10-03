import type { DatabaseSync } from 'node:sqlite';
import type { AcademicHistory, AcademicHistoryStore } from '../academic/history.ts';

function map(row: Record<string, unknown>): AcademicHistory {
  return { id: String(row.id), tenantId: String(row.tenant_id), studentId: String(row.student_id), studentName: String(row.student_name),
    sourceInstitution: String(row.source_institution), courseName: String(row.course_name), academicYear: Number(row.academic_year),
    period: String(row.period), subjectName: String(row.subject_name), workloadHours: Number(row.workload_hours),
    gradeOrConcept: row.grade_or_concept === null ? null : String(row.grade_or_concept),
    absenceCount: row.absence_count === null ? null : Number(row.absence_count), result: String(row.result),
    notes: row.notes === null ? null : String(row.notes), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

export function createSqliteAcademicHistoryStore(database: DatabaseSync): AcademicHistoryStore {
  database.exec(`CREATE TABLE IF NOT EXISTS academic_history_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    source_institution TEXT NOT NULL CHECK (length(trim(source_institution)) BETWEEN 1 AND 200),
    course_name TEXT NOT NULL CHECK (length(trim(course_name)) BETWEEN 1 AND 200),
    academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 1 AND 9999),
    period TEXT NOT NULL CHECK (length(trim(period)) BETWEEN 1 AND 80),
    subject_name TEXT NOT NULL CHECK (length(trim(subject_name)) BETWEEN 1 AND 200),
    workload_hours INTEGER NOT NULL CHECK (workload_hours > 0),
    grade_or_concept TEXT CHECK (grade_or_concept IS NULL OR length(grade_or_concept) <= 40),
    absence_count INTEGER CHECK (absence_count IS NULL OR absence_count >= 0),
    result TEXT NOT NULL CHECK (length(trim(result)) BETWEEN 1 AND 200),
    notes TEXT CHECK (notes IS NULL OR length(notes) <= 2000),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (tenant_id, id),
    FOREIGN KEY (tenant_id, student_id) REFERENCES people_people(tenant_id, id)
  );
  CREATE INDEX IF NOT EXISTS academic_history_student_period ON academic_history_records(tenant_id, student_id, academic_year, period);`);
  return {
    async create(value) {
      database.prepare(`INSERT INTO academic_history_records (id, tenant_id, student_id, student_name, source_institution, course_name,
        academic_year, period, subject_name, workload_hours, grade_or_concept, absence_count, result, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(value.id, value.tenantId, value.studentId, value.studentName,
        value.sourceInstitution, value.courseName, value.academicYear, value.period, value.subjectName, value.workloadHours,
        value.gradeOrConcept, value.absenceCount, value.result, value.notes, value.createdAt, value.updatedAt);
      return 'created';
    },
    async list(tenantId, studentId) {
      const rows = database.prepare(`SELECT id, tenant_id, student_id, student_name, source_institution, course_name, academic_year,
        period, subject_name, workload_hours, grade_or_concept, absence_count, result, notes, created_at, updated_at
        FROM academic_history_records WHERE tenant_id = ?${studentId ? ' AND student_id = ?' : ''}
        ORDER BY academic_year DESC, period, subject_name, id`).all(...(studentId ? [tenantId, studentId] : [tenantId])) as Record<string, unknown>[];
      return rows.map(map);
    },
    async get(tenantId, id) {
      const row = database.prepare(`SELECT id, tenant_id, student_id, student_name, source_institution, course_name, academic_year,
        period, subject_name, workload_hours, grade_or_concept, absence_count, result, notes, created_at, updated_at
        FROM academic_history_records WHERE tenant_id = ? AND id = ?`).get(tenantId, id) as Record<string, unknown> | undefined;
      return row ? map(row) : null;
    },
    async update(value) {
      const result = database.prepare(`UPDATE academic_history_records SET student_id = ?, student_name = ?, source_institution = ?,
        course_name = ?, academic_year = ?, period = ?, subject_name = ?, workload_hours = ?, grade_or_concept = ?, absence_count = ?,
        result = ?, notes = ?, updated_at = ? WHERE tenant_id = ? AND id = ?`).run(value.studentId, value.studentName,
        value.sourceInstitution, value.courseName, value.academicYear, value.period, value.subjectName, value.workloadHours,
        value.gradeOrConcept, value.absenceCount, value.result, value.notes, value.updatedAt, value.tenantId, value.id);
      return Number(result.changes) ? 'updated' : 'missing';
    },
    async delete(tenantId, id) {
      return Number(database.prepare('DELETE FROM academic_history_records WHERE tenant_id = ? AND id = ?').run(tenantId, id).changes) > 0;
    },
  };
}
