/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Busca autenticada de alunos — ticket 01', () => {
  it('combina CPF, nome, município/UF de nascimento e curso no tenant selecionado', () => {
    loginAsSuperAdmin();
    loadSchoolScenario((scenario, scenarios) => {
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="cpf"]').last().type('12345678901');
      cy.get('input[name="name"]').last().type('Aluno E2E preparado');
      cy.get('input[name="birthMunicipality"]').last().type('Porto Velho');
      cy.get('input[name="birthUf"]').last().type('RO');
      cy.get('input[name="course"]').type('tec-administracao');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');
      cy.contains('Aluno E2E preparado').should('be.visible');
      cy.contains('Técnico em Administração').should('be.visible');
      cy.contains('button', 'Abrir cadastro').click();
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'Aluno E2E preparado');
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', '12345678901');
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'Porto Velho');
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'tec-administracao');

      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="cpf"]').last().type('12345678901');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');

      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="birthMunicipality"]').last().type('Porto Velho');
      cy.get('input[name="birthUf"]').last().type('RO');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');

      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="course"]').type('tec-administracao');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');

      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="name"]').last().type('Aluno E2E preparado');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');
      cy.contains('button', 'Abrir cadastro').click();
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'Porto Velho · RO');

      cy.visit(`/institutions/${scenarios.higherEducation.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="name"]').last().type('Aluno E2E preparado');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('0 aluno(s) encontrado(s).').should('be.visible');
    });
  });
});
