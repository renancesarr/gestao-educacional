/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Pessoas sem auditoria no MVP — ticket 01', () => {
  it('cadastra pessoa com sucesso sem mostrar ou exigir trilha de auditoria', () => {
    loadSchoolScenario(school => {
      const institutionalId = `sem-auditoria-${Date.now()}`;
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.contains('h3', 'Cadastrar pessoa').parent('form').within(() => {
        cy.get('input[name="name"]').type('Cadastro sem auditoria E2E');
        cy.get('input[name="institutionalId"]').type(institutionalId);
        cy.contains('button', 'Cadastrar pessoa').click();
      });
      cy.contains('[role="status"]', 'Pessoa cadastrada: Cadastro sem auditoria E2E').should('be.visible');
      cy.get('body').should('not.contain', 'Auditoria').and('not.contain', 'audit:read');
      cy.get('[role="alert"]').should('not.exist');
    });
  });
});
