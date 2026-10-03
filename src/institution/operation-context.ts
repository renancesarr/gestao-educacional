export interface InstitutionTargetReader {
  exists(tenantId: string): Promise<boolean>;
}

export interface InstitutionOperationContext {
  readonly actorId: string;
  readonly tenantId: string;
  readonly actorRole: 'SUPER_ADMIN';
}
