/// <reference types="cypress" />
import { loginAsSuperAdmin } from '../../../support/ticket-login';

describe('e-MEC fora do MVP operacional — ticket 05', () => {
  it('não mostra importação e rejeita a rota operacional removida', () => {
    loginAsSuperAdmin();
    cy.visit('/public-catalog');
    cy.contains('h1', 'Catálogo de escolas do INEP').should('be.visible');
    cy.get('body').should('not.contain', 'e-MEC').and('not.contain', 'eMEC');
    cy.contains('button', /Importar.*e-MEC/i).should('not.exist');
    cy.request({
      method: 'POST',
      url: '/api/platform/public-catalog/emec/preview',
      headers: { Origin: 'http://localhost:3000' },
      failOnStatusCode: false,
    })
      .its('status').should('eq', 404);
  });
});
