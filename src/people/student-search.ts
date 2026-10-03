import { ApplicationError } from '../shared/errors.ts';
import type { InstitutionOperationContext } from '../institution/index.ts';
import type { StudentCourseReference } from '../academic/index.ts';
import type { Person, PersonSearchFilters, PersonSearchPage } from './index.ts';
import { parsePersonSearchFilters } from './input.ts';

export type { StudentCourseReference } from '../academic/index.ts';

export interface GlobalStudentSearchResult {
  readonly students: readonly { readonly person: Person; readonly courses: readonly Omit<StudentCourseReference, 'personId'>[] }[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export function createGlobalStudentSearchService(dependencies: {
  people: { search(context: InstitutionOperationContext, filters: PersonSearchFilters, pagination: { page: number; pageSize: number }): Promise<PersonSearchPage> };
  academic: { listStudentCourses(context: InstitutionOperationContext, personIds: readonly string[]): Promise<readonly StudentCourseReference[]> };
}) {
  return {
    async search(context: InstitutionOperationContext, queryInput: unknown, paginationInput: unknown): Promise<GlobalStudentSearchResult> {
      if (!queryInput || typeof queryInput !== 'object' || Array.isArray(queryInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Filtros de busca de alunos inválidos.');
      }
      const raw = queryInput as Record<string, unknown>;
      const allowed = ['cpf', 'name', 'birthMunicipality', 'birthUf', 'course'];
      if (Object.keys(raw).some(key => !allowed.includes(key))) {
        throw new ApplicationError('INVALID_INPUT', 'Filtros de busca de alunos inválidos.');
      }
      const filters: PersonSearchFilters = parsePersonSearchFilters({
        ...(raw.cpf !== undefined ? { cpf: raw.cpf } : {}), ...(raw.name !== undefined ? { name: raw.name } : {}),
        ...(raw.birthMunicipality !== undefined ? { birthMunicipality: raw.birthMunicipality } : {}),
        ...(raw.birthUf !== undefined ? { birthUf: raw.birthUf } : {}),
      });
      let courseQuery = '';
      if (raw.course !== undefined) {
        if (typeof raw.course !== 'string' || raw.course.trim().length > 100) {
          throw new ApplicationError('INVALID_INPUT', 'Filtros de busca de alunos inválidos.');
        }
        courseQuery = raw.course.trim();
      }
      if (!filters.cpf && !filters.name && !filters.birthMunicipality && !filters.birthUf && !courseQuery) {
        throw new ApplicationError('INVALID_INPUT', 'Informe ao menos um filtro para localizar alunos.');
      }
      if (!paginationInput || typeof paginationInput !== 'object' || Array.isArray(paginationInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Paginação inválida.');
      }
      const { page, pageSize } = paginationInput as Record<string, unknown>;
      if (!Number.isSafeInteger(page) || (page as number) < 1 || !Number.isSafeInteger(pageSize) ||
          (pageSize as number) < 1 || (pageSize as number) > 100) {
        throw new ApplicationError('INVALID_INPUT', 'A página deve ser positiva e o tamanho deve ficar entre 1 e 100.');
      }

      const allMatching: Array<{ person: Person; courses: readonly Omit<StudentCourseReference, 'personId'>[] }> = [];
      const internalPageSize = 100;
      let internalPage = 1;
      let totalPages = 1;
      const courseNeedle = courseQuery.toLocaleLowerCase('pt-BR');
      do {
        const peoplePage = await dependencies.people.search(context, filters, { page: internalPage, pageSize: internalPageSize });
        totalPages = peoplePage.totalPages;
        const personIds = peoplePage.people.map(person => person.id);
        const coursesByPerson = new Map<string, StudentCourseReference[]>();
        for (const reference of await dependencies.academic.listStudentCourses(context, personIds)) {
          const courseMatches = !courseNeedle || `${reference.courseName} ${reference.courseCode}`
            .toLocaleLowerCase('pt-BR').includes(courseNeedle);
          if (!courseMatches) continue;
          const matches = coursesByPerson.get(reference.personId) ?? [];
          matches.push(reference);
          coursesByPerson.set(reference.personId, matches);
        }
        for (const person of peoplePage.people) {
          const courses = coursesByPerson.get(person.id);
          if (!courses?.length) continue;
          allMatching.push({ person, courses: courses.map(({ personId: _personId, ...course }) => course) });
        }
        internalPage++;
      } while (internalPage <= totalPages);

      allMatching.sort((left, right) => left.person.name.localeCompare(right.person.name, 'pt-BR') || left.person.id.localeCompare(right.person.id));
      const total = allMatching.length;
      const start = ((page as number) - 1) * (pageSize as number);
      return { students: allMatching.slice(start, start + (pageSize as number)), page: page as number,
        pageSize: pageSize as number, total, totalPages: Math.max(1, Math.ceil(total / (pageSize as number))) };
    },
  };
}
