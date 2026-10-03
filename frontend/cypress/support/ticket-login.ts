/// <reference types="cypress" />

const authenticationOptions = {
  challenge: 'Y3lwcmVzcy1sb2dpbi1jaGFsbGVuZ2U',
  timeout: 60_000,
  allowCredentials: [],
  userVerification: 'required' as const,
};

export function installVirtualPasskey(win: Window) {
  const bytes = new TextEncoder().encode('fixture-passkey').buffer;
  const responseBytes = new Uint8Array([1, 2, 3]).buffer;
  const credential = {
    id: 'fixture-passkey', rawId: bytes, type: 'public-key', authenticatorAttachment: 'platform',
    getClientExtensionResults: () => ({}),
    response: {
      attestationObject: responseBytes, authenticatorData: responseBytes, clientDataJSON: responseBytes,
      signature: responseBytes, userHandle: null, getTransports: () => ['internal'],
      getPublicKey: () => responseBytes, getPublicKeyAlgorithm: () => -7,
    },
  };
  Object.defineProperty(win.navigator, 'credentials', {
    configurable: true,
    value: { create: async () => credential, get: async () => credential },
  });
}

export function loginAsSuperAdmin() {
  cy.intercept('POST', '/api/platform/login/options', request => request.continue(response => {
    response.body = authenticationOptions;
  })).as('loginOptions');
  cy.intercept('POST', '/api/platform/login/verify').as('loginVerify');
  cy.on('window:before:load', installVirtualPasskey);
  cy.visit('/');
  cy.get('input[name="username"]').type('root-cypress-e2e');
  cy.contains('button', 'Continuar com passkey').click();
  cy.wait('@loginOptions');
  cy.wait('@loginVerify').then(({ response }) => expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(200));
}

export function loginInstitutional(institution: string, username: string, password: string) {
  cy.request({ method: 'POST', url: '/api/session', headers: { Origin: 'http://localhost:3000' },
    body: { institution, username, password } }).its('status').should('eq', 200);
}

type SchoolScenario = {
  tenant: { id: string };
  courses: Array<{ id: string; code: string; name: string; subjects: number }>;
};

type ScenarioSet = {
  school: SchoolScenario;
  higherEducation: { tenant: { id: string } };
};

export function loadSchoolScenario(callback: (scenario: SchoolScenario, scenarios: ScenarioSet) => void) {
  cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => callback(manifest.scenarios.school, manifest.scenarios));
}

export function openInstitutionPeople(tenantId: string) {
  cy.visit(`/institutions/${tenantId}`);
  cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
  cy.get('select[name="kind"]').select('institutionalId');
  cy.get('input[name="value"]').type('aluno-e2e-preparado');
  cy.contains('button', 'Buscar', { matchCase: true }).click();
  cy.contains('Pessoa encontrada: Aluno E2E preparado').should('be.visible');
}
