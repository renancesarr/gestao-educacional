/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Contrato de avaliação, nota e frequência — ticket 01', () => {
  it('aceita datas passadas, limita nota e impede duplicar frequência do mesmo dia', () => {
    loadSchoolScenario(school => {
      const course = school.courses.find(item => item.code === 'tec-administracao');
      if (!course) throw new Error('Estado-base inválido: curso técnico ausente.');
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="recordsCourse"]').type(course.id);
      cy.contains('button', 'Carregar curso, matérias e matrículas').click();
      cy.contains('Curso, matérias e matrículas carregados.').should('be.visible');
      cy.get('input[name="title"]').type('Avaliação contrato retroativo');
      cy.get('input[name="occursOn"]').first().type('2024-02-20');
      cy.get('input[name="maxPoints"]').type('10');
      cy.contains('button', 'Criar avaliação').click();
      cy.contains('Avaliação criada: Avaliação contrato retroativo · 2024-02-20').should('be.visible');
      cy.get('select[name="assessmentId"]').select('Avaliação contrato retroativo · máximo 10');
      cy.get('input[name="value"]').type('11');
      cy.contains('button', 'Registrar nota').click();
      cy.contains('[role="alert"]', 'A nota não pode superar a pontuação máxima da avaliação.').should('be.visible');
      cy.get('input[name="value"]').clear().type('10');
      cy.contains('button', 'Registrar nota').click();
      cy.contains('Nota registrada: 10.').should('be.visible');
      cy.get('input[name="occursOn"]').last().type('2024-02-21');
      cy.get('select[name="status"]').select('ausente');
      cy.contains('button', 'Registrar frequência').click();
      cy.contains('Frequência registrada: ausente · 2024-02-21.').should('be.visible');
      cy.get('input[name="occursOn"]').last().type('2024-02-21');
      cy.get('select[name="status"]').select('presente');
      cy.contains('button', 'Registrar frequência').click();
      cy.get('[role="alert"]').should('be.visible');
      cy.contains('2024-02-21 · ausente').should('be.visible');
      cy.get('body').should('not.contain', 'média calculada').and('not.contain', 'aprovado automaticamente');
    });
  });
});
