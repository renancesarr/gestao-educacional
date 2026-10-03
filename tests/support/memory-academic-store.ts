import type { AcademicStore, Assessment, Attendance, Collaborator, Course, Enrollment, EnrollmentStatus, Grade, StudentCourseReference, Subject } from '../../src/academic/index.ts';
import type { InstitutionEducationScopeItem } from '../../src/institution/index.ts';

const scopeKey = (item: InstitutionEducationScopeItem) => item.level === 'BASIC'
  ? `BASIC:${item.stage}:${item.modality ?? ''}` : `${item.level}:${item.courseType}`;

export class MemoryAcademicStore implements AcademicStore {
  readonly #tenantId: string;
  readonly #scope: ReadonlySet<string>;
  readonly #courses: Course[] = [];
  readonly #collaborators: Collaborator[] = [];
  readonly #subjects: Subject[] = [];
  readonly #enrollments: Enrollment[] = [];
  readonly #profiles = new Map<string, string>();
  readonly #assessments: Assessment[] = [];
  readonly #grades: Grade[] = [];
  readonly #attendance: Attendance[] = [];

  constructor(value: { tenantId: string; educationScope: readonly InstitutionEducationScopeItem[] }) {
    this.#tenantId = value.tenantId;
    this.#scope = new Set(value.educationScope.map(scopeKey));
  }

  async hasEducationScope(tenantId: string, educationScope: InstitutionEducationScopeItem): Promise<boolean> {
    return tenantId === this.#tenantId && this.#scope.has(scopeKey(educationScope));
  }

  async createCourse(course: Course): Promise<'created' | 'conflict'> {
    if (this.#courses.some(existing => existing.tenantId === course.tenantId && existing.code === course.code)) return 'conflict';
    this.#courses.push(structuredClone(course));
    return 'created';
  }

  async getCourse(tenantId: string, courseId: string): Promise<Course | null> {
    return structuredClone(this.#courses.find(course => course.tenantId === tenantId && course.id === courseId) ?? null);
  }

  async updateCourse(course: Course): Promise<'updated' | 'missing'> {
    const index = this.#courses.findIndex(existing => existing.tenantId === course.tenantId && existing.id === course.id);
    if (index < 0) return 'missing';
    this.#courses[index] = structuredClone(course);
    return 'updated';
  }

  async listCourses(tenantId: string, educationScope?: InstitutionEducationScopeItem): Promise<readonly Course[]> {
    const key = educationScope ? scopeKey(educationScope) : null;
    return structuredClone(this.#courses.filter(course => course.tenantId === tenantId &&
      (key === null || scopeKey(course.educationScope) === key)).sort((a, b) => a.code.localeCompare(b.code)));
  }

  async createCollaborator(value: Collaborator): Promise<'created' | 'conflict'> {
    if (this.#collaborators.some(existing => existing.tenantId === value.tenantId && existing.personId === value.personId)) return 'conflict';
    this.#collaborators.push(structuredClone(value));
    return 'created';
  }

  async listCollaborators(tenantId: string): Promise<readonly Collaborator[]> {
    return structuredClone(this.#collaborators.filter(value => value.tenantId === tenantId)
      .sort((a, b) => a.personName.localeCompare(b.personName)));
  }

  async updateCollaborator(tenantId: string, collaboratorId: string, active: boolean): Promise<Collaborator | null> {
    const index = this.#collaborators.findIndex(value => value.tenantId === tenantId && value.id === collaboratorId);
    if (index < 0) return null;
    const value = { ...this.#collaborators[index]!, active };
    this.#collaborators[index] = value;
    return structuredClone(value);
  }

  async createSubject(value: Subject): Promise<'created' | 'conflict'> {
    if (this.#subjects.some(subject => subject.tenantId === value.tenantId && subject.courseId === value.courseId && subject.code === value.code)) return 'conflict';
    this.#subjects.push(structuredClone(value));
    return 'created';
  }

  async listSubjects(tenantId: string, courseId: string): Promise<readonly Subject[]> {
    return structuredClone(this.#subjects.filter(subject => subject.tenantId === tenantId && subject.courseId === courseId));
  }

  async updateSubject(value: Subject): Promise<'updated' | 'missing'> {
    const index = this.#subjects.findIndex(subject => subject.tenantId === value.tenantId && subject.courseId === value.courseId && subject.id === value.id);
    if (index < 0) return 'missing';
    this.#subjects[index] = structuredClone(value);
    return 'updated';
  }

  async listCollaboratorsByIds(tenantId: string, collaboratorIds: readonly string[]): Promise<readonly Collaborator[]> {
    const ids = new Set(collaboratorIds);
    return structuredClone(this.#collaborators.filter(value => value.tenantId === tenantId && ids.has(value.id)));
  }

  async createEnrollment(value: Omit<Enrollment, 'studentProfileId'>, newStudentProfileId: string): Promise<Enrollment | 'conflict'> {
    if (this.#enrollments.some(enrollment => enrollment.tenantId === value.tenantId && enrollment.courseId === value.courseId && enrollment.personId === value.personId)) return 'conflict';
    const key = `${value.tenantId}:${value.personId}`;
    const enrollment = { ...value, studentProfileId: this.#profiles.get(key) ?? newStudentProfileId };
    this.#profiles.set(key, enrollment.studentProfileId);
    this.#enrollments.push(structuredClone(enrollment));
    return structuredClone(enrollment);
  }

  async listEnrollments(tenantId: string, courseId: string, status?: EnrollmentStatus): Promise<readonly Enrollment[]> {
    return structuredClone(this.#enrollments.filter(value => value.tenantId === tenantId && value.courseId === courseId && (!status || value.status === status))
      .sort((a, b) => a.personName.localeCompare(b.personName)));
  }

  async getEnrollment(tenantId: string, courseId: string, enrollmentId: string): Promise<Enrollment | null> {
    return structuredClone(this.#enrollments.find(value => value.tenantId === tenantId && value.courseId === courseId && value.id === enrollmentId) ?? null);
  }

  async updateEnrollment(enrollment: Enrollment): Promise<Enrollment | null> {
    const index = this.#enrollments.findIndex(value => value.tenantId === enrollment.tenantId && value.id === enrollment.id);
    if (index < 0) return null;
    this.#enrollments[index] = structuredClone(enrollment);
    return structuredClone(enrollment);
  }

  async listStudentCourses(tenantId: string, personIds: readonly string[]): Promise<readonly StudentCourseReference[]> {
    const ids = new Set(personIds);
    return structuredClone(this.#enrollments.filter(enrollment => enrollment.tenantId === tenantId && ids.has(enrollment.personId))
      .flatMap(enrollment => {
        const course = this.#courses.find(value => value.tenantId === tenantId && value.id === enrollment.courseId);
        return course ? [{ personId: enrollment.personId, courseId: course.id, courseName: course.name,
          courseCode: course.code, status: enrollment.status }] : [];
      }).sort((left, right) => left.courseCode.localeCompare(right.courseCode) || left.personId.localeCompare(right.personId)));
  }

  async createAssessment(value: Assessment): Promise<'created' | 'conflict'> {
    this.#assessments.push(structuredClone(value));
    return 'created';
  }

  async listAssessments(tenantId: string, courseId: string, subjectId: string): Promise<readonly Assessment[]> {
    return structuredClone(this.#assessments.filter(value => value.tenantId === tenantId && value.courseId === courseId && value.subjectId === subjectId)
      .sort((a, b) => a.occursOn.localeCompare(b.occursOn) || a.title.localeCompare(b.title)));
  }

  async getAssessment(tenantId: string, assessmentId: string): Promise<Assessment | null> {
    return structuredClone(this.#assessments.find(value => value.tenantId === tenantId && value.id === assessmentId) ?? null);
  }

  async updateAssessment(value: Assessment): Promise<'updated' | 'missing'> {
    const index = this.#assessments.findIndex(existing => existing.tenantId === value.tenantId && existing.id === value.id);
    if (index < 0) return 'missing';
    this.#assessments[index] = structuredClone(value);
    return 'updated';
  }

  async deleteAssessment(tenantId: string, assessmentId: string): Promise<'deleted' | 'missing' | 'has-grades'> {
    const index = this.#assessments.findIndex(value => value.tenantId === tenantId && value.id === assessmentId);
    if (index < 0) return 'missing';
    if (this.#grades.some(value => value.tenantId === tenantId && value.assessmentId === assessmentId)) return 'has-grades';
    this.#assessments.splice(index, 1);
    return 'deleted';
  }

  async createGrade(value: Grade): Promise<'created' | 'conflict'> {
    if (this.#grades.some(existing => existing.tenantId === value.tenantId && existing.enrollmentId === value.enrollmentId &&
      existing.assessmentId === value.assessmentId)) return 'conflict';
    this.#grades.push(structuredClone(value));
    return 'created';
  }

  async listGrades(tenantId: string, filter: { enrollmentId?: string; assessmentId?: string }): Promise<readonly Grade[]> {
    return structuredClone(this.#grades.filter(value => value.tenantId === tenantId &&
      (!filter.enrollmentId || value.enrollmentId === filter.enrollmentId) &&
      (!filter.assessmentId || value.assessmentId === filter.assessmentId)));
  }

  async getGrade(tenantId: string, gradeId: string): Promise<Grade | null> {
    return structuredClone(this.#grades.find(value => value.tenantId === tenantId && value.id === gradeId) ?? null);
  }

  async updateGrade(value: Grade): Promise<'updated' | 'missing'> {
    const index = this.#grades.findIndex(existing => existing.tenantId === value.tenantId && existing.id === value.id);
    if (index < 0) return 'missing';
    this.#grades[index] = structuredClone(value);
    return 'updated';
  }

  async deleteGrade(tenantId: string, gradeId: string): Promise<boolean> {
    const index = this.#grades.findIndex(value => value.tenantId === tenantId && value.id === gradeId);
    if (index < 0) return false;
    this.#grades.splice(index, 1);
    return true;
  }

  async createAttendance(value: Attendance): Promise<'created' | 'conflict'> {
    if (this.#attendance.some(existing => existing.tenantId === value.tenantId && existing.enrollmentId === value.enrollmentId &&
      existing.subjectId === value.subjectId && existing.occursOn === value.occursOn)) return 'conflict';
    this.#attendance.push(structuredClone(value));
    return 'created';
  }

  async listAttendance(tenantId: string, filter: { enrollmentId?: string; subjectId?: string }): Promise<readonly Attendance[]> {
    return structuredClone(this.#attendance.filter(value => value.tenantId === tenantId &&
      (!filter.enrollmentId || value.enrollmentId === filter.enrollmentId) &&
      (!filter.subjectId || value.subjectId === filter.subjectId))
      .sort((a, b) => a.occursOn.localeCompare(b.occursOn)));
  }

  async getAttendance(tenantId: string, attendanceId: string): Promise<Attendance | null> {
    return structuredClone(this.#attendance.find(value => value.tenantId === tenantId && value.id === attendanceId) ?? null);
  }

  async updateAttendance(value: Attendance): Promise<'updated' | 'missing' | 'conflict'> {
    const index = this.#attendance.findIndex(existing => existing.tenantId === value.tenantId && existing.id === value.id);
    if (index < 0) return 'missing';
    if (this.#attendance.some(existing => existing.tenantId === value.tenantId && existing.id !== value.id &&
      existing.enrollmentId === value.enrollmentId && existing.subjectId === value.subjectId && existing.occursOn === value.occursOn)) return 'conflict';
    this.#attendance[index] = structuredClone(value);
    return 'updated';
  }

  async deleteAttendance(tenantId: string, attendanceId: string): Promise<boolean> {
    const index = this.#attendance.findIndex(value => value.tenantId === tenantId && value.id === attendanceId);
    if (index < 0) return false;
    this.#attendance.splice(index, 1);
    return true;
  }
}
