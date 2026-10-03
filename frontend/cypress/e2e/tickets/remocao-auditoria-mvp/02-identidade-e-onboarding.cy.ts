/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Onboarding sem auditoria no MVP — ticket 02', () => {
  it('cria instituição com dados funcionais sem exigir evento de auditoria', () => {
    const stamp = Date.now();
    const name = `Onboarding sem auditoria ${stamp}`;
    loginAsSuperAdmin();
    cy.contains('h2', 'Criar instituição').parent('section').within(() => {
      cy.get('input[name="name"]').type(name);
      cy.get('input[name="code"]').type(`sem-auditoria-${stamp}`);
      cy.contains('label', 'Ensino Médio').find('input[type="checkbox"]').check();
      cy.get('input[name="username"]').type(`admin-sem-auditoria-${stamp}`);
      cy.get('input[name="password"]').type('Senha-E2E-Onboarding-2026!');
      cy.contains('button', 'Criar instituição').click();
    });
    cy.contains('[role="status"]', `${name} criada.`).should('be.visible');
    cy.get('body').should('not.contain', 'Auditoria').and('not.contain', 'audit:read');
  });
});
