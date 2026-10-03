import type { DatabaseSync } from 'node:sqlite';
import type { GlobalPeopleStore, PeopleStore, Person, PersonIdentifier, PersonSearchFilters } from '../people/index.ts';
import type { InstitutionTargetReader } from '../institution/index.ts';

interface PersonRow {
  id: string;
  tenant_id: string;
  name: string;
  cpf: string | null;
  institutional_id: string | null;
  birth_municipality: string | null;
  birth_uf: string | null;
  created_at: string;
}

const person = (row: PersonRow): Person => ({ id: row.id, tenantId: row.tenant_id,
  name: row.name, cpf: row.cpf, institutionalId: row.institutional_id,
  birthMunicipality: row.birth_municipality, birthUf: row.birth_uf,
  createdAt: row.created_at });
const personColumns = 'id, tenant_id, name, cpf, institutional_id, birth_municipality, birth_uf, created_at';

export function createSqlitePeopleStore(database: DatabaseSync): PeopleStore & GlobalPeopleStore & InstitutionTargetReader {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS people_people (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
      cpf TEXT CHECK (cpf IS NULL OR (length(cpf) = 11 AND cpf NOT GLOB '*[^0-9]*')),
      institutional_id TEXT CHECK (institutional_id IS NULL OR length(trim(institutional_id)) BETWEEN 1 AND 100),
      birth_municipality TEXT CHECK (birth_municipality IS NULL OR length(trim(birth_municipality)) BETWEEN 1 AND 120),
      birth_uf TEXT CHECK (birth_uf IS NULL OR birth_uf GLOB '[A-Z][A-Z]'),
      created_at TEXT NOT NULL,
      CHECK (cpf IS NOT NULL OR institutional_id IS NOT NULL),
      CHECK ((birth_municipality IS NULL AND birth_uf IS NULL) OR
        (length(trim(birth_municipality)) BETWEEN 1 AND 120 AND birth_uf GLOB '[A-Z][A-Z]')),
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, cpf),
      UNIQUE (tenant_id, institutional_id)
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      actor_id TEXT,
      system_actor TEXT,
      person_id TEXT,
      action TEXT NOT NULL CHECK (action IN ('person.created', 'institution.created', 'account.created')),
      occurred_at TEXT NOT NULL,
      CHECK ((actor_id IS NOT NULL) <> (system_actor IS NOT NULL)),
      CHECK ((action = 'person.created') = (person_id IS NOT NULL)),
      CHECK (action <> 'person.created' OR actor_id IS NOT NULL OR system_actor GLOB 'platform-admin:*'),
      FOREIGN KEY (tenant_id, actor_id) REFERENCES identity_accounts(tenant_id, id),
      FOREIGN KEY (tenant_id, person_id) REFERENCES people_people(tenant_id, id)
    );
    CREATE INDEX IF NOT EXISTS audit_events_person
      ON audit_events(tenant_id, person_id, occurred_at, id);
  `);

  return {
    async exists(tenantId) {
      return Boolean(database.prepare('SELECT 1 FROM institution_tenants WHERE id = ?').get(tenantId));
    },
    async insert(value) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const duplicateByCpf = value.cpf !== null && database
          .prepare('SELECT 1 FROM people_people WHERE tenant_id = ? AND cpf = ?')
          .get(value.tenantId, value.cpf);
        const duplicateByInstitutionalId = value.institutionalId !== null && database
          .prepare('SELECT 1 FROM people_people WHERE tenant_id = ? AND institutional_id = ?')
          .get(value.tenantId, value.institutionalId);
        const duplicate = duplicateByCpf || duplicateByInstitutionalId;
        if (duplicate) {
          database.exec('ROLLBACK');
          return 'conflict';
        }
        database.prepare(`INSERT INTO people_people (${personColumns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(value.id, value.tenantId, value.name, value.cpf, value.institutionalId, value.birthMunicipality, value.birthUf, value.createdAt);
        database.exec('COMMIT');
        return 'created';
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve the failure that caused rollback. */ }
        throw error;
      }
    },
    async insertForGlobalOperation(value) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const duplicateByCpf = value.cpf !== null && database
          .prepare('SELECT 1 FROM people_people WHERE tenant_id = ? AND cpf = ?')
          .get(value.tenantId, value.cpf);
        const duplicateByInstitutionalId = value.institutionalId !== null && database
          .prepare('SELECT 1 FROM people_people WHERE tenant_id = ? AND institutional_id = ?')
          .get(value.tenantId, value.institutionalId);
        if (duplicateByCpf || duplicateByInstitutionalId) {
          database.exec('ROLLBACK');
          return 'conflict';
        }
        database.prepare(`INSERT INTO people_people (${personColumns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(value.id, value.tenantId, value.name, value.cpf, value.institutionalId, value.birthMunicipality, value.birthUf, value.createdAt);
        database.exec('COMMIT');
        return 'created';
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve the failure that caused rollback. */ }
        throw error;
      }
    },
    async get(tenantId, id) {
      const row = database.prepare(`SELECT ${personColumns} FROM people_people WHERE tenant_id = ? AND id = ?`)
        .get(tenantId, id) as PersonRow | undefined;
      return row ? person(row) : null;
    },
    async find(tenantId, identifier: PersonIdentifier) {
      const column = 'cpf' in identifier ? 'cpf' : 'institutional_id';
      const value = 'cpf' in identifier ? identifier.cpf : identifier.institutionalId;
      const row = database.prepare(`SELECT ${personColumns} FROM people_people WHERE tenant_id = ? AND ${column} = ?`)
        .get(tenantId, value) as PersonRow | undefined;
      return row ? person(row) : null;
    },
    async search(tenantId, filters: PersonSearchFilters, page, pageSize) {
      const clauses = ['tenant_id = ?'];
      const values: Array<string | number> = [tenantId];
      const add = (clause: string, value: string) => { clauses.push(clause); values.push(value); };
      const escapedLike = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;
      if (filters.cpf) add('cpf = ?', filters.cpf);
      if (filters.name) add("name LIKE ? ESCAPE '\\' COLLATE NOCASE", escapedLike(filters.name));
      if (filters.birthMunicipality) add("birth_municipality LIKE ? ESCAPE '\\' COLLATE NOCASE", escapedLike(filters.birthMunicipality));
      if (filters.birthUf) add('birth_uf = ?', filters.birthUf);
      const where = clauses.join(' AND ');
      const total = (database.prepare(`SELECT count(*) AS count FROM people_people WHERE ${where}`)
        .get(...values) as { count: number }).count;
      const rows = database.prepare(`SELECT ${personColumns} FROM people_people WHERE ${where}
        ORDER BY name, id LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize) as unknown as PersonRow[];
      return { people: rows.map(person), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },
  };
}
