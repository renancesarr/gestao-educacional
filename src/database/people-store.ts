import type { Pool } from 'pg';
import type { GlobalPeopleStore, PeopleStore, Person, PersonIdentifier, PersonSearchFilters } from '../people/index.ts';
import type { InstitutionTargetReader } from '../institution/index.ts';
import { transaction } from './connection.ts';

interface PersonRow { id: string; tenant_id: string; name: string; cpf: string | null; institutional_id: string | null; birth_municipality: string | null; birth_uf: string | null; created_at: Date }
const person = (row: PersonRow): Person => ({ id: row.id, tenantId: row.tenant_id, name: row.name,
  cpf: row.cpf, institutionalId: row.institutional_id, birthMunicipality: row.birth_municipality,
  birthUf: row.birth_uf, createdAt: row.created_at.toISOString() });
const columns = 'id, tenant_id, name, cpf, institutional_id, birth_municipality, birth_uf, created_at';

export function postgresPeopleStore(pool: Pool): PeopleStore & GlobalPeopleStore & InstitutionTargetReader {
  return {
    async exists(tenantId) {
      return Boolean((await pool.query('SELECT 1 FROM institution.tenants WHERE id=$1', [tenantId])).rows[0]);
    },
    async insert(value) {
      try {
        await pool.query(`INSERT INTO people.people (${columns}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [value.id, value.tenantId, value.name, value.cpf, value.institutionalId, value.birthMunicipality, value.birthUf, value.createdAt]);
        return 'created';
      } catch (error) {
        const pgError = error as { code?: string; constraint?: string };
        if (pgError.code === '23505' && ['people_tenant_cpf_key', 'people_tenant_institutional_key'].includes(pgError.constraint ?? '')) return 'conflict';
        throw error;
      }
    },
    async insertForGlobalOperation(value) {
      try {
        await pool.query(`INSERT INTO people.people (${columns}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [value.id, value.tenantId, value.name, value.cpf, value.institutionalId, value.birthMunicipality, value.birthUf, value.createdAt]);
        return 'created';
      } catch (error) {
        const pgError = error as { code?: string; constraint?: string };
        if (pgError.code === '23505' && ['people_tenant_cpf_key', 'people_tenant_institutional_key'].includes(pgError.constraint ?? '')) return 'conflict';
        throw error;
      }
    },
    async get(tenantId, id) {
      const result = await pool.query<PersonRow>(`SELECT ${columns} FROM people.people WHERE tenant_id=$1 AND id=$2`, [tenantId, id]);
      return result.rows[0] ? person(result.rows[0]) : null;
    },
    async find(tenantId, identifier: PersonIdentifier) {
      const column = 'cpf' in identifier ? 'cpf' : 'institutional_id';
      const value = 'cpf' in identifier ? identifier.cpf : identifier.institutionalId;
      const result = await pool.query<PersonRow>(`SELECT ${columns} FROM people.people WHERE tenant_id=$1 AND ${column}=$2`, [tenantId, value]);
      return result.rows[0] ? person(result.rows[0]) : null;
    },
    async search(tenantId, filters: PersonSearchFilters, page, pageSize) {
      const values: unknown[] = [tenantId];
      const clauses = ['tenant_id=$1'];
      const add = (clause: (parameter: string) => string, value: unknown) => {
        values.push(value);
        clauses.push(clause(`$${values.length}`));
      };
      if (filters.cpf) add(parameter => `cpf=${parameter}`, filters.cpf);
      if (filters.name) add(parameter => `name ILIKE '%' || ${parameter} || '%'`, filters.name);
      if (filters.birthMunicipality) add(parameter => `birth_municipality ILIKE '%' || ${parameter} || '%'`, filters.birthMunicipality);
      if (filters.birthUf) add(parameter => `birth_uf=${parameter}`, filters.birthUf);
      const where = clauses.join(' AND ');
      const count = await pool.query<{ count: string }>(`SELECT count(*)::text AS count FROM people.people WHERE ${where}`, values);
      const pagedValues = [...values, pageSize, (page - 1) * pageSize];
      const result = await pool.query<PersonRow>(`SELECT ${columns} FROM people.people WHERE ${where}
        ORDER BY name, id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, pagedValues);
      const total = Number(count.rows[0]?.count ?? 0);
      return { people: result.rows.map(person), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },
  };
}
