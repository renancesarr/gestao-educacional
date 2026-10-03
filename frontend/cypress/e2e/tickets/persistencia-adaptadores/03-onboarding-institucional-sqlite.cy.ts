/// <reference types="cypress" />
import { loginAsSuperAdmin, loginInstitutional } from '../../../support/ticket-login';

describe('Onboarding SQLite de instituição — ticket 03', () => {
  it('persiste tenant, escopo e primeiro TENANT_ADMIN utilizável', () => {
    const stamp = Date.now();
    const name = `Persistência SQLite ${stamp}`;
    const code = `sqlite-onboarding-${stamp}`;
    const username = `sqlite-admin-${stamp}`;
    const password = 'Senha-SQLite-Onboarding-2026!';
    loginAsSuperAdmin();
    cy.contains('h2', 'Criar instituição').parent('section').within(() => {
      cy.get('input[name="name"]').type(name);
      cy.get('input[name="code"]').type(code);
      cy.contains('label', 'Ensino Fundamental').find('input[type="checkbox"]').check();
      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.contains('button', 'Criar instituição').click();
    });
    cy.contains('[role="status"]', `${name} criada.`).should('be.visible');
    cy.get('.created-box code').invoke('text').then(tenantId => {
      expect(tenantId.trim()).to.match(/^[0-9a-f-]{36}$/);
      loginInstitutional(code, username, password);
      cy.request('/api/session').its('body').should('include', {
        tenantId: tenantId.trim(), username, role: 'TENANT_ADMIN',
      });
      cy.visit(`/institutions/${tenantId.trim()}`);
      cy.contains('h1', 'Configurar percurso acadêmico').should('be.visible');
    });
  });
});
