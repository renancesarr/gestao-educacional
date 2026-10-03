/// <reference types="cypress" />
import { installVirtualPasskey } from '../../../support/ticket-login';

describe('Recuperação local de SUPER_ADMIN — ticket 02', () => {
  it('usa código local de recuperação para cadastrar nova passkey e acessar a plataforma', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.contains('[role="tab"]', 'Ativar conta').click();
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.get('input[name="activationCode"]').type('fixture-recovery-code');
    cy.contains('button', 'Ativar e cadastrar passkey').click();
    cy.contains('Acesso à plataforma autorizado.').should('be.visible');
    cy.contains('h1', 'Configuração institucional').should('be.visible');
    cy.contains('Operador · root-cypress-e2e').should('be.visible');
  });
});
