import { requirePermission, type Principal } from '../identity/index.ts';
import { ApplicationError, readOrWrite } from '../shared/errors.ts';
import { parsePersonInput, parsePersonIdentifier, parsePersonSearchFilters, type PersonIdentifier } from './input.ts';
export type { PersonIdentifier } from './input.ts';
import type { InstitutionOperationContext } from '../institution/index.ts';

export interface Person {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly cpf: string | null;
  readonly institutionalId: string | null;
  readonly birthMunicipality: string | null;
  readonly birthUf: string | null;
  readonly createdAt: string;
}

export interface PersonSearchFilters {
  readonly cpf?: string;
  readonly name?: string;
  readonly birthMunicipality?: string;
  readonly birthUf?: string;
}

export interface PersonSearchPage {
  readonly people: readonly Person[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/** Person uniqueness is scoped to the tenant. */
export interface PeopleStore {
  insert(person: Person): Promise<'created' | 'conflict'>;
  get(tenantId: string, id: string): Promise<Person | null>;
  find(tenantId: string, identifier: PersonIdentifier): Promise<Person | null>;
  search(tenantId: string, filters: PersonSearchFilters, page: number, pageSize: number): Promise<PersonSearchPage>;
}

/** A global creation persists the person in an explicitly selected tenant. */
export interface GlobalPeopleStore extends PeopleStore {
  insertForGlobalOperation(person: Person): Promise<'created' | 'conflict'>;
}

export function createPeopleService(dependencies: {
  store: PeopleStore;
  newId: () => string;
  now: () => Date;
}) {
  const { store, newId, now } = dependencies;
  return {
    async create(principal: Principal, input: unknown): Promise<Person> {
      requirePermission(principal, 'people:create');
      const parsed = parsePersonInput(input);
      const person: Person = {
        id: newId(), tenantId: principal.tenantId,
        ...parsed,
        createdAt: now().toISOString(),
      };
      if (await readOrWrite(() => store.insert(person)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Identificador já cadastrado nesta instituição.');
      }
      return person;
    },
    async get(principal: Principal, id: string): Promise<Person> {
      requirePermission(principal, 'people:read');
      const person = await readOrWrite(() => store.get(principal.tenantId, id));
      if (!person) throw new ApplicationError('NOT_FOUND', 'Pessoa não encontrada.');
      return person;
    },
    async find(principal: Principal, input: unknown): Promise<Person | null> {
      requirePermission(principal, 'people:read');
      const identifier = parsePersonIdentifier(input);
      return readOrWrite(() => store.find(principal.tenantId, identifier));
    },
    async search(principal: Principal, input: unknown, pagination: unknown): Promise<PersonSearchPage> {
      requirePermission(principal, 'people:read');
      const filters = parsePersonSearchFilters(input);
      const { page, pageSize } = parsePersonSearchPagination(pagination);
      return readOrWrite(() => store.search(principal.tenantId, filters, page, pageSize));
    },
  };
}

export function createGlobalPeopleService(dependencies: {
  store: GlobalPeopleStore;
  newId: () => string;
  now: () => Date;
}) {
  const { store, newId, now } = dependencies;
  return {
    async create(context: InstitutionOperationContext, input: unknown): Promise<Person> {
      const parsed = parsePersonInput(input);
      const createdAt = now().toISOString();
      const person: Person = { id: newId(), tenantId: context.tenantId, ...parsed, createdAt };
      if (await readOrWrite(() => store.insertForGlobalOperation(person)) === 'conflict') {
        throw new ApplicationError('CONFLICT', 'Identificador já cadastrado nesta instituição.');
      }
      return person;
    },
    async get(context: InstitutionOperationContext, id: string): Promise<Person> {
      const person = await readOrWrite(() => store.get(context.tenantId, id));
      if (!person) throw new ApplicationError('NOT_FOUND', 'Pessoa não encontrada.');
      return person;
    },
    async find(context: InstitutionOperationContext, input: unknown): Promise<Person | null> {
      return readOrWrite(() => store.find(context.tenantId, parsePersonIdentifier(input)));
    },
    async search(context: InstitutionOperationContext, input: unknown, pagination: unknown): Promise<PersonSearchPage> {
      const filters = parsePersonSearchFilters(input);
      const { page, pageSize } = parsePersonSearchPagination(pagination);
      return readOrWrite(() => store.search(context.tenantId, filters, page, pageSize));
    },
  };
}

function parsePersonSearchPagination(input: unknown): { page: number; pageSize: number } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationError('INVALID_INPUT', 'Paginação inválida.');
  const { page, pageSize, ...extra } = input as Record<string, unknown>;
  if (Object.keys(extra).length || !Number.isSafeInteger(page) || (page as number) < 1 || !Number.isSafeInteger(pageSize) ||
      (pageSize as number) < 1 || (pageSize as number) > 100) {
    throw new ApplicationError('INVALID_INPUT', 'A página deve ser positiva e o tamanho deve ficar entre 1 e 100.');
  }
  return { page: page as number, pageSize: pageSize as number };
}
