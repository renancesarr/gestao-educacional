/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Assinatura, carimbo e prontidão documental — ticket 03', () => {
  it('salva assinatura PNG, gera o carimbo e sinaliza a instituição pronta para emissão', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      cy.request({ method: 'POST', url: '/api/platform/people', headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, name: 'Responsável Documental', institutionalId: 'responsavel-doc-e2e' } }).then(person => {
        cy.request({ method: 'POST', url: '/api/platform/institution/employees', headers: { Origin: 'http://localhost:3000' },
          body: { targetTenantId: scenario.tenant.id, personId: person.body.id } }).then(employee => {
          cy.request({ method: 'PUT', url: `/api/platform/institution/document-profile/positions?targetTenantId=${scenario.tenant.id}`,
            headers: { Origin: 'http://localhost:3000' }, body: { targetTenantId: scenario.tenant.id,
              directorEmployeeId: employee.body.id, recordsOfficerEmployeeId: employee.body.id } });
          cy.request({ method: 'PUT', url: `/api/platform/institution/document-profile/logo?targetTenantId=${scenario.tenant.id}`,
            headers: { Origin: 'http://localhost:3000', 'Content-Type': 'image/svg+xml' },
            body: '<svg xmlns="http://www.w3.org/2000/svg"><title>Marca</title></svg>', encoding: 'binary' });
          cy.visit(`/institutions/${scenario.tenant.id}`);
          cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Perfil documental').click();
          cy.get('article[aria-label="Funcionário Responsável Documental"] input[name="signature"]').selectFile({
            contents: Cypress.Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64'),
            fileName: 'assinatura.png', mimeType: 'image/png',
          });
          cy.contains('button', 'Enviar assinatura PNG').click();
          cy.contains('Assinatura PNG salva no perfil do funcionário.').should('be.visible');
          cy.get('article[aria-label="Funcionário Responsável Documental"]').contains('button', 'Gerar e salvar carimbo PNG').click();
          cy.contains('Carimbo PNG salvo no perfil do funcionário.').should('be.visible');
          cy.contains('Pronta para emissão de documentos').should('be.visible');
          cy.contains('somente representativa').should('be.visible');
          cy.request(`/api/platform/institution/document-profile?targetTenantId=${scenario.tenant.id}`)
            .its('body.readiness').should('deep.equal', { ready: true, missing: [] });
        });
      });
    });
  });
});
