import type { Pool } from 'pg';
import type { AcademicStore, Collaborator, Course, Enrollment, EnrollmentStatus, StudentCourseReference, Subject } from '../academic/index.ts';
import type { InstitutionEducationScopeItem } from '../institution/index.ts';

const scopeCode = (item: InstitutionEducationScopeItem) => item.level === 'HIGHER'
  ? 'HIGHER_GRADUATION' : item.level === 'TECHNICAL' ? 'TECHNICAL_MIDDLE' : `BASIC_${item.stage}${item.modality === 'EJA' ? '_EJA' : ''}`;
const scope = (code: string): InstitutionEducationScopeItem => code === 'HIGHER_GRADUATION'
  ? { level: 'HIGHER', courseType: 'GRADUACAO' }
  : code === 'TECHNICAL_MIDDLE' ? { level: 'TECHNICAL', courseType: 'TECNICO_NIVEL_MEDIO' }
  : { level: 'BASIC', stage: code.includes('FUNDAMENTAL') ? 'FUNDAMENTAL' : 'MEDIO',
    ...(code.endsWith('_EJA') ? { modality: 'EJA' as const } : {}) };

export function postgresAcademicStore(pool: Pool): AcademicStore {
  return {
    async hasEducationScope(tenantId, educationScope) {
      return Boolean((await pool.query('SELECT 1 FROM institution.education_scope_items WHERE tenant_id=$1 AND scope_code=$2',
        [tenantId, scopeCode(educationScope)])).rows[0]);
    },
    async createCourse(course: Course) {
      try {
        await pool.query(`INSERT INTO academic.courses(id,tenant_id,name,code,scope_code,active,created_at)
          VALUES($1,$2,$3,$4,$5,$6,$7)`, [course.id, course.tenantId, course.name, course.code,
          scopeCode(course.educationScope), course.active, course.createdAt]);
        return 'created';
      } catch (error) {
        const pg = error as { code?: string; constraint?: string };
        if (pg.code === '23505' && pg.constraint === 'courses_tenant_id_code_key') return 'conflict';
        throw error;
      }
    },
    async getCourse(tenantId, courseId) {
      const result = await pool.query<{ id: string; tenant_id: string; name: string; code: string; scope_code: string; active: boolean; created_at: Date }>(
        `SELECT id,tenant_id,name,code,scope_code,active,created_at FROM academic.courses WHERE tenant_id=$1 AND id=$2`, [tenantId, courseId]);
      const row = result.rows[0];
      return row ? { id: row.id, tenantId: row.tenant_id, name: row.name, code: row.code, educationScope: scope(row.scope_code), active: row.active, createdAt: row.created_at.toISOString() } : null;
    },
    async updateCourse(course) {
      const result = await pool.query(`UPDATE academic.courses SET name=$1, active=$2 WHERE tenant_id=$3 AND id=$4`,
        [course.name, course.active, course.tenantId, course.id]);
      return result.rowCount ? 'updated' : 'missing';
    },
    async listCourses(tenantId, educationScope) {
      const result = await pool.query<{ id: string; tenant_id: string; name: string; code: string; scope_code: string; active: boolean; created_at: Date }>(
        `SELECT id,tenant_id,name,code,scope_code,active,created_at FROM academic.courses
         WHERE tenant_id=$1${educationScope ? ' AND scope_code=$2' : ''} ORDER BY code`,
        educationScope ? [tenantId, scopeCode(educationScope)] : [tenantId]);
      return result.rows.map(row => ({ id: row.id, tenantId: row.tenant_id, name: row.name, code: row.code,
        educationScope: scope(row.scope_code), active: row.active, createdAt: row.created_at.toISOString() }));
    },
    async createCollaborator(value: Collaborator) {
      try {
        await pool.query(`INSERT INTO academic.collaborators(id,tenant_id,person_id,active,created_at)
          VALUES($1,$2,$3,$4,$5)`, [value.id, value.tenantId, value.personId, value.active, value.createdAt]);
        return 'created';
      } catch (error) {
        const pg = error as { code?: string; constraint?: string };
        if (pg.code === '23505' && pg.constraint === 'collaborators_tenant_id_person_id_key') return 'conflict';
        throw error;
      }
    },
    async listCollaborators(tenantId) {
      const result = await pool.query<{ id: string; tenant_id: string; person_id: string; name: string; active: boolean; created_at: Date }>(
        `SELECT c.id,c.tenant_id,c.person_id,p.name,c.active,c.created_at FROM academic.collaborators c
         JOIN people.people p ON p.tenant_id=c.tenant_id AND p.id=c.person_id WHERE c.tenant_id=$1 ORDER BY p.name`, [tenantId]);
      return result.rows.map(row => ({ id: row.id, tenantId: row.tenant_id, personId: row.person_id,
        personName: row.name, active: row.active, createdAt: row.created_at.toISOString() }));
    },
    async updateCollaborator(tenantId, collaboratorId, active) {
      const result = await pool.query<{ id: string; tenant_id: string; person_id: string; name: string; active: boolean; created_at: Date }>(
        `UPDATE academic.collaborators SET active=$1 WHERE tenant_id=$2 AND id=$3
         RETURNING id,tenant_id,person_id,active,created_at`, [active, tenantId, collaboratorId]);
      const row = result.rows[0];
      if (!row) return null;
      const person = await pool.query<{ name: string }>(`SELECT name FROM people.people WHERE tenant_id=$1 AND id=$2`, [tenantId, row.person_id]);
      return { id: row.id, tenantId: row.tenant_id, personId: row.person_id, personName: person.rows[0]?.name ?? '',
        active: row.active, createdAt: row.created_at.toISOString() };
    },
    async createSubject(subject: Subject) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO academic.subjects(id,tenant_id,course_id,name,code,workload_hours,active,created_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [subject.id, subject.tenantId, subject.courseId, subject.name,
          subject.code, subject.workloadHours, subject.active, subject.createdAt]);
        for (const collaboratorId of subject.collaboratorIds) {
          await client.query(`INSERT INTO academic.subject_collaborators(tenant_id,subject_id,collaborator_id) VALUES($1,$2,$3)`,
            [subject.tenantId, subject.id, collaboratorId]);
        }
        await client.query('COMMIT');
        return 'created';
      } catch (error) {
        await client.query('ROLLBACK');
        const pg = error as { code?: string; constraint?: string };
        if (pg.code === '23505' && pg.constraint === 'subjects_course_id_code_key') return 'conflict';
        throw error;
      } finally { client.release(); }
    },
    async listSubjects(tenantId, courseId) {
      const result = await pool.query<{ id: string; tenant_id: string; course_id: string; name: string; code: string; workload_hours: number; active: boolean; created_at: Date }>(
        `SELECT id,tenant_id,course_id,name,code,workload_hours,active,created_at FROM academic.subjects
         WHERE tenant_id=$1 AND course_id=$2 ORDER BY code`, [tenantId, courseId]);
      const subjects: Subject[] = [];
      for (const row of result.rows) {
        const links = await pool.query<{ collaborator_id: string }>(`SELECT collaborator_id FROM academic.subject_collaborators
          WHERE tenant_id=$1 AND subject_id=$2 ORDER BY collaborator_id`, [tenantId, row.id]);
        subjects.push({ id: row.id, tenantId: row.tenant_id, courseId: row.course_id, name: row.name, code: row.code,
          workloadHours: row.workload_hours, active: row.active, createdAt: row.created_at.toISOString(),
          collaboratorIds: links.rows.map(link => link.collaborator_id) });
      }
      return subjects;
    },
    async updateSubject(subject: Subject) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query(`UPDATE academic.subjects SET name=$1,workload_hours=$2,active=$3
          WHERE tenant_id=$4 AND course_id=$5 AND id=$6`, [subject.name, subject.workloadHours, subject.active,
          subject.tenantId, subject.courseId, subject.id]);
        if (!result.rowCount) { await client.query('ROLLBACK'); return 'missing'; }
        await client.query(`DELETE FROM academic.subject_collaborators WHERE tenant_id=$1 AND subject_id=$2`, [subject.tenantId, subject.id]);
        for (const collaboratorId of subject.collaboratorIds) {
          await client.query(`INSERT INTO academic.subject_collaborators(tenant_id,subject_id,collaborator_id) VALUES($1,$2,$3)`,
            [subject.tenantId, subject.id, collaboratorId]);
        }
        await client.query('COMMIT');
        return 'updated';
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    async listCollaboratorsByIds(tenantId, collaboratorIds) {
      if (!collaboratorIds.length) return [];
      const result = await pool.query<{ id: string; tenant_id: string; person_id: string; person_name: string; active: boolean; created_at: Date }>(
        `SELECT c.id,c.tenant_id,c.person_id,p.name AS person_name,c.active,c.created_at FROM academic.collaborators c
         JOIN people.people p ON p.tenant_id=c.tenant_id AND p.id=c.person_id
         WHERE c.tenant_id=$1 AND c.id=ANY($2::uuid[])`, [tenantId, collaboratorIds]);
      return result.rows.map(row => ({ id: row.id, tenantId: row.tenant_id, personId: row.person_id,
        personName: row.person_name, active: row.active, createdAt: row.created_at.toISOString() }));
    },
    async createEnrollment(value, newStudentProfileId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO academic.student_profiles(id,tenant_id,person_id,created_at)
          VALUES($1,$2,$3,$4) ON CONFLICT (tenant_id,person_id) DO NOTHING`,
          [newStudentProfileId, value.tenantId, value.personId, value.createdAt]);
        const profile = await client.query<{ id: string }>(`SELECT id FROM academic.student_profiles WHERE tenant_id=$1 AND person_id=$2`,
          [value.tenantId, value.personId]);
        await client.query(`INSERT INTO academic.enrollments(id,tenant_id,person_id,course_id,student_profile_id,status,created_at,updated_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [value.id, value.tenantId, value.personId, value.courseId,
          profile.rows[0]!.id, value.status, value.createdAt, value.updatedAt]);
        await client.query('COMMIT');
        return { ...value, studentProfileId: profile.rows[0]!.id };
      } catch (error) {
        await client.query('ROLLBACK');
        const pg = error as { code?: string; constraint?: string };
        if (pg.code === '23505' && pg.constraint === 'enrollments_tenant_id_person_id_course_id_key') return 'conflict';
        throw error;
      } finally { client.release(); }
    },
    async listEnrollments(tenantId, courseId, status) {
      const result = await pool.query<EnrollmentRow>(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,
        e.student_profile_id,e.status,e.created_at,e.updated_at FROM academic.enrollments e
        JOIN people.people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id=$1 AND e.course_id=$2${status ? ' AND e.status=$3' : ''} ORDER BY p.name`,
      status ? [tenantId, courseId, status] : [tenantId, courseId]);
      return result.rows.map(enrollmentRow);
    },
    async listStudentCourses(tenantId, personIds): Promise<readonly StudentCourseReference[]> {
      if (!personIds.length) return [];
      const result = await pool.query<{ person_id: string; course_id: string; course_name: string; course_code: string; status: EnrollmentStatus }>(
        `SELECT e.person_id,e.course_id,c.name AS course_name,c.code AS course_code,e.status
         FROM academic.enrollments e JOIN academic.courses c ON c.tenant_id=e.tenant_id AND c.id=e.course_id
         WHERE e.tenant_id=$1 AND e.person_id=ANY($2::uuid[]) ORDER BY c.code,e.person_id`, [tenantId, personIds]);
      return result.rows.map(row => ({ personId: row.person_id, courseId: row.course_id, courseName: row.course_name,
        courseCode: row.course_code, status: row.status }));
    },
    async getEnrollment(tenantId, courseId, enrollmentId) {
      const result = await pool.query<EnrollmentRow>(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,
        e.student_profile_id,e.status,e.created_at,e.updated_at FROM academic.enrollments e
        JOIN people.people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id=$1 AND e.course_id=$2 AND e.id=$3`, [tenantId, courseId, enrollmentId]);
      return result.rows[0] ? enrollmentRow(result.rows[0]) : null;
    },
    async updateEnrollment(value) {
      const result = await pool.query(`UPDATE academic.enrollments SET status=$1,updated_at=$2
        WHERE tenant_id=$3 AND course_id=$4 AND id=$5`, [value.status, value.updatedAt, value.tenantId, value.courseId, value.id]);
      if (!result.rowCount) return null;
      const updated = await pool.query<EnrollmentRow>(`SELECT e.id,e.tenant_id,e.person_id,p.name AS person_name,e.course_id,
        e.student_profile_id,e.status,e.created_at,e.updated_at FROM academic.enrollments e
        JOIN people.people p ON p.tenant_id=e.tenant_id AND p.id=e.person_id
        WHERE e.tenant_id=$1 AND e.course_id=$2 AND e.id=$3`, [value.tenantId, value.courseId, value.id]);
      return updated.rows[0] ? enrollmentRow(updated.rows[0]) : null;
    },
  };
}

interface EnrollmentRow { id: string; tenant_id: string; person_id: string; person_name: string; course_id: string;
  student_profile_id: string; status: EnrollmentStatus; created_at: Date; updated_at: Date }

function enrollmentRow(row: EnrollmentRow): Enrollment {
  return { id: row.id, tenantId: row.tenant_id, personId: row.person_id, personName: row.person_name,
    courseId: row.course_id, studentProfileId: row.student_profile_id, status: row.status,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() };
}
