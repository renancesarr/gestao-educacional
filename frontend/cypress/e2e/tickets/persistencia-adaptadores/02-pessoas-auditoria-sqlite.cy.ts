/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, loginInstitutional } from '../../../support/ticket-login';

describe('Persistência SQLite de pessoas sem auditoria — ticket 02', () => {
  it('recupera pessoa após recarregar e mantém indisponível a rota de auditoria', () => {
    return loadSchoolScenario(school => {
      const institutionalId = `sqlite-pessoa-${Date.now()}`;
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.contains('h3', 'Cadastrar pessoa').parent('form').within(() => {
        cy.get('input[name="name"]').type('Pessoa SQLite E2E');
        cy.get('input[name="institutionalId"]').type(institutionalId);
        cy.contains('button', 'Cadastrar pessoa').click();
      });
      cy.contains('[role="status"]', 'Pessoa cadastrada: Pessoa SQLite E2E').invoke('text').then(message => {
        const personId = message.split('·').at(-1)?.trim();
        expect(personId).to.match(/^[0-9a-f-]{36}$/);
        cy.reload();
        cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
        cy.contains('h3', 'Buscar pessoa por identificador').parent('form').within(() => {
          cy.get('select[name="kind"]').select('institutionalId');
          cy.get('input[name="value"]').type(institutionalId);
          cy.contains('button', 'Buscar', { matchCase: true }).click();
        });
        cy.contains('[role="status"]', 'Pessoa encontrada: Pessoa SQLite E2E').should('be.visible');
        loginInstitutional('fixture-escola-local', 'fixture-admin', 'fixture-only-password-123');
        cy.request({ url: `/api/people/${personId}/audit`, failOnStatusCode: false }).its('status').should('eq', 404);
        cy.request(`/api/people/${personId}`).its('status').should('eq', 200);
        cy.get('body').should('not.contain', 'Auditoria de pessoas');
      });
    });
  });
});
