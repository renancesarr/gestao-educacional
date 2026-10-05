import { parseInstitutionEducationScope, type InstitutionEducationScopeItem, type InstitutionOperationContext } from '../institution/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';

export interface Course {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly code: string;
  readonly educationScope: InstitutionEducationScopeItem;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface Collaborator {
  readonly id: string;
  readonly tenantId: string;
  readonly personId: string;
  readonly personName: string;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface Subject {
  readonly id: string;
  readonly tenantId: string;
  readonly courseId: string;
  readonly name: string;
  readonly code: string;
  readonly workloadHours: number;
  readonly active: boolean;
  readonly collaboratorIds: readonly string[];
  readonly createdAt: string;
}

export type EnrollmentStatus = 'ativa' | 'trancada' | 'cancelada' | 'jubilada';
export interface Enrollment {
  readonly id: string;
  readonly tenantId: string;
  readonly personId: string;
  readonly personName: string;
  readonly courseId: string;
  readonly studentProfileId: string;
  readonly status: EnrollmentStatus;
  readonly regulatoryActs?: readonly EnrollmentRegulatoryActSnapshot[];
  readonly regulatoryException?: EnrollmentRegulatoryException;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnrollmentRegulatoryActSelection {
  readonly target: 'institution' | 'course';
  readonly actId: string | null;
  readonly versionId: string | null;
}

export interface EnrollmentRegulatoryException {
  readonly responsibleId: string;
  readonly recordedAt: string;
  readonly reason: string;
}

export interface EnrollmentRegulatoryActSnapshot extends EnrollmentRegulatoryActSelection {
  readonly versionNumber: number | null;
  readonly text: string | null;
  readonly status: 'ativo' | 'vencido' | 'suspenso' | 'revogado' | 'ausente';
}

export interface EnrollmentRegulatoryActReader {
  get(context: InstitutionOperationContext, actId: string): Promise<{
    id: string; target: 'institution' | 'course'; courseId?: string;
    versions: readonly { id: string; number: number; text: string; status: EnrollmentRegulatoryActSnapshot['status'] }[];
  }>;
  registerUse(context: InstitutionOperationContext, actId: string, versionId: string, operation: {
    readonly operationType: 'matricula'; readonly operationId: string;
  }): Promise<void>;
}

export interface StudentCourseReference {
  readonly personId: string;
  readonly courseId: string;
  readonly courseName: string;
  readonly courseCode: string;
  readonly status: EnrollmentStatus;
}

export interface Assessment {
  readonly id: string;
  readonly tenantId: string;
  readonly courseId: string;
  readonly subjectId: string;
  readonly title: string;
  readonly occursOn: string;
  readonly maxPoints: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Grade {
  readonly id: string;
  readonly tenantId: string;
  readonly enrollmentId: string;
  readonly assessmentId: string;
  readonly value: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AttendanceStatus = 'presente' | 'ausente';
export interface Attendance {
  readonly id: string;
  readonly tenantId: string;
  readonly courseId: string;
  readonly enrollmentId: string;
  readonly subjectId: string;
  readonly occursOn: string;
  readonly status: AttendanceStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AcademicPersonReader {
  get(context: InstitutionOperationContext, personId: string): Promise<{ id: string; tenantId: string; name: string }>;
}

export interface AcademicStore {
  hasEducationScope(tenantId: string, educationScope: InstitutionEducationScopeItem): Promise<boolean>;
  createCourse(course: Course): Promise<'created' | 'conflict'>;
  getCourse(tenantId: string, courseId: string): Promise<Course | null>;
  updateCourse(course: Course): Promise<'updated' | 'missing'>;
  listCourses(tenantId: string, educationScope?: InstitutionEducationScopeItem): Promise<readonly Course[]>;
  createCollaborator(collaborator: Collaborator): Promise<'created' | 'conflict'>;
  listCollaborators(tenantId: string): Promise<readonly Collaborator[]>;
  updateCollaborator(tenantId: string, collaboratorId: string, active: boolean): Promise<Collaborator | null>;
  createSubject(subject: Subject): Promise<'created' | 'conflict'>;
  listSubjects(tenantId: string, courseId: string): Promise<readonly Subject[]>;
  updateSubject(subject: Subject): Promise<'updated' | 'missing'>;
  listCollaboratorsByIds(tenantId: string, collaboratorIds: readonly string[]): Promise<readonly Collaborator[]>;
  createEnrollment(enrollment: Omit<Enrollment, 'studentProfileId'>, newStudentProfileId: string): Promise<Enrollment | 'conflict'>;
  listEnrollments(tenantId: string, courseId: string, status?: EnrollmentStatus): Promise<readonly Enrollment[]>;
  getEnrollment(tenantId: string, courseId: string, enrollmentId: string): Promise<Enrollment | null>;
  updateEnrollment(enrollment: Enrollment): Promise<Enrollment | null>;
  listStudentCourses(tenantId: string, personIds: readonly string[]): Promise<readonly StudentCourseReference[]>;
  createAssessment?(assessment: Assessment): Promise<'created' | 'conflict'>;
  listAssessments?(tenantId: string, courseId: string, subjectId: string): Promise<readonly Assessment[]>;
  getAssessment?(tenantId: string, assessmentId: string): Promise<Assessment | null>;
  updateAssessment?(assessment: Assessment): Promise<'updated' | 'missing'>;
  deleteAssessment?(tenantId: string, assessmentId: string): Promise<'deleted' | 'missing' | 'has-grades'>;
  createGrade?(grade: Grade): Promise<'created' | 'conflict'>;
  listGrades?(tenantId: string, filter: { enrollmentId?: string; assessmentId?: string }): Promise<readonly Grade[]>;
  getGrade?(tenantId: string, gradeId: string): Promise<Grade | null>;
  updateGrade?(grade: Grade): Promise<'updated' | 'missing'>;
  deleteGrade?(tenantId: string, gradeId: string): Promise<boolean>;
  createAttendance?(attendance: Attendance): Promise<'created' | 'conflict'>;
  listAttendance?(tenantId: string, filter: { enrollmentId?: string; subjectId?: string }): Promise<readonly Attendance[]>;
  getAttendance?(tenantId: string, attendanceId: string): Promise<Attendance | null>;
  updateAttendance?(attendance: Attendance): Promise<'updated' | 'missing' | 'conflict'>;
  deleteAttendance?(tenantId: string, attendanceId: string): Promise<boolean>;
}

type AcademicRecordsStore = Required<Pick<AcademicStore, 'createAssessment' | 'listAssessments' | 'getAssessment' | 'updateAssessment' |
  'deleteAssessment' | 'createGrade' | 'listGrades' | 'getGrade' | 'updateGrade' | 'deleteGrade' |
  'createAttendance' | 'listAttendance' | 'getAttendance' | 'updateAttendance' | 'deleteAttendance'>>;

function academicRecordsStore(store: AcademicStore): AcademicRecordsStore {
  if (!store.createAssessment || !store.listAssessments || !store.getAssessment || !store.updateAssessment || !store.deleteAssessment ||
      !store.createGrade || !store.listGrades || !store.getGrade || !store.updateGrade || !store.deleteGrade ||
      !store.createAttendance || !store.listAttendance || !store.getAttendance || !store.updateAttendance || !store.deleteAttendance) {
    throw new ApplicationError('UNAVAILABLE', 'O adaptador acadêmico não oferece os CRUDs acadêmicos neste ambiente.');
  }
  return store as AcademicRecordsStore;
}

function parseAssessmentInput(input: unknown, partial = false): { title?: string; occursOn?: string; maxPoints?: number } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da avaliação inválidos.');
  const value = input as Record<string, unknown>;
  const allowed = ['title', 'occursOn', 'maxPoints'];
  if (!Object.keys(value).length || Object.keys(value).some(key => !allowed.includes(key)) ||
      (!partial && allowed.some(key => !(key in value)))) throw new ApplicationError('INVALID_INPUT', 'Dados da avaliação inválidos.');
  const result: { title?: string; occursOn?: string; maxPoints?: number } = {};
  if ('title' in value) {
    const title = typeof value.title === 'string' ? value.title.trim() : '';
    if (!title || title.length > 200) throw new ApplicationError('INVALID_INPUT', 'Dados da avaliação inválidos.');
    result.title = title;
  }
  if ('occursOn' in value) {
    const occursOn = typeof value.occursOn === 'string' ? value.occursOn : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occursOn) || Number.isNaN(Date.parse(`${occursOn}T00:00:00.000Z`)) ||
        new Date(`${occursOn}T00:00:00.000Z`).toISOString().slice(0, 10) !== occursOn) {
      throw new ApplicationError('INVALID_INPUT', 'Data acadêmica inválida.');
    }
    result.occursOn = occursOn;
  }
  if ('maxPoints' in value) {
    if (typeof value.maxPoints !== 'number' || !Number.isFinite(value.maxPoints) || value.maxPoints <= 0) {
      throw new ApplicationError('INVALID_INPUT', 'A pontuação máxima deve ser positiva.');
    }
    result.maxPoints = value.maxPoints;
  }
  return result;
}

function parseGradeInput(input: unknown, partial = false): { enrollmentId?: string; assessmentId?: string; value?: number } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da nota inválidos.');
  const value = input as Record<string, unknown>;
  const allowed = ['enrollmentId', 'assessmentId', 'value'];
  if (!Object.keys(value).length || Object.keys(value).some(key => !allowed.includes(key)) ||
      (!partial && allowed.some(key => !(key in value)))) throw new ApplicationError('INVALID_INPUT', 'Dados da nota inválidos.');
  const result: { enrollmentId?: string; assessmentId?: string; value?: number } = {};
  for (const key of ['enrollmentId', 'assessmentId'] as const) {
    if (key in value) {
      if (typeof value[key] !== 'string' || !value[key]) throw new ApplicationError('INVALID_INPUT', 'Dados da nota inválidos.');
      result[key] = value[key];
    }
  }
  if ('value' in value) {
    if (typeof value.value !== 'number' || !Number.isFinite(value.value) || value.value < 0) {
      throw new ApplicationError('INVALID_INPUT', 'A nota deve ser um número igual ou maior que zero.');
    }
    result.value = value.value;
  }
  return result;
}

function parseAttendanceInput(input: unknown, partial = false): { enrollmentId?: string; occursOn?: string; status?: AttendanceStatus } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados de frequência inválidos.');
  const value = input as Record<string, unknown>;
  const allowed = ['enrollmentId', 'occursOn', 'status'];
  if (!Object.keys(value).length || Object.keys(value).some(key => !allowed.includes(key)) ||
      (!partial && allowed.some(key => !(key in value)))) throw new ApplicationError('INVALID_INPUT', 'Dados de frequência inválidos.');
  const result: { enrollmentId?: string; occursOn?: string; status?: AttendanceStatus } = {};
  if ('enrollmentId' in value) {
    if (typeof value.enrollmentId !== 'string' || !value.enrollmentId) throw new ApplicationError('INVALID_INPUT', 'Dados de frequência inválidos.');
    result.enrollmentId = value.enrollmentId;
  }
  if ('occursOn' in value) {
    const date = typeof value.occursOn === 'string' ? value.occursOn : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)) ||
        new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
      throw new ApplicationError('INVALID_INPUT', 'Data acadêmica inválida.');
    }
    result.occursOn = date;
  }
  if ('status' in value) {
    if (value.status !== 'presente' && value.status !== 'ausente') throw new ApplicationError('INVALID_INPUT', 'Situação de frequência inválida.');
    result.status = value.status;
  }
  return result;
}

function parseCourseInput(input: unknown): { name: string; code: string; educationScope: InstitutionEducationScopeItem } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const code = typeof value.code === 'string' ? value.code.trim() : '';
  if (Object.keys(value).some(key => !['name', 'code', 'educationScope'].includes(key)) ||
      !name || name.length > 200 || !/^[a-z0-9][a-z0-9-]{1,99}$/.test(code)) {
    throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
  }
  const educationScope = parseInstitutionEducationScope([value.educationScope])[0];
  if (!educationScope) throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
  return { name, code, educationScope };
}

function parseCourseUpdate(input: unknown): { name?: string; active?: boolean } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
  const value = input as Record<string, unknown>;
  if (!Object.keys(value).length || Object.keys(value).some(key => !['name', 'active'].includes(key))) {
    throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
  }
  const update: { name?: string; active?: boolean } = {};
  if ('name' in value) {
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (!name || name.length > 200) throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
    update.name = name;
  }
  if ('active' in value) {
    if (typeof value.active !== 'boolean') throw new ApplicationError('INVALID_INPUT', 'Dados do curso inválidos.');
    update.active = value.active;
  }
  return update;
}

function parseSubjectInput(input: unknown): { name: string; code: string; workloadHours: number; collaboratorIds: string[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const code = typeof value.code === 'string' ? value.code.trim() : '';
  if (Object.keys(value).some(key => !['name', 'code', 'workloadHours', 'collaboratorIds'].includes(key)) ||
      !name || name.length > 200 || !/^[a-z0-9][a-z0-9-]{1,99}$/.test(code) ||
      !Number.isSafeInteger(value.workloadHours) || (value.workloadHours as number) <= 0 ||
      !Array.isArray(value.collaboratorIds) || value.collaboratorIds.length === 0 ||
      value.collaboratorIds.some(id => typeof id !== 'string' || !id) || new Set(value.collaboratorIds).size !== value.collaboratorIds.length) {
    throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
  }
  return { name, code, workloadHours: value.workloadHours as number, collaboratorIds: [...value.collaboratorIds] as string[] };
}

function parseSubjectUpdate(input: unknown): { name?: string; workloadHours?: number; active?: boolean; collaboratorIds?: string[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
  const value = input as Record<string, unknown>;
  if (!Object.keys(value).length || Object.keys(value).some(key => !['name', 'workloadHours', 'active', 'collaboratorIds'].includes(key))) {
    throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
  }
  const update: { name?: string; workloadHours?: number; active?: boolean; collaboratorIds?: string[] } = {};
  if ('name' in value) {
    const name = typeof value.name === 'string' ? value.name.trim() : '';
    if (!name || name.length > 200) throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
    update.name = name;
  }
  if ('workloadHours' in value) {
    if (!Number.isSafeInteger(value.workloadHours) || (value.workloadHours as number) <= 0) throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
    update.workloadHours = value.workloadHours as number;
  }
  if ('active' in value) {
    if (typeof value.active !== 'boolean') throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
    update.active = value.active;
  }
  if ('collaboratorIds' in value) {
    if (!Array.isArray(value.collaboratorIds) || !value.collaboratorIds.length || value.collaboratorIds.some(id => typeof id !== 'string' || !id) ||
        new Set(value.collaboratorIds).size !== value.collaboratorIds.length) throw new ApplicationError('INVALID_INPUT', 'Dados da matéria inválidos.');
    update.collaboratorIds = [...value.collaboratorIds] as string[];
  }
  return update;
}

export function createAcademicService(deps: { store: AcademicStore; people: AcademicPersonReader; now: () => Date; newId: () => string;
  regulatoryActs?: EnrollmentRegulatoryActReader }) {
  return {
    async createCourse(context: InstitutionOperationContext, input: unknown): Promise<Course> {
      const parsed = parseCourseInput(input);
      if (!await readOrWrite(() => deps.store.hasEducationScope(context.tenantId, parsed.educationScope))) {
        throw new ApplicationError('INVALID_INPUT', 'O curso não corresponde ao escopo educacional da instituição.');
      }
      const course: Course = { id: deps.newId(), tenantId: context.tenantId, ...parsed, active: true, createdAt: deps.now().toISOString() };
      if (await readOrWrite(() => deps.store.createCourse(course)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Já existe um curso com esse código nesta instituição.');
      }
      return course;
    },
    async updateCourse(context: InstitutionOperationContext, courseId: string, input: unknown): Promise<Course> {
      const update = parseCourseUpdate(input);
      const current = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const course: Course = { ...current, ...update };
      if (await readOrWrite(() => deps.store.updateCourse(course)) === 'missing') {
        throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      }
      return course;
    },
    async listCourses(context: InstitutionOperationContext, scopeInput?: unknown): Promise<readonly Course[]> {
      const educationScope = scopeInput === undefined ? undefined : parseInstitutionEducationScope([scopeInput])[0];
      if (educationScope && !await readOrWrite(() => deps.store.hasEducationScope(context.tenantId, educationScope))) {
        throw new ApplicationError('INVALID_INPUT', 'O filtro não corresponde ao escopo educacional da instituição.');
      }
      return readOrWrite(() => deps.store.listCourses(context.tenantId, educationScope));
    },
    async createCollaborator(context: InstitutionOperationContext, input: unknown): Promise<Collaborator> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 ||
          typeof (input as Record<string, unknown>).personId !== 'string' || !(input as Record<string, unknown>).personId) {
        throw new ApplicationError('INVALID_INPUT', 'Dados do colaborador inválidos.');
      }
      const person = await readOrWrite(() => deps.people.get(context, (input as { personId: string }).personId));
      if (person.tenantId !== context.tenantId) throw new ApplicationError('NOT_FOUND', 'Pessoa não encontrada.');
      const collaborator: Collaborator = { id: deps.newId(), tenantId: context.tenantId, personId: person.id,
        personName: person.name, active: true, createdAt: deps.now().toISOString() };
      if (await readOrWrite(() => deps.store.createCollaborator(collaborator)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Esta pessoa já está vinculada como colaboradora.');
      }
      return collaborator;
    },
    async listCollaborators(context: InstitutionOperationContext): Promise<readonly Collaborator[]> {
      return readOrWrite(() => deps.store.listCollaborators(context.tenantId));
    },
    async updateCollaborator(context: InstitutionOperationContext, collaboratorId: string, input: unknown): Promise<Collaborator> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 ||
          typeof (input as Record<string, unknown>).active !== 'boolean') {
        throw new ApplicationError('INVALID_INPUT', 'Dados do colaborador inválidos.');
      }
      const updated = await readOrWrite(() => deps.store.updateCollaborator(context.tenantId, collaboratorId,
        (input as { active: boolean }).active));
      if (!updated) throw new ApplicationError('NOT_FOUND', 'Colaborador não encontrado.');
      return updated;
    },
    async createSubject(context: InstitutionOperationContext, courseId: string, input: unknown) {
      const parsed = parseSubjectInput(input);
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      if (!course.active) throw new ApplicationError('CONFLICT', 'Curso inativo não aceita matérias.');
      const collaborators = await readOrWrite(() => deps.store.listCollaboratorsByIds(context.tenantId, parsed.collaboratorIds));
      if (collaborators.length !== parsed.collaboratorIds.length || collaborators.some(value => !value.active)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe colaboradores ativos da instituição-alvo.');
      }
      const subject: Subject = { id: deps.newId(), tenantId: context.tenantId, courseId, ...parsed,
        active: true, createdAt: deps.now().toISOString() };
      if (await readOrWrite(() => deps.store.createSubject(subject)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Já existe uma matéria com esse código neste curso.');
      }
      return { ...subject, collaborators };
    },
    async listSubjects(context: InstitutionOperationContext, courseId: string) {
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const subjects = await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId));
      return Promise.all(subjects.map(async subject => ({ ...subject, collaborators: await readOrWrite(() =>
        deps.store.listCollaboratorsByIds(context.tenantId, subject.collaboratorIds)) })));
    },
    async getCourseDetail(context: InstitutionOperationContext, courseId: string) {
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const subjects = await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId));
      return { ...course, subjects: await Promise.all(subjects.map(async subject => ({ ...subject,
        collaborators: await readOrWrite(() => deps.store.listCollaboratorsByIds(context.tenantId, subject.collaboratorIds)) }))) };
    },
    async updateSubject(context: InstitutionOperationContext, courseId: string, subjectId: string, input: unknown) {
      const update = parseSubjectUpdate(input);
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      if (!course.active) throw new ApplicationError('CONFLICT', 'Curso inativo não aceita alterações no PPC.');
      const current = (await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId)))
        .find(value => value.id === subjectId);
      if (!current) throw new ApplicationError('NOT_FOUND', 'Matéria não encontrada.');
      const subject: Subject = { ...current, ...update };
      const collaborators = await readOrWrite(() => deps.store.listCollaboratorsByIds(context.tenantId, subject.collaboratorIds));
      if (collaborators.length !== subject.collaboratorIds.length || collaborators.length === 0 ||
          (subject.active && collaborators.every(value => !value.active))) {
        throw new ApplicationError('INVALID_INPUT', 'A matéria ativa precisa de ao menos um professor colaborador ativo da instituição-alvo.');
      }
      if (await readOrWrite(() => deps.store.updateSubject(subject)) === 'missing') throw new ApplicationError('NOT_FOUND', 'Matéria não encontrada.');
      return { ...subject, collaborators };
    },
    async createEnrollment(context: InstitutionOperationContext, input: unknown): Promise<Enrollment> {
      if (!input || typeof input !== 'object' || Array.isArray(input) ||
          typeof (input as Record<string, unknown>).personId !== 'string' || typeof (input as Record<string, unknown>).courseId !== 'string') {
        throw new ApplicationError('INVALID_INPUT', 'Dados da matrícula inválidos.');
      }
      const value = input as Record<string, unknown>;
      const allowed = deps.regulatoryActs ? ['personId', 'courseId', 'regulatoryActs', 'allowRegulatoryException', 'regulatoryExceptionReason'] : ['personId', 'courseId'];
      if (Object.keys(value).some(key => !allowed.includes(key)) ||
          (deps.regulatoryActs && (!('regulatoryActs' in value) ||
            ('allowRegulatoryException' in value && typeof value.allowRegulatoryException !== 'boolean') ||
            ('regulatoryExceptionReason' in value && typeof value.regulatoryExceptionReason !== 'string')))) {
        throw new ApplicationError('INVALID_INPUT', 'Dados da matrícula inválidos.');
      }
      const { personId, courseId } = value as { personId: string; courseId: string };
      const person = await readOrWrite(() => deps.people.get(context, personId));
      if (person.tenantId !== context.tenantId) throw new ApplicationError('NOT_FOUND', 'Pessoa não encontrada.');
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      if (!course.active) throw new ApplicationError('CONFLICT', 'Curso inativo não aceita novas matrículas.');
      const subjects = await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId));
      let eligible = false;
      for (const subject of subjects.filter(value => value.active)) {
        const collaborators = await readOrWrite(() => deps.store.listCollaboratorsByIds(context.tenantId, subject.collaboratorIds));
        if (collaborators.some(value => value.active)) { eligible = true; break; }
      }
      if (!eligible) throw new ApplicationError('CONFLICT', 'O curso precisa de matéria ativa com professor ativo para novas matrículas.');
      let regulatoryActs: EnrollmentRegulatoryActSnapshot[] | undefined;
      let regulatoryException: EnrollmentRegulatoryException | undefined;
      if (deps.regulatoryActs) {
        if (!Array.isArray(value.regulatoryActs) || value.regulatoryActs.length !== 2) {
          throw new ApplicationError('INVALID_INPUT', 'Selecione um ato da instituição e um ato do curso.');
        }
        const selections = value.regulatoryActs as EnrollmentRegulatoryActSelection[];
        if (selections.some(selection => !selection || typeof selection !== 'object' ||
            !['institution', 'course'].includes(selection.target) ||
            !((selection.actId === null && selection.versionId === null) ||
              (typeof selection.actId === 'string' && !!selection.actId && typeof selection.versionId === 'string' && !!selection.versionId))) ||
            new Set(selections.map(selection => selection.target)).size !== 2) {
          throw new ApplicationError('INVALID_INPUT', 'Selecione um ato da instituição e um ato do curso.');
        }
        regulatoryActs = [];
        let requiresException = false;
        for (const target of ['institution', 'course'] as const) {
          const selection = selections.find(item => item.target === target)!;
          if (selection.actId === null || selection.versionId === null) {
            requiresException = true;
            regulatoryActs.push({ target, actId: null, versionId: null, versionNumber: null, text: null, status: 'ausente' });
            continue;
          }
          const act = await readOrWrite(() => deps.regulatoryActs!.get(context, selection.actId!));
          if (act.target !== target || (target === 'course' && act.courseId !== courseId)) {
            throw new ApplicationError('INVALID_INPUT', 'O ato selecionado não pertence ao alvo desta matrícula.');
          }
          const version = act.versions.find(item => item.id === selection.versionId!);
          if (!version) throw new ApplicationError('NOT_FOUND', 'Versão do ato regulatório não encontrada.');
          if (version.status !== 'ativo') requiresException = true;
          regulatoryActs.push({ target, actId: act.id, versionId: version.id, versionNumber: version.number,
            text: version.text, status: version.status });
        }
        if (requiresException) {
          const reason = typeof value.regulatoryExceptionReason === 'string' ? value.regulatoryExceptionReason.trim() : '';
          if (value.allowRegulatoryException !== true || !reason || reason.length > 2000) {
            throw new ApplicationError('CONFLICT', 'Ato ausente ou inativo: para permitir a matrícula, confirme a exceção e informe uma justificativa.');
          }
          regulatoryException = { responsibleId: context.actorId, recordedAt: deps.now().toISOString(), reason };
        } else if (value.allowRegulatoryException === true || value.regulatoryExceptionReason !== undefined) {
          throw new ApplicationError('INVALID_INPUT', 'Justificativa não necessária para atos ativos.');
        }
      }
      const now = deps.now().toISOString();
      const enrollment: Omit<Enrollment, 'studentProfileId'> = { id: deps.newId(), tenantId: context.tenantId,
        personId, personName: person.name, courseId, status: 'ativa', regulatoryActs: regulatoryActs ?? [],
        ...(regulatoryException ? { regulatoryException } : {}),
        createdAt: now, updatedAt: now };
      const created = await readOrWrite(() => deps.store.createEnrollment(enrollment, deps.newId()));
      if (created === 'conflict') throw new ApplicationError('CONFLICT', 'Esta pessoa já possui matrícula neste curso.');
      if (deps.regulatoryActs && regulatoryActs) {
        for (const act of regulatoryActs) if (act.actId && act.versionId) {
          await readOrWrite(() => deps.regulatoryActs!.registerUse(context, act.actId!, act.versionId!,
            { operationType: 'matricula', operationId: created.id }));
        }
      }
      return created;
    },
    async listEnrollments(context: InstitutionOperationContext, courseId: string, statusInput?: unknown) {
      if (statusInput !== undefined && !['ativa', 'trancada', 'cancelada', 'jubilada'].includes(String(statusInput))) {
        throw new ApplicationError('INVALID_INPUT', 'Filtro de situação inválido.');
      }
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      return readOrWrite(() => deps.store.listEnrollments(context.tenantId, courseId, statusInput as EnrollmentStatus | undefined));
    },
    async listStudentCourses(context: InstitutionOperationContext, personIdsInput: unknown): Promise<readonly StudentCourseReference[]> {
      if (!Array.isArray(personIdsInput) || personIdsInput.length > 100 ||
          personIdsInput.some(value => typeof value !== 'string' || !value.trim())) {
        throw new ApplicationError('INVALID_INPUT', 'IDs de alunos inválidos.');
      }
      const personIds = [...new Set(personIdsInput.map(value => (value as string).trim()))];
      if (!personIds.length) return [];
      return readOrWrite(() => deps.store.listStudentCourses(context.tenantId, personIds));
    },
    async transitionEnrollment(context: InstitutionOperationContext, courseId: string, enrollmentId: string, input: unknown): Promise<Enrollment> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 ||
          !['ativa', 'trancada', 'cancelada', 'jubilada'].includes(String((input as Record<string, unknown>).status))) {
        throw new ApplicationError('INVALID_INPUT', 'Situação de matrícula inválida.');
      }
      const current = await readOrWrite(() => deps.store.getEnrollment(context.tenantId, courseId, enrollmentId));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Matrícula não encontrada.');
      const next = (input as { status: EnrollmentStatus }).status;
      const allowed: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
        ativa: ['trancada', 'cancelada', 'jubilada'], trancada: ['ativa', 'cancelada', 'jubilada'],
        cancelada: [], jubilada: [],
      };
      if (!allowed[current.status].includes(next)) throw new ApplicationError('CONFLICT', 'Transição de matrícula não permitida.');
      const updated = await readOrWrite(() => deps.store.updateEnrollment({ ...current, status: next, updatedAt: deps.now().toISOString() }));
      if (!updated) throw new ApplicationError('NOT_FOUND', 'Matrícula não encontrada.');
      return updated;
    },
    async createAssessment(context: InstitutionOperationContext, courseId: string, subjectId: string, input: unknown): Promise<Assessment> {
      const parsed = parseAssessmentInput(input);
      const records = academicRecordsStore(deps.store);
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const subject = (await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId)))
        .find(value => value.id === subjectId);
      if (!subject) throw new ApplicationError('NOT_FOUND', 'Matéria não encontrada.');
      const now = deps.now().toISOString();
      const assessment: Assessment = { id: deps.newId(), tenantId: context.tenantId, courseId, subjectId,
        title: parsed.title!, occursOn: parsed.occursOn!, maxPoints: parsed.maxPoints!, createdAt: now, updatedAt: now };
      if (await readOrWrite(() => records.createAssessment(assessment)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Já existe uma avaliação com essa identificação nesta matéria e data.');
      }
      return assessment;
    },
    async listAssessments(context: InstitutionOperationContext, courseId: string, subjectId: string): Promise<readonly Assessment[]> {
      const records = academicRecordsStore(deps.store);
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const subject = (await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId)))
        .find(value => value.id === subjectId);
      if (!subject) throw new ApplicationError('NOT_FOUND', 'Matéria não encontrada.');
      return readOrWrite(() => records.listAssessments(context.tenantId, courseId, subjectId));
    },
    async updateAssessment(context: InstitutionOperationContext, assessmentId: string, input: unknown): Promise<Assessment> {
      const update = parseAssessmentInput(input, true);
      const records = academicRecordsStore(deps.store);
      const current = await readOrWrite(() => records.getAssessment(context.tenantId, assessmentId));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Avaliação não encontrada.');
      const assessment: Assessment = { ...current, ...update, updatedAt: deps.now().toISOString() };
      if ((await readOrWrite(() => records.listGrades(context.tenantId, { assessmentId })))
        .some(grade => grade.value > assessment.maxPoints)) {
        throw new ApplicationError('CONFLICT', 'A pontuação máxima não pode ficar abaixo de uma nota já registrada.');
      }
      if (await readOrWrite(() => records.updateAssessment(assessment)) === 'missing') {
        throw new ApplicationError('NOT_FOUND', 'Avaliação não encontrada.');
      }
      return assessment;
    },
    async deleteAssessment(context: InstitutionOperationContext, assessmentId: string): Promise<void> {
      const records = academicRecordsStore(deps.store);
      const result = await readOrWrite(() => records.deleteAssessment(context.tenantId, assessmentId));
      if (result === 'missing') throw new ApplicationError('NOT_FOUND', 'Avaliação não encontrada.');
      if (result === 'has-grades') throw new ApplicationError('CONFLICT', 'Avaliação com notas registradas não pode ser excluída.');
    },
    async createGrade(context: InstitutionOperationContext, input: unknown): Promise<Grade> {
      const parsed = parseGradeInput(input);
      const records = academicRecordsStore(deps.store);
      const assessment = await readOrWrite(() => records.getAssessment(context.tenantId, parsed.assessmentId!));
      if (!assessment) throw new ApplicationError('NOT_FOUND', 'Avaliação não encontrada.');
      const enrollment = await readOrWrite(() => deps.store.getEnrollment(context.tenantId, assessment.courseId, parsed.enrollmentId!));
      if (!enrollment) throw new ApplicationError('NOT_FOUND', 'Matrícula não encontrada para esta avaliação.');
      if (parsed.value! > assessment.maxPoints) throw new ApplicationError('INVALID_INPUT', 'A nota não pode superar a pontuação máxima da avaliação.');
      const now = deps.now().toISOString();
      const grade: Grade = { id: deps.newId(), tenantId: context.tenantId, enrollmentId: enrollment.id,
        assessmentId: assessment.id, value: parsed.value!, createdAt: now, updatedAt: now };
      if (await readOrWrite(() => records.createGrade(grade)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Já existe uma nota para esta matrícula e avaliação.');
      }
      return grade;
    },
    async listGrades(context: InstitutionOperationContext, input: unknown): Promise<readonly Grade[]> {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Filtro de notas inválido.');
      const value = input as Record<string, unknown>;
      if (Object.keys(value).some(key => !['enrollmentId', 'assessmentId'].includes(key)) ||
          (!value.enrollmentId && !value.assessmentId) || Object.values(value).some(item => typeof item !== 'string' || !item)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe uma matrícula ou avaliação para consultar notas.');
      }
      const records = academicRecordsStore(deps.store);
      const filter = { ...(value.enrollmentId ? { enrollmentId: value.enrollmentId as string } : {}),
        ...(value.assessmentId ? { assessmentId: value.assessmentId as string } : {}) };
      return readOrWrite(() => records.listGrades(context.tenantId, filter));
    },
    async updateGrade(context: InstitutionOperationContext, gradeId: string, input: unknown): Promise<Grade> {
      const update = parseGradeInput(input, true);
      if (!('value' in update) || Object.keys(update).length !== 1) throw new ApplicationError('INVALID_INPUT', 'Informe a nota a atualizar.');
      const records = academicRecordsStore(deps.store);
      const current = await readOrWrite(() => records.getGrade(context.tenantId, gradeId));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Nota não encontrada.');
      const assessment = await readOrWrite(() => records.getAssessment(context.tenantId, current.assessmentId));
      if (!assessment) throw new ApplicationError('NOT_FOUND', 'Avaliação não encontrada.');
      if (update.value! > assessment.maxPoints) throw new ApplicationError('INVALID_INPUT', 'A nota não pode superar a pontuação máxima da avaliação.');
      const grade = { ...current, value: update.value!, updatedAt: deps.now().toISOString() };
      if (await readOrWrite(() => records.updateGrade(grade)) === 'missing') throw new ApplicationError('NOT_FOUND', 'Nota não encontrada.');
      return grade;
    },
    async deleteGrade(context: InstitutionOperationContext, gradeId: string): Promise<void> {
      if (!await readOrWrite(() => academicRecordsStore(deps.store).deleteGrade(context.tenantId, gradeId))) {
        throw new ApplicationError('NOT_FOUND', 'Nota não encontrada.');
      }
    },
    async createAttendance(context: InstitutionOperationContext, courseId: string, subjectId: string, input: unknown): Promise<Attendance> {
      const parsed = parseAttendanceInput(input);
      const records = academicRecordsStore(deps.store);
      const course = await readOrWrite(() => deps.store.getCourse(context.tenantId, courseId));
      if (!course) throw new ApplicationError('NOT_FOUND', 'Curso não encontrado.');
      const subject = (await readOrWrite(() => deps.store.listSubjects(context.tenantId, courseId))).find(value => value.id === subjectId);
      if (!subject) throw new ApplicationError('NOT_FOUND', 'Matéria não encontrada.');
      const enrollment = await readOrWrite(() => deps.store.getEnrollment(context.tenantId, courseId, parsed.enrollmentId!));
      if (!enrollment) throw new ApplicationError('NOT_FOUND', 'Matrícula não encontrada para esta matéria.');
      const now = deps.now().toISOString();
      const attendance: Attendance = { id: deps.newId(), tenantId: context.tenantId, courseId, subjectId,
        enrollmentId: enrollment.id, occursOn: parsed.occursOn!, status: parsed.status!, createdAt: now, updatedAt: now };
      if (await readOrWrite(() => records.createAttendance(attendance)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Já existe frequência para esta matrícula, matéria e data.');
      }
      return attendance;
    },
    async listAttendance(context: InstitutionOperationContext, input: unknown): Promise<readonly Attendance[]> {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Filtro de frequência inválido.');
      const value = input as Record<string, unknown>;
      if (Object.keys(value).some(key => !['enrollmentId', 'subjectId'].includes(key)) ||
          (!value.enrollmentId && !value.subjectId) || Object.values(value).some(item => typeof item !== 'string' || !item)) {
        throw new ApplicationError('INVALID_INPUT', 'Informe matrícula ou matéria para consultar frequência.');
      }
      const filter = { ...(value.enrollmentId ? { enrollmentId: value.enrollmentId as string } : {}),
        ...(value.subjectId ? { subjectId: value.subjectId as string } : {}) };
      return readOrWrite(() => academicRecordsStore(deps.store).listAttendance(context.tenantId, filter));
    },
    async updateAttendance(context: InstitutionOperationContext, attendanceId: string, input: unknown): Promise<Attendance> {
      const update = parseAttendanceInput(input, true);
      if (Object.keys(update).some(key => key === 'enrollmentId')) throw new ApplicationError('INVALID_INPUT', 'A matrícula da frequência não pode ser alterada.');
      const records = academicRecordsStore(deps.store);
      const current = await readOrWrite(() => records.getAttendance(context.tenantId, attendanceId));
      if (!current) throw new ApplicationError('NOT_FOUND', 'Frequência não encontrada.');
      const attendance = { ...current, ...update, updatedAt: deps.now().toISOString() };
      const result = await readOrWrite(() => records.updateAttendance(attendance));
      if (result === 'missing') throw new ApplicationError('NOT_FOUND', 'Frequência não encontrada.');
      if (result === 'conflict') throw new ApplicationError('CONFLICT', 'Já existe frequência para esta matrícula, matéria e data.');
      return attendance;
    },
    async deleteAttendance(context: InstitutionOperationContext, attendanceId: string): Promise<void> {
      if (!await readOrWrite(() => academicRecordsStore(deps.store).deleteAttendance(context.tenantId, attendanceId))) {
        throw new ApplicationError('NOT_FOUND', 'Frequência não encontrada.');
      }
    },
  };
}
