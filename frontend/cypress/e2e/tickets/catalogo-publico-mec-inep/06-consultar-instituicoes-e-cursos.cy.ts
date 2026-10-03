/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Consultar referências locais — ticket 06', () => {
  it('consulta escola local por município/UF sem expor fluxo e-MEC', () => {
    loginAsSuperAdmin();
    cy.visit('/public-catalog');
    cy.get('input[name="municipality"]').type('Porto Velho');
    cy.get('input[name="state"]').type('RO');
    cy.contains('button', 'Pesquisar').click();
    cy.contains('EEEE ABNAEL MACHADO DE LIMA - CENE').should('be.visible');
    cy.get('.catalog-results').should('contain', '11000023').and('contain', 'Porto Velho').and('contain', 'RO');
    cy.get('body').should('not.contain', 'e-MEC');
  });
});
