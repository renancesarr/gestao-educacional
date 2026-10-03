import { randomBytes, randomUUID } from 'node:crypto';
import { createIdentityService, createPlatformIdentityService, hashPassword } from '../../src/identity/index.ts';
import { createGlobalPeopleService, createPeopleService } from '../../src/people/index.ts';
import { createAcademicService } from '../../src/academic/index.ts';
import { createGlobalStudentSearchService } from '../../src/people/student-search.ts';
import { createPublicStudentSearchService } from '../../src/people/public-student-search.ts';
import { createInstitutionOperationContextService, createSuperAdminService } from '../../src/super_admin/index.ts';
import { createPublicCatalogService } from '../../src/public_catalog/index.ts';
import { MemoryPeopleStore } from './memory-people-store.ts';
import { MemoryIdentityStore } from './memory-identity-store.ts';
import { MemoryPlatformIdentityStore } from './memory-platform-identity-store.ts';
import { MemoryInstitutionOnboardingStore } from './memory-institution-onboarding-store.ts';
import { MemoryInstitutionTargetStore } from './memory-institution-target-store.ts';
import { MemoryAcademicStore } from './memory-academic-store.ts';
import { MemoryPublicCatalogStore } from './memory-public-catalog-store.ts';
import { createEmecCatalogService } from '../../src/public_catalog/emec-catalog.ts';
import { MemoryEmecCatalogStore } from './memory-emec-catalog-store.ts';
import { createCredentialService } from '../../src/credential/index.ts';
import { MemoryCredentialStore } from './memory-credential-store.ts';
import { createAcademicHistoryService } from '../../src/academic/history.ts';
import { MemoryAcademicHistoryStore } from './memory-academic-history-store.ts';

export async function fixtureServices() {
  const passwordHash = await hashPassword('senha-ficticia-longa');
  const accounts = [
    { id: '00000000-0000-4000-8000-000000000001', tenantId: '00000000-0000-4000-8000-000000000010',
      institution: 'escola-ficticia', institutionName: 'Escola Fictícia · demonstração', role: 'TENANT_ADMIN' as const },
    { id: '00000000-0000-4000-8000-000000000002', tenantId: '00000000-0000-4000-8000-000000000020',
      institution: 'outra-escola', institutionName: 'Outra Escola · demonstração', role: 'TENANT_ADMIN' as const },
    { id: '00000000-0000-4000-8000-000000000003', tenantId: '00000000-0000-4000-8000-000000000010',
      institution: 'escola-ficticia', institutionName: 'Escola Fictícia · demonstração', role: 'VIEWER' as const },
  ].map(account => ({ ...account, username: account.role === 'VIEWER' ? 'consulta' : 'operador', passwordHash, active: true, accountContext: 'professional' as const }));
  const store = new MemoryPeopleStore();
  const platformIdentityStore = new MemoryPlatformIdentityStore();
  const institutionStore = new MemoryInstitutionOnboardingStore();
  const targetStore = new MemoryInstitutionTargetStore(accounts.map(account => account.tenantId));
  const globalPeople = createGlobalPeopleService({ store, now: () => new Date(), newId: randomUUID });
  const globalAcademic = createAcademicService({ store: new MemoryAcademicStore({ tenantId: accounts[0]!.tenantId,
    educationScope: [{ level: 'BASIC', stage: 'FUNDAMENTAL' }] }), people: globalPeople, now: () => new Date(), newId: randomUUID });
  const credentialStore = new MemoryCredentialStore();
  const credentials = createCredentialService({ store: credentialStore, now: () => new Date(), newId: randomUUID,
    newToken: () => randomBytes(32).toString('base64url'), students: globalPeople,
    courses: { get: async (context, courseId) => {
      const course = await globalAcademic.getCourseDetail(context, courseId);
      return { id: course.id, tenantId: course.tenantId, name: course.name, institutionName: 'Escola Fictícia · demonstração' };
    } },
  });
  const academicHistory = createAcademicHistoryService({ store: new MemoryAcademicHistoryStore(), students: globalPeople,
    now: () => new Date(), newId: randomUUID });
  return {
    identity: createIdentityService({ store: new MemoryIdentityStore(accounts), now: () => new Date(), newToken: () => randomBytes(32).toString('hex') }),
    platformIdentityStore,
    platformIdentity: createPlatformIdentityService({ store: platformIdentityStore, now: () => new Date(),
      newId: randomUUID, newActivationCode: () => 'fixture-one-time-activation-code',
      newCeremonyToken: () => randomBytes(32).toString('base64url'), newLoginToken: () => randomBytes(32).toString('base64url'),
      newToken: () => randomBytes(32).toString('base64url'), newRecoveryCode: () => 'fixture-recovery-code', webAuthn: {
        registrationOptions: async () => ({ challenge: 'Zml4dHVyZS1yZWdpc3RyYXRpb24tY2hhbGxlbmdl',
          rp: { name: 'Gestão Educacional', id: 'localhost' },
          user: { id: 'Zml4dHVyZS1hZG1pbg', name: 'root-cypress-e2e', displayName: 'root-cypress-e2e' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }], timeout: 60_000, attestation: 'none',
          authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' } } as never),
        verifyRegistration: async () => ({ verified: true, userVerified: true,
          credential: { id: 'fixture-passkey', publicKey: new Uint8Array([1]), counter: 0 } }),
        authenticationOptions: async () => ({ challenge: 'fixture-login-challenge', userVerification: 'required' } as never),
        verifyAuthentication: async () => ({ verified: true, userVerified: true, newCounter: 1 }),
      } }),
    institutionStore,
    superAdmin: createSuperAdminService({ store: institutionStore, now: () => new Date(), newId: randomUUID }),
    institutionOperationContext: createInstitutionOperationContextService({ targets: targetStore }),
    publicCatalog: createPublicCatalogService({ store: new MemoryPublicCatalogStore(), now: () => new Date(), newId: randomUUID }),
    credentials,
    academicHistory,
    emecCatalog: createEmecCatalogService({ store: new MemoryEmecCatalogStore(), newId: randomUUID }),
    people: createPeopleService({ store, now: () => new Date(), newId: randomUUID }),
    globalPeople,
    globalAcademic,
    globalStudentSearch: createGlobalStudentSearchService({ people: globalPeople, academic: globalAcademic }),
    publicStudentSearch: createPublicStudentSearchService({ store: { search: async () => ({ students: [], total: 0 }) } }),
  };
}
