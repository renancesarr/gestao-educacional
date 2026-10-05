/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Perfil institucional para documentos — ticket 01', () => {
  it('envia, substitui e remove a marca SVG, atualizando a prontidão do perfil', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Perfil documental').click();
      cy.contains('h2', 'Perfil documental').should('be.visible');
      cy.contains('Configuração documental incompleta').should('be.visible');
      const mark = { contents: Cypress.Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><title>Brasão E2E</title><circle cx="10" cy="10" r="8"/></svg>'),
        fileName: 'brasao-e2e.svg', mimeType: 'image/svg+xml' };
      cy.get('input[type="file"][accept*="image/svg+xml"]').selectFile(mark);
      cy.contains('button', 'Enviar ou substituir marca').click();
      cy.contains('Marca configurada: SVG.').should('be.visible');
      cy.get('img[alt^="Marca de"]').should('be.visible');
      cy.contains('Selo Nacional à esquerda').should('be.visible');
      cy.contains('button', 'Remover marca').click();
      cy.contains('Marca institucional removida.').should('be.visible');
      cy.get('img[alt^="Marca de"]').should('not.exist');
      cy.contains('Configuração documental incompleta').should('be.visible');
      cy.get('input[type="file"][accept*="image/svg+xml"]').selectFile(mark);
      cy.contains('button', 'Enviar ou substituir marca').click();
      cy.request(`/api/platform/institution/document-profile?targetTenantId=${scenario.tenant.id}`)
        .its('body').should('include', { logoConfigured: true, logoMediaType: 'image/svg+xml' });
    });
  });
});
