/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Referência local INEP — ticket 01', () => {
  it('localiza escola por nome e município/UF usando a edição já presente no fixture', () => {
    loginAsSuperAdmin();
    cy.visit('/public-catalog');
    cy.get('input[name="name"]').type('ABNAEL MACHADO DE LIMA');
    cy.get('input[name="municipality"]').type('Porto Velho');
    cy.get('input[name="state"]').type('RO');
    cy.contains('button', 'Pesquisar').click();
    cy.contains('EEEE ABNAEL MACHADO DE LIMA - CENE').should('be.visible');
    cy.get('.catalog-results').should('contain', '11000023').and('contain', 'Porto Velho').and('contain', 'RO');
  });
});
