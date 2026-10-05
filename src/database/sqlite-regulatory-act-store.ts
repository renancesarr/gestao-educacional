import type { DatabaseSync } from 'node:sqlite';
import type { RegulatoryAct, RegulatoryActOperation, RegulatoryActStatus, RegulatoryActStore, RegulatoryActTarget } from '../regulatory_acts/index.ts';

interface ActRow { id: string; tenant_id: string; target: RegulatoryActTarget; course_id: string | null }
interface VersionRow { id: string; number: number; text: string; status: RegulatoryActStatus; is_current: number }

function actFromRows(act: ActRow, versions: readonly VersionRow[]): RegulatoryAct {
  const mapped = versions.map(version => ({ id: version.id, number: version.number, text: version.text, status: version.status }));
  const current = versions.find(version => version.is_current === 1);
  if (!current) throw new Error('Ato regulatório sem versão vigente.');
  return { id: act.id, tenantId: act.tenant_id, target: act.target,
    ...(act.course_id ? { courseId: act.course_id } : {}), currentVersionId: current.id,
    versions: mapped, text: current.text, status: current.status };
}

export function createSqliteRegulatoryActStore(database: DatabaseSync): RegulatoryActStore {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS regulatory_acts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id),
      target TEXT NOT NULL CHECK (target IN ('institution', 'course')),
      course_id TEXT,
      CHECK ((target = 'institution' AND course_id IS NULL) OR (target = 'course' AND course_id IS NOT NULL)),
      UNIQUE (tenant_id, id),
      FOREIGN KEY (tenant_id, course_id) REFERENCES academic_courses(tenant_id, id)
    );
    CREATE TABLE IF NOT EXISTS regulatory_act_versions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      act_id TEXT NOT NULL,
      number INTEGER NOT NULL CHECK (number > 0),
      text TEXT NOT NULL CHECK (length(trim(text)) > 0),
      status TEXT NOT NULL CHECK (status IN ('ativo', 'vencido', 'suspenso', 'revogado')),
      is_current INTEGER NOT NULL CHECK (is_current IN (0, 1)),
      UNIQUE (tenant_id, id),
      UNIQUE (tenant_id, act_id, number),
      FOREIGN KEY (tenant_id, act_id) REFERENCES regulatory_acts(tenant_id, id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS regulatory_act_one_current_version
      ON regulatory_act_versions(tenant_id, act_id) WHERE is_current = 1;
    CREATE TABLE IF NOT EXISTS regulatory_act_uses (
      tenant_id TEXT NOT NULL,
      act_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      operation_type TEXT NOT NULL CHECK (operation_type IN ('matricula', 'diploma', 'historico', 'comprovante')),
      operation_id TEXT NOT NULL,
      PRIMARY KEY (tenant_id, operation_type, operation_id, act_id),
      FOREIGN KEY (tenant_id, act_id) REFERENCES regulatory_acts(tenant_id, id) ON DELETE RESTRICT,
      FOREIGN KEY (tenant_id, version_id) REFERENCES regulatory_act_versions(tenant_id, id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS regulatory_acts_tenant_target_course
      ON regulatory_acts(tenant_id, target, course_id);
  `);

  function get(tenantId: string, actId: string): RegulatoryAct | null {
    const act = database.prepare(`SELECT id, tenant_id, target, course_id FROM regulatory_acts
      WHERE tenant_id = ? AND id = ?`).get(tenantId, actId) as ActRow | undefined;
    if (!act) return null;
    const versions = database.prepare(`SELECT id, number, text, status, is_current FROM regulatory_act_versions
      WHERE tenant_id = ? AND act_id = ? ORDER BY number`).all(tenantId, actId) as unknown as VersionRow[];
    return actFromRows(act, versions);
  }

  return {
    async create(act) {
      database.exec('BEGIN IMMEDIATE');
      try {
        database.prepare(`INSERT INTO regulatory_acts (id, tenant_id, target, course_id) VALUES (?, ?, ?, ?)`)
          .run(act.id, act.tenantId, act.target, act.courseId ?? null);
        const insertVersion = database.prepare(`INSERT INTO regulatory_act_versions
          (id, tenant_id, act_id, number, text, status, is_current) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        for (const version of act.versions) insertVersion.run(version.id, act.tenantId, act.id, version.number,
          version.text, version.status, Number(version.id === act.currentVersionId));
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Keep the original persistence error. */ }
        throw error;
      }
    },

    async list(tenantId, filter) {
      const clauses = ['tenant_id = ?'];
      const parameters: string[] = [tenantId];
      if (filter.target) { clauses.push('target = ?'); parameters.push(filter.target); }
      if (filter.courseId) { clauses.push('course_id = ?'); parameters.push(filter.courseId); }
      const acts = database.prepare(`SELECT id, tenant_id, target, course_id FROM regulatory_acts
        WHERE ${clauses.join(' AND ')} ORDER BY target, course_id, id`).all(...parameters) as unknown as ActRow[];
      return acts.map(act => get(tenantId, act.id)!);
    },

    async get(tenantId, actId) { return get(tenantId, actId); },

    async update(tenantId, actId, change) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const current = database.prepare(`SELECT id, number, text, status FROM regulatory_act_versions
          WHERE tenant_id = ? AND act_id = ? AND is_current = 1`).get(tenantId, actId) as
          { id: string; number: number; text: string; status: RegulatoryActStatus } | undefined;
        if (!current) { database.exec('ROLLBACK'); return null; }
        const text = change.text ?? current.text;
        const status = change.status ?? current.status;
        if (change.preservePreviousVersion) {
          database.prepare(`UPDATE regulatory_act_versions SET is_current = 0 WHERE tenant_id = ? AND act_id = ? AND is_current = 1`)
            .run(tenantId, actId);
          database.prepare(`INSERT INTO regulatory_act_versions
            (id, tenant_id, act_id, number, text, status, is_current) VALUES (?, ?, ?, ?, ?, ?, 1)`)
            .run(change.newVersionId, tenantId, actId, current.number + 1, text, status);
        } else {
          database.prepare(`UPDATE regulatory_act_versions SET text = ?, status = ?
            WHERE tenant_id = ? AND act_id = ? AND id = ?`).run(text, status, tenantId, actId, current.id);
        }
        database.exec('COMMIT');
        return get(tenantId, actId);
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Keep the original persistence error. */ }
        throw error;
      }
    },

    async registerUse(tenantId, actId, versionId, operation) {
      const version = database.prepare(`SELECT 1 FROM regulatory_act_versions
        WHERE tenant_id = ? AND act_id = ? AND id = ?`).get(tenantId, actId, versionId);
      if (!version) return false;
      database.prepare(`INSERT OR IGNORE INTO regulatory_act_uses
        (tenant_id, act_id, version_id, operation_type, operation_id) VALUES (?, ?, ?, ?, ?)`)
        .run(tenantId, actId, versionId, operation.operationType, operation.operationId);
      return true;
    },

    async delete(tenantId, actId) {
      const existing = database.prepare(`SELECT 1 FROM regulatory_acts WHERE tenant_id = ? AND id = ?`).get(tenantId, actId);
      if (!existing) return 'missing';
      const used = database.prepare(`SELECT 1 FROM regulatory_act_uses WHERE tenant_id = ? AND act_id = ? LIMIT 1`).get(tenantId, actId);
      if (used) return 'used';
      database.prepare(`DELETE FROM regulatory_acts WHERE tenant_id = ? AND id = ?`).run(tenantId, actId);
      return 'deleted';
    },
  };
}
