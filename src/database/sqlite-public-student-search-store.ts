import type { DatabaseSync } from 'node:sqlite';

interface PublicSearchFilters { cpf?: string; name?: string; birthMunicipality?: string; birthUf?: string; course?: string }

function escapeLike(value: string): string { return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_'); }

export function createSqlitePublicStudentSearchStore(database: DatabaseSync) {
  function query(filters: PublicSearchFilters) {
    const where: string[] = ["e.status = 'ativa'", 'c.active = 1'];
    const values: string[] = [];
    if (filters.cpf) { where.push('p.cpf = ?'); values.push(filters.cpf); }
    if (filters.name) { where.push("p.name LIKE ? ESCAPE '\\' COLLATE NOCASE"); values.push(`%${escapeLike(filters.name)}%`); }
    if (filters.birthMunicipality) { where.push("p.birth_municipality LIKE ? ESCAPE '\\' COLLATE NOCASE"); values.push(`%${escapeLike(filters.birthMunicipality)}%`); }
    if (filters.birthUf) { where.push('p.birth_uf = ?'); values.push(filters.birthUf); }
    if (filters.course) {
      where.push("(c.name LIKE ? ESCAPE '\\' COLLATE NOCASE OR c.code LIKE ? ESCAPE '\\' COLLATE NOCASE)");
      values.push(`%${escapeLike(filters.course)}%`, `%${escapeLike(filters.course)}%`);
    }
    return { sql: where.join(' AND '), values };
  }
  return {
    async search(filters: PublicSearchFilters, pagination: { page: number; pageSize: number }) {
      const condition = query(filters);
      const joins = `FROM people_people p
        JOIN academic_enrollments e ON e.tenant_id = p.tenant_id AND e.person_id = p.id
        JOIN academic_courses c ON c.tenant_id = e.tenant_id AND c.id = e.course_id
        JOIN institution_tenants t ON t.id = p.tenant_id WHERE ${condition.sql}`;
      const total = (database.prepare(`SELECT count(*) AS total ${joins}`).get(...condition.values) as { total: number }).total;
      const rows = database.prepare(`SELECT p.name, c.name AS course_name, t.name AS institution_name ${joins}
        ORDER BY p.name COLLATE NOCASE, c.name COLLATE NOCASE, t.name COLLATE NOCASE
        LIMIT ? OFFSET ?`).all(...condition.values, pagination.pageSize, (pagination.page - 1) * pagination.pageSize) as unknown as
        { name: string; course_name: string; institution_name: string }[];
      return { students: rows.map(row => ({ name: row.name, courseName: row.course_name, institutionName: row.institution_name })), total };
    },
  };
}
