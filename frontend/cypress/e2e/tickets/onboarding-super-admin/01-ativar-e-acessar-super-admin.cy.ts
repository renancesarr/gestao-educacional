/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Acesso de SUPER_ADMIN — ticket 01', () => {
  it('autentica a conta-base ativada e abre as operações de plataforma', () => {
    loginAsSuperAdmin();
    cy.contains('h1', 'Configuração institucional').should('be.visible');
    cy.contains('Operador · root-cypress-e2e').should('be.visible');
    cy.contains('h2', 'Criar instituição').should('be.visible');
    cy.contains('h2', 'Abrir instituição existente').should('be.visible');
  });
});
