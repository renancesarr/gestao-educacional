import { ApplicationError, readOrWrite } from '../shared/errors.ts';
import { parsePersonSearchFilters } from './input.ts';

export interface PublicStudentSearchEntry {
  readonly name: string;
  readonly courseName: string;
  readonly institutionName: string;
}

export function createPublicStudentSearchService(dependencies: {
  store: {
    search(filters: { cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string; course?: string },
      pagination: { page: number; pageSize: number }): Promise<{ students: readonly Record<string, unknown>[]; total: number }>;
  };
}) {
  return {
    async search(queryInput: unknown, paginationInput: unknown) {
      if (!queryInput || typeof queryInput !== 'object' || Array.isArray(queryInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Filtros de busca pública inválidos.');
      }
      const input = queryInput as Record<string, unknown>;
      const allowed = ['cpf', 'name', 'birthMunicipality', 'birthUf', 'course'];
      if (Object.keys(input).some(key => !allowed.includes(key))) {
        throw new ApplicationError('INVALID_INPUT', 'Filtros de busca pública inválidos.');
      }
      const personal = parsePersonSearchFilters({
        ...(input.cpf !== undefined ? { cpf: input.cpf } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.birthMunicipality !== undefined ? { birthMunicipality: input.birthMunicipality } : {}),
        ...(input.birthUf !== undefined ? { birthUf: input.birthUf } : {}),
      });
      let course = '';
      if (input.course !== undefined) {
        if (typeof input.course !== 'string' || input.course.trim().length > 100) {
          throw new ApplicationError('INVALID_INPUT', 'Filtros de busca pública inválidos.');
        }
        course = input.course.trim();
      }
      if (!personal.cpf && !personal.name && !personal.birthMunicipality && !personal.birthUf && !course) {
        throw new ApplicationError('INVALID_INPUT', 'Informe ao menos um filtro para localizar alunos.');
      }
      if (!paginationInput || typeof paginationInput !== 'object' || Array.isArray(paginationInput)) {
        throw new ApplicationError('INVALID_INPUT', 'Paginação inválida.');
      }
      const { page, pageSize, ...extra } = paginationInput as Record<string, unknown>;
      if (Object.keys(extra).length || !Number.isSafeInteger(page) || (page as number) < 1 ||
          !Number.isSafeInteger(pageSize) || (pageSize as number) < 1 || (pageSize as number) > 100) {
        throw new ApplicationError('INVALID_INPUT', 'A página deve ser positiva e o tamanho deve ficar entre 1 e 100.');
      }
      const found = await readOrWrite(() => dependencies.store.search({ ...personal, ...(course ? { course } : {}) },
        { page: page as number, pageSize: pageSize as number }));
      const students: PublicStudentSearchEntry[] = found.students.map(row => ({
        name: String(row.name), courseName: String(row.courseName), institutionName: String(row.institutionName),
      }));
      return { students, page: page as number, pageSize: pageSize as number, total: found.total,
        totalPages: Math.max(1, Math.ceil(found.total / (pageSize as number))) };
    },
  };
}
