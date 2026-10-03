import type { Pool } from 'pg';
import { transaction } from './connection.ts';
import type { InstitutionEducationScopeItem } from '../institution/index.ts';
import type { InstitutionOnboardingStore } from '../super_admin/index.ts';

function scopeCode(item: InstitutionEducationScopeItem): string {
  if (item.level === 'HIGHER') return 'HIGHER_GRADUATION';
  if (item.level === 'TECHNICAL') return 'TECHNICAL_MIDDLE';
  return `BASIC_${item.stage}${item.modality === 'EJA' ? '_EJA' : ''}`;
}

export function postgresInstitutionOnboardingStore(pool: Pool): InstitutionOnboardingStore {
  return {
    async create(value) {
      try {
        await transaction(pool, async client => {
          await client.query('INSERT INTO institution.tenants(id,code,name,created_at) VALUES ($1,$2,$3,$4)',
            [value.tenantId, value.code, value.name, value.occurredAt]);
          for (const item of value.educationScope) {
            await client.query('INSERT INTO institution.education_scope_items(tenant_id,scope_code) VALUES ($1,$2)',
              [value.tenantId, scopeCode(item)]);
          }
          await client.query(`INSERT INTO identity.accounts(id,tenant_id,username,account_context,role,password_hash)
            VALUES ($1,$2,$3,'professional','TENANT_ADMIN',$4)`,
            [value.accountId, value.tenantId, value.username, value.passwordHash]);
        });
        return 'created';
      } catch (error) {
        const postgresError = error as { code?: string; constraint?: string };
        if (postgresError.code === '23505' && postgresError.constraint === 'tenants_code_key') return 'duplicate';
        throw error;
      }
    },
  };
}
