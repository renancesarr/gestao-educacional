/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Catálogo local de escolas — ticket 01', () => {
  it('consulta a escola do fixture INEP sem reenviar CSV ou alterar a base', () => {
    loginAsSuperAdmin();
    cy.visit('/public-catalog');
    cy.contains('h2', 'Consultar versão vigente').should('be.visible');
    cy.get('input[name="sourceId"]').type('11000023');
    cy.contains('button', 'Pesquisar').click();
    cy.contains('EEEE ABNAEL MACHADO DE LIMA - CENE').should('be.visible');
    cy.get('.catalog-results').should('contain', '11000023').and('contain', 'Porto Velho').and('contain', 'RO');
    cy.get('input[name="file"]').should('have.value', '');
  });
});
