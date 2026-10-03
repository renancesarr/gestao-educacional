/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Criar curso institucional — ticket 01', () => {
  it('cria curso no tenant-alvo e rejeita duplicidade e escopo incompatível', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.get('input[name="name"]').type('Curso E2E de Fundamentos');
      cy.get('input[name="code"]').type('e2e-fundamentos');
      cy.get('select[name="scope"]').select('0');
      cy.contains('button', 'Criar curso').click();
      cy.contains('Curso criado: e2e-fundamentos · Curso E2E de Fundamentos').should('be.visible');
      cy.contains('Curso E2E de Fundamentos').should('be.visible');
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('li', 'e2e-fundamentos').should('contain', 'Curso E2E de Fundamentos').and('contain', 'ativo');

      cy.get('input[name="name"]').type('Tentativa duplicada');
      cy.get('input[name="code"]').type('e2e-fundamentos');
      cy.contains('button', 'Criar curso').click();
      cy.contains('[role="alert"]', 'Já existe um curso com esse código nesta instituição.').should('be.visible');

      cy.get('input[name="name"]').clear().type('Curso fora do escopo');
      cy.get('input[name="code"]').clear().type('e2e-fora-escopo');
      cy.get('select[name="scope"]').select('5');
      cy.contains('button', 'Criar curso').click();
      cy.get('[role="alert"]').should('be.visible');
      cy.contains('Curso fora do escopo').should('not.exist');
    });
  });
});
