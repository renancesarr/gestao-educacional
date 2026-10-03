/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Catálogos locais no MVP — ticket 01', () => {
  it('consulta a referência INEP local sem oferecer operação e-MEC', () => {
    loginAsSuperAdmin();
    cy.visit('/public-catalog');
    cy.contains('h1', 'Catálogo de escolas do INEP').should('be.visible');
    cy.get('body').should('not.contain', 'e-MEC').and('not.contain', 'eMEC');
    cy.get('input[name="municipality"]').type('Porto Velho');
    cy.get('input[name="state"]').type('RO');
    cy.contains('button', 'Pesquisar').click();
    cy.contains('EEEE ABNAEL MACHADO DE LIMA - CENE').should('be.visible');
  });
});
