/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Jornada acadêmica com estado-base — ticket 03', () => {
  it('usa o cenário já preparado e não repete cadastro de instituição ou curso', () => {
    loadSchoolScenario(school => {
      const course = school.courses.find(item => item.code === 'tec-administracao');
      if (!course || course.subjects < 1) throw new Error('Estado-base inválido: curso técnico ou matéria ausente.');
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="recordsCourse"]').type(course.id);
      cy.contains('button', 'Carregar curso, matérias e matrículas').click();
      cy.contains('Curso, matérias e matrículas carregados.').should('be.visible');
      cy.get('select[aria-label="Matéria"]').should('contain', 'Gestão');
      cy.get('select[aria-label="Matrícula"]').should('contain', 'Aluno E2E preparado');
      cy.get('nav[aria-label="Etapas do cadastro"]').should('not.contain', 'Criar instituição');
      cy.get('h3').should('not.contain', 'Novo curso');
    });
  });
});
