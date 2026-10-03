import type { GlobalPeopleStore, PeopleStore, Person, PersonIdentifier, PersonSearchFilters } from '../../src/people/index.ts';

export class MemoryPeopleStore implements PeopleStore, GlobalPeopleStore {
  #people: Person[] = [];
  #unavailable: boolean;

  constructor(options: { unavailable?: boolean } = {}) {
    this.#unavailable = options.unavailable ?? false;
  }

  restore(): void { this.#unavailable = false; }

  async insert(person: Person): Promise<'created' | 'conflict'> {
    return this.#insert(person);
  }

  async insertForGlobalOperation(person: Person): Promise<'created' | 'conflict'> {
    return this.#insert(person);
  }

  #insert(person: Person): 'created' | 'conflict' {
    if (this.#unavailable) throw new Error('Simulated database failure: private connection details');
    if (this.#people.some(existing => existing.tenantId === person.tenantId && (
      (person.cpf !== null && existing.cpf === person.cpf) ||
      (person.institutionalId !== null && existing.institutionalId === person.institutionalId)
    ))) return 'conflict';
    this.#people.push(structuredClone(person));
    return 'created';
  }

  async get(tenantId: string, id: string): Promise<Person | null> {
    if (this.#unavailable) throw new Error('Simulated database failure: private connection details');
    return structuredClone(this.#people.find(person => person.tenantId === tenantId && person.id === id) ?? null);
  }

  async find(tenantId: string, identifier: PersonIdentifier): Promise<Person | null> {
    if (this.#unavailable) throw new Error('Simulated database failure: private connection details');
    return structuredClone(this.#people.find(person => person.tenantId === tenantId && (
      'cpf' in identifier ? person.cpf === identifier.cpf : person.institutionalId === identifier.institutionalId
    )) ?? null);
  }

  async search(tenantId: string, filters: PersonSearchFilters, page: number, pageSize: number) {
    if (this.#unavailable) throw new Error('Simulated database failure: private connection details');
    const matching = this.#people.filter(person => person.tenantId === tenantId &&
      (!filters.cpf || person.cpf === filters.cpf) &&
      (!filters.name || person.name.toLocaleLowerCase('pt-BR').includes(filters.name.toLocaleLowerCase('pt-BR'))) &&
      (!filters.birthMunicipality || person.birthMunicipality?.toLocaleLowerCase('pt-BR')
        .includes(filters.birthMunicipality.toLocaleLowerCase('pt-BR'))) &&
      (!filters.birthUf || person.birthUf === filters.birthUf))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR') || left.id.localeCompare(right.id));
    const start = (page - 1) * pageSize;
    return { people: structuredClone(matching.slice(start, start + pageSize)), total: matching.length,
      page, pageSize, totalPages: Math.max(1, Math.ceil(matching.length / pageSize)) };
  }
}
