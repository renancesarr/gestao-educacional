/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Funcionários e responsáveis institucionais — ticket 02', () => {
  it('vincula funcionários administrativos e designa diretor e responsável pelos registros', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      cy.request({ method: 'POST', url: '/api/platform/people', headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, name: 'Diretora de Teste', institutionalId: 'diretora-doc-e2e' } }).then(director => {
        cy.request({ method: 'POST', url: '/api/platform/people', headers: { Origin: 'http://localhost:3000' }, body: {
          targetTenantId: scenario.tenant.id, name: 'Secretário de Registros', institutionalId: 'secretario-doc-e2e' } }).then(records => {
          cy.visit(`/institutions/${scenario.tenant.id}`);
          cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Perfil documental').click();
          cy.get('input[name="personId"]').type(director.body.id);
          cy.contains('button', 'Vincular funcionário administrativo').click();
          cy.contains('Funcionário vinculado.').should('be.visible');
          cy.get('input[name="personId"]').type(records.body.id);
          cy.contains('button', 'Vincular funcionário administrativo').click();
          cy.get('article[aria-label="Funcionário Diretora de Teste"]').should('be.visible');
          cy.get('article[aria-label="Funcionário Secretário de Registros"]').should('be.visible');
          cy.get('select[aria-label="Diretor"]').select('Diretora de Teste');
          cy.get('select[aria-label="Responsável pelos registros acadêmicos"]').select('Secretário de Registros');
          cy.contains('button', 'Salvar responsáveis').click();
          cy.contains('Responsáveis institucionais atualizados.').should('be.visible');
          cy.contains('Diretora de Teste').should('be.visible');
          cy.contains('Secretário de Registros').should('be.visible');
        });
      });
    });
  });
});
