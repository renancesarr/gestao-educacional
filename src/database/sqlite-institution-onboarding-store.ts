import type { DatabaseSync } from 'node:sqlite';
import type { InstitutionEducationScopeItem } from '../institution/index.ts';
import type { InstitutionOnboardingStore } from '../super_admin/index.ts';

function scopeCode(item: InstitutionEducationScopeItem): string {
  if (item.level === 'HIGHER') return 'HIGHER_GRADUATION';
  if (item.level === 'TECHNICAL') return 'TECHNICAL_MIDDLE';
  return `BASIC_${item.stage}${item.modality === 'EJA' ? '_EJA' : ''}`;
}

export function createSqliteInstitutionOnboardingStore(database: DatabaseSync): InstitutionOnboardingStore {
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS institution_education_scope_items (
      tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
      scope_code TEXT NOT NULL CHECK (scope_code IN (
        'BASIC_FUNDAMENTAL', 'BASIC_FUNDAMENTAL_EJA', 'BASIC_MEDIO', 'BASIC_MEDIO_EJA', 'TECHNICAL_MIDDLE', 'HIGHER_GRADUATION'
      )),
      PRIMARY KEY (tenant_id, scope_code)
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
    CREATE TABLE IF NOT EXISTS audit_platform_events (
      id TEXT PRIMARY KEY,
      actor_admin_id TEXT,
      system_actor TEXT,
      target_admin_id TEXT,
      target_tenant_id TEXT REFERENCES institution_tenants(id),
      action TEXT NOT NULL CHECK (action IN (
        'platform_admin.provisioned', 'platform_admin.activated', 'platform_admin.authenticated',
        'platform_admin.recovered', 'institution.created', 'person.created'
      )),
      occurred_at TEXT NOT NULL,
      CHECK ((actor_admin_id IS NOT NULL) <> (system_actor IS NOT NULL))
    );
    CREATE INDEX IF NOT EXISTS audit_platform_events_target_tenant
      ON audit_platform_events(target_tenant_id, occurred_at);
  `);

  const scopeDefinition = database.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table'
    AND name = 'institution_education_scope_items'`).get() as { sql: string } | undefined;
  if (scopeDefinition && !scopeDefinition.sql.includes('TECHNICAL_MIDDLE')) {
    database.exec('PRAGMA foreign_keys = OFF');
    try {
      database.exec(`BEGIN IMMEDIATE;
        CREATE TABLE institution_education_scope_items_replacement (
          tenant_id TEXT NOT NULL REFERENCES institution_tenants(id) ON DELETE CASCADE,
          scope_code TEXT NOT NULL CHECK (scope_code IN (
            'BASIC_FUNDAMENTAL', 'BASIC_FUNDAMENTAL_EJA', 'BASIC_MEDIO', 'BASIC_MEDIO_EJA',
            'TECHNICAL_MIDDLE', 'HIGHER_GRADUATION'
          )),
          PRIMARY KEY (tenant_id, scope_code)
        );
        INSERT INTO institution_education_scope_items_replacement (tenant_id, scope_code)
          SELECT tenant_id, scope_code FROM institution_education_scope_items;
        DROP TABLE institution_education_scope_items;
        ALTER TABLE institution_education_scope_items_replacement RENAME TO institution_education_scope_items;`);
      if (database.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Migração do escopo educacional deixou vínculos inválidos.');
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* Keep the original migration failure. */ }
      throw error;
    } finally { database.exec('PRAGMA foreign_keys = ON'); }
  }

  return {
    async create(value) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const duplicate = database.prepare('SELECT 1 FROM institution_tenants WHERE code = ?').get(value.code);
        if (duplicate) {
          database.exec('ROLLBACK');
          return 'duplicate';
        }
        database.prepare(`INSERT INTO institution_tenants (id, code, name, created_at)
          VALUES (?, ?, ?, ?)`)
          .run(value.tenantId, value.code, value.name, value.occurredAt);
        const insertScope = database.prepare(`INSERT INTO institution_education_scope_items (tenant_id, scope_code)
          VALUES (?, ?)`);
        for (const item of value.educationScope) insertScope.run(value.tenantId, scopeCode(item));
        database.prepare(`INSERT INTO identity_accounts
          (id, tenant_id, username, account_context, role, password_hash, active)
          VALUES (?, ?, ?, 'professional', 'TENANT_ADMIN', ?, 1)`)
          .run(value.accountId, value.tenantId, value.username, value.passwordHash);
        database.exec('COMMIT');
        return 'created';
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* Preserve the failure that caused rollback. */ }
        throw error;
      }
    },
  };
}
