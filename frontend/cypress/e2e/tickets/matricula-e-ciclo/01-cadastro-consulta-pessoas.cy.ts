/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Cadastro e consulta de pessoas — ticket 01', () => {
  it('cadastra pessoa e a localiza por identificador na instituição-alvo', () => {
    loadSchoolScenario(school => {
      const stamp = Date.now();
      const name = `Pessoa E2E ${stamp}`;
      const institutionalId = `matricula-e2e-${stamp}`;
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.contains('h3', 'Cadastrar pessoa').parent('form').within(() => {
        cy.get('input[name="name"]').type(name);
        cy.get('input[name="institutionalId"]').type(institutionalId);
        cy.get('input[name="birthMunicipality"]').type('Porto Velho');
        cy.get('input[name="birthUf"]').type('RO');
        cy.contains('button', 'Cadastrar pessoa').click();
      });
      cy.contains('[role="status"]', `Pessoa cadastrada: ${name}`).should('be.visible');
      cy.contains('h3', 'Buscar pessoa por identificador').parent('form').within(() => {
        cy.get('select[name="kind"]').select('institutionalId');
        cy.get('input[name="value"]').type(institutionalId);
        cy.contains('button', 'Buscar', { matchCase: true }).click();
      });
      cy.contains('[role="status"]', `Pessoa encontrada: ${name}`).should('be.visible');
      cy.get('body').should('not.contain', 'Auditoria de pessoas');
    });
  });
});
