/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Matrícula direta e ciclo — ticket 04', () => {
  it('matricula pessoa existente em curso elegível e opera transições permitidas', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find(item => item.code === 'fund-anos-iniciais');
      if (!course) throw new Error('A fixture não contém o curso fundamental esperado.');
      openInstitutionPeople(scenario.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Matrículas').click();
      cy.get('select[name="personId"] option').then(options => {
        const studentOption = [...options].find(option => option.textContent?.startsWith('Aluno E2E preparado'));
        if (!studentOption) throw new Error('Estado-base inválido: pessoa da fixture ausente para matrícula.');
        cy.get('select[name="personId"]').select((studentOption as HTMLOptionElement).value);
      });
      cy.get('select[name="courseId"]').select(course.id);
      cy.contains('button', 'Matricular').click();
      cy.contains('[role="status"]', 'Matrícula ativa criada para Aluno E2E preparado.').should('be.visible');

      cy.get('select[name="enrollCourse"]').select(course.id);
      cy.contains('button', 'Consultar matrículas').click();
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'ativa');
      cy.get('select[aria-label="Alterar situação de Aluno E2E preparado"]').select('trancada');
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'trancada');
      cy.get('select[aria-label="Alterar situação de Aluno E2E preparado"]').select('ativa');
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'ativa');
      cy.get('select[aria-label="Alterar situação de Aluno E2E preparado"]').select('cancelada');
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'cancelada');
      cy.contains('li', 'Aluno E2E preparado').should('not.contain', 'Alterar situação');
    });
  });
});
