import type { DatabaseSync } from 'node:sqlite';
import type { AcademicStore, Assessment, Attendance, AttendanceStatus, Collaborator, Course, Enrollment, EnrollmentStatus, Grade, StudentCourseReference, Subject } from '../academic/index.ts';
import type { InstitutionEducationScopeItem } from '../institution/index.ts';

const scopeCode = (item: InstitutionEducationScopeItem): string => item.level === 'HIGHER'
  ? 'HIGHER_GRADUATION' : item.level === 'TECHNICAL' ? 'TECHNICAL_MIDDLE' : `BASIC_${item.stage}${item.modality === 'EJA' ? '_EJA' : ''}`;
const scope = (code: string): InstitutionEducationScopeItem => code === 'HIGHER_GRADUATION'
  ? { level: 'HIGHER', courseType: 'GRADUACAO' }
  : code === 'TECHNICAL_MIDDLE' ? { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' }
  : { level: 'BASIC', stage: code.includes('FUNDAMENTAL') ? 'FUNDAMENTAL' : 'MEDIO',
    ...(code.endsWith('_EJA') ? { modality: 'EJA' as const } : {}) };

export function createSqliteAcademicStore(database: DatabaseSync): AcademicStore {
  database.exec(`
    CREATE TABLE IF NOT EXISTS academic_courses (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
      code TEXT NOT NULL CHECK (code GLOB '[a-z0-9]*' AND length(code) BETWEEN 2 AND 100),
      scope_code TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL,
      UNIQUE (tenant_id, code),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, scope_code) REFERENCES institution_education_scope_items(tenant_id, scope_code)
    );
    CREATE TABLE IF NOT EXISTS academic_collaborators (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      person_id TEXT NOT NULL,
      active INTEGER NOT NULL CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL,
      UNIQUE (tenant_id, person_id),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, person_id) REFERENCES people_people(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_subjects (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      course_id TEXT NOT NULL,
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
      code TEXT NOT NULL CHECK (code GLOB '[a-z0-9]*' AND length(code) BETWEEN 2 AND 100),
      workload_hours INTEGER NOT NULL CHECK (workload_hours > 0),
      active INTEGER NOT NULL CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL,
      UNIQUE (course_id, code),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_subject_collaborators (
      tenant_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      collaborator_id TEXT NOT NULL,
      PRIMARY KEY (tenant_id, subject_id, collaborator_id),
      FOREIGN KEY (tenant_id, subject_id) REFERENCES academic_subjects(tenant_id, id),
      FOREIGN KEY (tenant_id, collaborator_id) REFERENCES academic_collaborators(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_student_profiles (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      person_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tenant_id, person_id),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, person_id) REFERENCES people_people(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_enrollments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      person_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      student_profile_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('ativa', 'trancada', 'cancelada', 'jubilada')),
      regulatory_acts_json TEXT NOT NULL DEFAULT '[]',
      regulatory_exception_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tenant_id, person_id, course_id),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, person_id) REFERENCES people_people(tenant_id, id),
      FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id),
      FOREIGN KEY (tenant_id, student_profile_id) REFERENCES academic_student_profiles(tenant_id, id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS academic_enrollments_tenant_id_unique
      ON academic_enrollments (tenant_id, id);
    CREATE TABLE IF NOT EXISTS academic_assessments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
      occurs_on TEXT NOT NULL CHECK (length(occurs_on) = 10),
      max_points REAL NOT NULL CHECK (max_points > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id),
      FOREIGN KEY (tenant_id, subject_id) REFERENCES academic_subjects(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_grades (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      enrollment_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      value REAL NOT NULL CHECK (value >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, enrollment_id, assessment_id),
      FOREIGN KEY (tenant_id, enrollment_id) REFERENCES academic_enrollments(tenant_id, id),
      FOREIGN KEY (tenant_id, assessment_id) REFERENCES academic_assessments(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS academic_attendance (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      enrollment_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      occurs_on TEXT NOT NULL CHECK (length(occurs_on) = 10),
      status TEXT NOT NULL CHECK (status IN ('presente', 'ausente')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, enrollment_id, subject_id, occurs_on),
      FOREIGN KEY (tenant_id, enrollment_id) REFERENCES academic_enrollments(tenant_id, id),
      FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id),
      FOREIGN KEY (tenant_id, subject_id) REFERENCES academic_subjects(tenant_id, id)
    );
  `);
  const enrollmentColumns = database.prepare('PRAGMA table_info(academic_enrollments)').all() as { name: string }[];
  if (!enrollmentColumns.some(column => column.name === 'regulatory_acts_json')) {
    database.exec(`ALTER TABLE academic_enrollments ADD COLUMN regulatory_acts_json TEXT NOT NULL DEFAULT '[]'`);
  }
  if (!enrollmentColumns.some(column => column.name === 'regulatory_exception_json')) {
    database.exec(`ALTER TABLE academic_enrollments ADD COLUMN regulatory_exception_json TEXT`);
  }
  return {
    async hasEducationScope(tenantId, educationScope) {
      return Boolean(database.prepare(`SELECT 1 FROM institution_education_scope_items
        WHERE tenant_id = ? AND scope_code = ?`).get(tenantId, scopeCode(educationScope)));
    },
    async createCourse(course: Course) {
      try {
        database.prepare(`INSERT INTO academic_courses (id, tenant_id, name, code, scope_code, active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`).run(course.id, course.tenantId, course.name, course.code,
          scopeCode(course.educationScope), Number(course.active), course.createdAt);
        return 'created';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_courses.tenant_id, academic_courses.code')) return 'conflict';
        throw error;
      }
    },
    async getCourse(tenantId, courseId) {
      const row = database.prepare(`SELECT id, tenant_id, name, code, scope_code, active, created_at FROM academic_courses
        WHERE tenant_id = ? AND id = ?`).get(tenantId, courseId) as { id: string; tenant_id: string; name: string; code: string; scope_code: string; active: number; created_at: string } | undefined;
      return row ? { id: row.id, tenantId: row.tenant_id, name: row.name, code: row.code, educationScope: scope(row.scope_code), active: Boolean(row.active), createdAt: row.created_at } : null;
    },
    async updateCourse(course) {
      const result = database.prepare(`UPDATE academic_courses SET name = ?, active = ? WHERE tenant_id = ? AND id = ?`)
        .run(course.name, Number(course.active), course.tenantId, course.id);
      return result.changes ? 'updated' : 'missing';
    },
    async listCourses(tenantId, educationScope) {
      const rows = database.prepare(`SELECT id, tenant_id, name, code, scope_code, active, created_at FROM academic_courses
        WHERE tenant_id = ?${educationScope ? ' AND scope_code = ?' : ''} ORDER BY code`)
        .all(...(educationScope ? [tenantId, scopeCode(educationScope)] : [tenantId])) as unknown as {
          id: string; tenant_id: string; name: string; code: string; scope_code: string; active: number; created_at: string;
        }[];
      return rows.map(row => ({ id: row.id, tenantId: row.tenant_id, name: row.name, code: row.code,
        educationScope: scope(row.scope_code), active: Boolean(row.active), createdAt: row.created_at }));
    },
    async createCollaborator(value: Collaborator) {
      try {
        database.prepare(`INSERT INTO academic_collaborators (id, tenant_id, person_id, active, created_at)
          VALUES (?, ?, ?, ?, ?)`).run(value.id, value.tenantId, value.personId, Number(value.active), value.createdAt);
        return 'created';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_collaborators.tenant_id, academic_collaborators.person_id')) return 'conflict';
        throw error;
      }
    },
    async listCollaborators(tenantId) {
      const rows = database.prepare(`SELECT c.id, c.tenant_id, c.person_id, p.name, c.active, c.created_at
        FROM academic_collaborators c JOIN people_people p ON p.tenant_id = c.tenant_id AND p.id = c.person_id
        WHERE c.tenant_id = ? ORDER BY p.name`).all(tenantId) as unknown as { id: string; tenant_id: string; person_id: string; name: string; active: number; created_at: string }[];
      return rows.map(row => ({ id: row.id, tenantId: row.tenant_id, personId: row.person_id,
        personName: row.name, active: Boolean(row.active), createdAt: row.created_at }));
    },
    async updateCollaborator(tenantId, collaboratorId, active) {
      database.prepare(`UPDATE academic_collaborators SET active = ? WHERE tenant_id = ? AND id = ?`)
        .run(Number(active), tenantId, collaboratorId);
      const row = database.prepare(`SELECT c.id, c.tenant_id, c.person_id, p.name, c.active, c.created_at
        FROM academic_collaborators c JOIN people_people p ON p.tenant_id = c.tenant_id AND p.id = c.person_id
        WHERE c.tenant_id = ? AND c.id = ?`).get(tenantId, collaboratorId) as { id: string; tenant_id: string; person_id: string; name: string; active: number; created_at: string } | undefined;
      return row ? { id: row.id, tenantId: row.tenant_id, personId: row.person_id,
        personName: row.name, active: Boolean(row.active), createdAt: row.created_at } : null;
    },
    async createSubject(subject) {
      database.exec('BEGIN IMMEDIATE');
      try {
        database.prepare(`INSERT INTO academic_subjects (id, tenant_id, course_id, name, code, workload_hours, active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(subject.id, subject.tenantId, subject.courseId, subject.name,
          subject.code, subject.workloadHours, Number(subject.active), subject.createdAt);
        const insert = database.prepare(`INSERT INTO academic_subject_collaborators (tenant_id, subject_id, collaborator_id) VALUES (?, ?, ?)`);
        for (const id of subject.collaboratorIds) insert.run(subject.tenantId, subject.id, id);
        database.exec('COMMIT');
        return 'created';
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve original failure. */ }
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_subjects.course_id, academic_subjects.code')) return 'conflict';
        throw error;
      }
    },
    async listSubjects(tenantId, courseId) {
      const rows = database.prepare(`SELECT id, tenant_id, course_id, name, code, workload_hours, active, created_at
        FROM academic_subjects WHERE tenant_id = ? AND course_id = ? ORDER BY code`).all(tenantId, courseId) as unknown as {
          id: string; tenant_id: string; course_id: string; name: string; code: string; workload_hours: number; active: number; created_at: string;
        }[];
      return rows.map(row => ({ id: row.id, tenantId: row.tenant_id, courseId: row.course_id, name: row.name,
        code: row.code, workloadHours: row.workload_hours, active: Boolean(row.active), createdAt: row.created_at,
        collaboratorIds: database.prepare(`SELECT collaborator_id FROM academic_subject_collaborators
          WHERE tenant_id = ? AND subject_id = ? ORDER BY collaborator_id`).all(tenantId, row.id)
          .map(value => (value as { collaborator_id: string }).collaborator_id) }));
    },
    async updateSubject(subject) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const result = database.prepare(`UPDATE academic_subjects SET name = ?, workload_hours = ?, active = ?
          WHERE tenant_id = ? AND course_id = ? AND id = ?`).run(subject.name, subject.workloadHours,
          Number(subject.active), subject.tenantId, subject.courseId, subject.id);
        if (!result.changes) { database.exec('ROLLBACK'); return 'missing'; }
        database.prepare(`DELETE FROM academic_subject_collaborators WHERE tenant_id = ? AND subject_id = ?`)
          .run(subject.tenantId, subject.id);
        const insert = database.prepare(`INSERT INTO academic_subject_collaborators (tenant_id, subject_id, collaborator_id) VALUES (?, ?, ?)`);
        for (const id of subject.collaboratorIds) insert.run(subject.tenantId, subject.id, id);
        database.exec('COMMIT');
        return 'updated';
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve original failure. */ }
        throw error;
      }
    },
    async listCollaboratorsByIds(tenantId, collaboratorIds) {
      if (!collaboratorIds.length) return [];
      const placeholders = collaboratorIds.map(() => '?').join(',');
      const rows = database.prepare(`SELECT c.id,c.tenant_id,c.person_id,p.name,c.active,c.created_at
        FROM academic_collaborators c JOIN people_people p ON p.tenant_id=c.tenant_id AND p.id=c.person_id
        WHERE c.tenant_id = ? AND c.id IN (${placeholders})`).all(tenantId, ...collaboratorIds) as unknown as {
          id: string; tenant_id: string; person_id: string; name: string; active: number; created_at: string;
        }[];
      return rows.map(row => ({ id: row.id, tenantId: row.tenant_id, personId: row.person_id, personName: row.name,
        active: Boolean(row.active), createdAt: row.created_at }));
    },
    async createEnrollment(value, newStudentProfileId) {
      database.exec('BEGIN IMMEDIATE');
      try {
        let profile = database.prepare(`SELECT id FROM academic_student_profiles WHERE tenant_id = ? AND person_id = ?`)
          .get(value.tenantId, value.personId) as { id: string } | undefined;
        if (!profile) {
          database.prepare(`INSERT INTO academic_student_profiles (id, tenant_id, person_id, created_at) VALUES (?, ?, ?, ?)`)
            .run(newStudentProfileId, value.tenantId, value.personId, value.createdAt);
          profile = { id: newStudentProfileId };
        }
        database.prepare(`INSERT INTO academic_enrollments
          (id, tenant_id, person_id, course_id, student_profile_id, status, regulatory_acts_json, regulatory_exception_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(value.id, value.tenantId, value.personId, value.courseId,
          profile.id, value.status, JSON.stringify(value.regulatoryActs ?? []),
          value.regulatoryException ? JSON.stringify(value.regulatoryException) : null, value.createdAt, value.updatedAt);
        database.exec('COMMIT');
        return { ...value, studentProfileId: profile.id };
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve original failure. */ }
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_enrollments.tenant_id, academic_enrollments.person_id, academic_enrollments.course_id')) return 'conflict';
        throw error;
      }
    },
    async listEnrollments(tenantId, courseId, status) {
      const rows = database.prepare(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,e.student_profile_id,e.status,e.regulatory_acts_json,e.regulatory_exception_json,e.created_at,e.updated_at
        FROM academic_enrollments e JOIN people_people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id = ? AND e.course_id = ?${status ? ' AND e.status = ?' : ''} ORDER BY p.name`)
        .all(...(status ? [tenantId, courseId, status] : [tenantId, courseId])) as unknown as EnrollmentRow[];
      return rows.map(enrollmentRow);
    },
    async listStudentCourses(tenantId, personIds): Promise<readonly StudentCourseReference[]> {
      if (!personIds.length) return [];
      const rows = database.prepare(`SELECT e.person_id,e.course_id,c.name AS course_name,c.code AS course_code,e.status
        FROM academic_enrollments e JOIN academic_courses c ON c.tenant_id=e.tenant_id AND c.id=e.course_id
        WHERE e.tenant_id = ? AND e.person_id IN (${personIds.map(() => '?').join(',')}) ORDER BY c.code,e.person_id`)
        .all(tenantId, ...personIds) as unknown as { person_id: string; course_id: string; course_name: string;
          course_code: string; status: EnrollmentStatus }[];
      return rows.map(row => ({ personId: row.person_id, courseId: row.course_id, courseName: row.course_name,
        courseCode: row.course_code, status: row.status }));
    },
    async getEnrollment(tenantId, courseId, enrollmentId) {
      const row = database.prepare(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,e.student_profile_id,e.status,e.regulatory_acts_json,e.regulatory_exception_json,e.created_at,e.updated_at
        FROM academic_enrollments e JOIN people_people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id = ? AND e.course_id = ? AND e.id = ?`).get(tenantId, courseId, enrollmentId) as EnrollmentRow | undefined;
      return row ? enrollmentRow(row) : null;
    },
    async updateEnrollment(value: Enrollment) {
      const result = database.prepare(`UPDATE academic_enrollments SET status = ?, updated_at = ? WHERE tenant_id = ? AND course_id = ? AND id = ?`)
        .run(value.status, value.updatedAt, value.tenantId, value.courseId, value.id);
      if (!result.changes) return null;
      const row = database.prepare(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,e.student_profile_id,e.status,e.regulatory_acts_json,e.regulatory_exception_json,e.created_at,e.updated_at
        FROM academic_enrollments e JOIN people_people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id = ? AND e.course_id = ? AND e.id = ?`).get(value.tenantId, value.courseId, value.id) as EnrollmentRow | undefined;
      return row ? enrollmentRow(row) : null;
    },
    async createAssessment(value: Assessment) {
      database.prepare(`INSERT INTO academic_assessments
        (id,tenant_id,course_id,subject_id,title,occurs_on,max_points,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(value.id, value.tenantId, value.courseId, value.subjectId, value.title,
        value.occursOn, value.maxPoints, value.createdAt, value.updatedAt);
      return 'created';
    },
    async listAssessments(tenantId, courseId, subjectId) {
      const rows = database.prepare(`SELECT id,tenant_id,course_id,subject_id,title,occurs_on,max_points,created_at,updated_at
        FROM academic_assessments WHERE tenant_id=? AND course_id=? AND subject_id=? ORDER BY occurs_on,title,id`)
        .all(tenantId, courseId, subjectId) as unknown as AssessmentRow[];
      return rows.map(assessmentRow);
    },
    async getAssessment(tenantId, assessmentId) {
      const row = database.prepare(`SELECT id,tenant_id,course_id,subject_id,title,occurs_on,max_points,created_at,updated_at
        FROM academic_assessments WHERE tenant_id=? AND id=?`).get(tenantId, assessmentId) as AssessmentRow | undefined;
      return row ? assessmentRow(row) : null;
    },
    async updateAssessment(value) {
      const result = database.prepare(`UPDATE academic_assessments SET title=?,occurs_on=?,max_points=?,updated_at=?
        WHERE tenant_id=? AND id=?`).run(value.title, value.occursOn, value.maxPoints, value.updatedAt, value.tenantId, value.id);
      return result.changes ? 'updated' : 'missing';
    },
    async deleteAssessment(tenantId, assessmentId) {
      const exists = database.prepare(`SELECT id FROM academic_assessments WHERE tenant_id=? AND id=?`).get(tenantId, assessmentId);
      if (!exists) return 'missing';
      if (database.prepare(`SELECT 1 FROM academic_grades WHERE tenant_id=? AND assessment_id=? LIMIT 1`).get(tenantId, assessmentId)) return 'has-grades';
      database.prepare(`DELETE FROM academic_assessments WHERE tenant_id=? AND id=?`).run(tenantId, assessmentId);
      return 'deleted';
    },
    async createGrade(value: Grade) {
      try {
        database.prepare(`INSERT INTO academic_grades (id,tenant_id,enrollment_id,assessment_id,value,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?)`).run(value.id, value.tenantId, value.enrollmentId, value.assessmentId,
          value.value, value.createdAt, value.updatedAt);
        return 'created';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_grades.tenant_id, academic_grades.enrollment_id, academic_grades.assessment_id')) return 'conflict';
        throw error;
      }
    },
    async listGrades(tenantId, filter) {
      const clauses = ['tenant_id=?']; const params: string[] = [tenantId];
      if (filter.enrollmentId) { clauses.push('enrollment_id=?'); params.push(filter.enrollmentId); }
      if (filter.assessmentId) { clauses.push('assessment_id=?'); params.push(filter.assessmentId); }
      const rows = database.prepare(`SELECT id,tenant_id,enrollment_id,assessment_id,value,created_at,updated_at FROM academic_grades
        WHERE ${clauses.join(' AND ')} ORDER BY created_at,id`).all(...params) as unknown as GradeRow[];
      return rows.map(gradeRow);
    },
    async getGrade(tenantId, gradeId) {
      const row = database.prepare(`SELECT id,tenant_id,enrollment_id,assessment_id,value,created_at,updated_at
        FROM academic_grades WHERE tenant_id=? AND id=?`).get(tenantId, gradeId) as GradeRow | undefined;
      return row ? gradeRow(row) : null;
    },
    async updateGrade(value) {
      const result = database.prepare(`UPDATE academic_grades SET value=?,updated_at=? WHERE tenant_id=? AND id=?`)
        .run(value.value, value.updatedAt, value.tenantId, value.id);
      return result.changes ? 'updated' : 'missing';
    },
    async deleteGrade(tenantId, gradeId) {
      return database.prepare(`DELETE FROM academic_grades WHERE tenant_id=? AND id=?`).run(tenantId, gradeId).changes > 0;
    },
    async createAttendance(value) {
      try {
        database.prepare(`INSERT INTO academic_attendance
          (id,tenant_id,enrollment_id,course_id,subject_id,occurs_on,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
          .run(value.id, value.tenantId, value.enrollmentId, value.courseId, value.subjectId, value.occursOn,
            value.status, value.createdAt, value.updatedAt);
        return 'created';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_attendance.tenant_id, academic_attendance.enrollment_id, academic_attendance.subject_id, academic_attendance.occurs_on')) return 'conflict';
        throw error;
      }
    },
    async listAttendance(tenantId, filter) {
      const clauses = ['tenant_id=?']; const params: string[] = [tenantId];
      if (filter.enrollmentId) { clauses.push('enrollment_id=?'); params.push(filter.enrollmentId); }
      if (filter.subjectId) { clauses.push('subject_id=?'); params.push(filter.subjectId); }
      const rows = database.prepare(`SELECT id,tenant_id,course_id,enrollment_id,subject_id,occurs_on,status,created_at,updated_at
        FROM academic_attendance WHERE ${clauses.join(' AND ')} ORDER BY occurs_on,id`).all(...params) as unknown as AttendanceRow[];
      return rows.map(attendanceRow);
    },
    async getAttendance(tenantId, attendanceId) {
      const row = database.prepare(`SELECT id,tenant_id,course_id,enrollment_id,subject_id,occurs_on,status,created_at,updated_at
        FROM academic_attendance WHERE tenant_id=? AND id=?`).get(tenantId, attendanceId) as AttendanceRow | undefined;
      return row ? attendanceRow(row) : null;
    },
    async updateAttendance(value) {
      try {
        const result = database.prepare(`UPDATE academic_attendance SET occurs_on=?,status=?,updated_at=? WHERE tenant_id=? AND id=?`)
          .run(value.occursOn, value.status, value.updatedAt, value.tenantId, value.id);
        return result.changes ? 'updated' : 'missing';
      } catch (error) {
        if ((error as { code?: string }).code === 'ERR_SQLITE_ERROR' && String(error).includes('UNIQUE constraint failed: academic_attendance.tenant_id, academic_attendance.enrollment_id, academic_attendance.subject_id, academic_attendance.occurs_on')) return 'conflict';
        throw error;
      }
    },
    async deleteAttendance(tenantId, attendanceId) {
      return database.prepare(`DELETE FROM academic_attendance WHERE tenant_id=? AND id=?`).run(tenantId, attendanceId).changes > 0;
    },
  };
}

interface EnrollmentRow { id: string; tenant_id: string; person_id: string; person_name: string; course_id: string;
  student_profile_id: string; status: EnrollmentStatus; regulatory_acts_json: string; regulatory_exception_json: string | null;
  created_at: string; updated_at: string }

function enrollmentRow(row: EnrollmentRow): Enrollment {
  return { id: row.id, tenantId: row.tenant_id, personId: row.person_id, personName: row.person_name,
    courseId: row.course_id, studentProfileId: row.student_profile_id, status: row.status,
    regulatoryActs: JSON.parse(row.regulatory_acts_json) as NonNullable<Enrollment['regulatoryActs']>,
    ...(row.regulatory_exception_json ? { regulatoryException: JSON.parse(row.regulatory_exception_json) as NonNullable<Enrollment['regulatoryException']> } : {}),
    createdAt: row.created_at, updatedAt: row.updated_at };
}

interface AssessmentRow { id: string; tenant_id: string; course_id: string; subject_id: string; title: string; occurs_on: string;
  max_points: number; created_at: string; updated_at: string }

function assessmentRow(row: AssessmentRow): Assessment {
  return { id: row.id, tenantId: row.tenant_id, courseId: row.course_id, subjectId: row.subject_id,
    title: row.title, occursOn: row.occurs_on, maxPoints: row.max_points, createdAt: row.created_at, updatedAt: row.updated_at };
}

interface GradeRow { id: string; tenant_id: string; enrollment_id: string; assessment_id: string; value: number; created_at: string; updated_at: string }
function gradeRow(row: GradeRow): Grade {
  return { id: row.id, tenantId: row.tenant_id, enrollmentId: row.enrollment_id, assessmentId: row.assessment_id,
    value: row.value, createdAt: row.created_at, updatedAt: row.updated_at };
}

interface AttendanceRow { id: string; tenant_id: string; course_id: string; enrollment_id: string; subject_id: string;
  occurs_on: string; status: AttendanceStatus; created_at: string; updated_at: string }
function attendanceRow(row: AttendanceRow): Attendance {
  return { id: row.id, tenantId: row.tenant_id, courseId: row.course_id, enrollmentId: row.enrollment_id,
    subjectId: row.subject_id, occursOn: row.occurs_on, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
