import { requirePermission, type Principal } from '../identity/index.ts';
import type { InstitutionOperationContext } from '../institution/index.ts';
import { readOrWrite } from '../shared/errors.ts';

export interface PersonCreated {
  readonly tenantId: string;
  readonly actorId: string;
  readonly personId: string;
  readonly action: 'person.created';
  readonly occurredAt: string;
}

export interface PlatformPersonCreated {
  readonly id: string;
  readonly actor: string;
  readonly targetTenantId: string;
  readonly action: 'person.created';
  readonly occurredAt: string;
}


export interface AuditReader {
  forPerson(tenantId: string, personId: string): Promise<readonly PersonCreated[]>;
}

export interface GlobalAuditReader extends AuditReader {
  forTarget(tenantId: string): Promise<readonly PlatformPersonCreated[]>;
}

export function createAuditService(reader: AuditReader) {
  return {
    async forPerson(principal: Principal, personId: string): Promise<readonly PersonCreated[]> {
      requirePermission(principal, 'audit:read');
      return readOrWrite(() => reader.forPerson(principal.tenantId, personId));
    },
  };
}

export function createGlobalAuditService(reader: GlobalAuditReader) {
  return {
    async forPerson(context: InstitutionOperationContext, personId: string): Promise<readonly PersonCreated[]> {
      return readOrWrite(() => reader.forPerson(context.tenantId, personId));
    },
    async forTarget(context: InstitutionOperationContext): Promise<readonly PlatformPersonCreated[]> {
      return readOrWrite(() => reader.forTarget(context.tenantId));
    },
  };
}
