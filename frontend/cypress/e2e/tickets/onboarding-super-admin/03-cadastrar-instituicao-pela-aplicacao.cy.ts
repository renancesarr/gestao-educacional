/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Cadastro de instituição pelo SUPER_ADMIN — ticket 03', () => {
  it('cria instituição, escopo e administrador em uma operação visível', () => {
    const stamp = Date.now();
    const name = `Instituição E2E ${stamp}`;
    const code = `e2e-inst-${stamp}`;
    loginAsSuperAdmin();
    cy.contains('h2', 'Criar instituição').parent('section').within(() => {
      cy.get('input[name="name"]').type(name);
      cy.get('input[name="code"]').type(code);
      cy.contains('label', 'Ensino Fundamental').find('input[type="checkbox"]').check();
      cy.get('input[name="username"]').type(`admin-e2e-${stamp}`);
      cy.get('input[name="password"]').type('Senha-E2E-Segura-2026!');
      cy.contains('button', 'Criar instituição').click();
    });
    cy.contains('[role="status"]', `${name} criada.`).should('be.visible');
    cy.contains('.created-box a', 'Configurar instituição').click();
    cy.location('pathname').should('match', /^\/institutions\/[0-9a-f-]+$/).then(path => {
      cy.contains('h1', 'Configurar percurso acadêmico').should('be.visible');
      cy.get('.id-line code').should('have.text', path.split('/').at(-1));
    });
  });
});
