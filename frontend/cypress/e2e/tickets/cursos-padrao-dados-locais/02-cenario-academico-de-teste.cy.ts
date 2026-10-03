/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Cenário acadêmico local — ticket 02', () => {
  it('consulta cursos já preparados da escola e da IES sem criar matrículas', () => {
    loadSchoolScenario((school, scenarios) => {
      cy.readFile('../tests/fixtures/academic-scenario.manifest.json')
        .its('expected.enrollments').should('eq', 0);
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('strong', 'fund-anos-iniciais · Ensino Fundamental — Anos Iniciais (1º ao 5º ano)')
        .should('be.visible');
      cy.contains('strong', 'tec-administracao · Técnico em Administração').should('be.visible');
      cy.visit(`/institutions/${scenarios.higherEducation.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('strong', 'bach-administracao · Bacharelado em Administração').should('be.visible');
      cy.get('nav[aria-label="Etapas do cadastro"]').should('not.contain', 'Matrícula criada');
    });
  });
});
