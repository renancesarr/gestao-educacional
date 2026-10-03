/// <reference types="cypress" />

describe('Sessão institucional local — ticket 01', () => {
  it('autentica a conta da fixture SQLite, persiste a sessão e revoga no logout', () => {
    cy.visit('/');
    cy.contains('h2', 'Acesso da plataforma').should('be.visible');
    cy.request({
      method: 'POST',
      url: '/api/session',
      headers: { Origin: 'http://localhost:3000' },
      body: { institution: 'fixture-escola-local', username: 'fixture-admin', password: 'fixture-only-password-123' },
    }).its('status').should('eq', 200);
    cy.request('/api/session').its('status').should('eq', 200);
    cy.request({ method: 'DELETE', url: '/api/session', headers: { Origin: 'http://localhost:3000' } })
      .its('status').should('eq', 204);
    cy.request({ url: '/api/session', failOnStatusCode: false }).its('status').should('eq', 401);
    cy.contains('Acesso da plataforma').should('be.visible');
  });
});
