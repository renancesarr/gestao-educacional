/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Históricos acadêmicos — ticket 02', () => {
  it('transfere manualmente, consulta, edita e exclui histórico anterior', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      openInstitutionPeople(scenario.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('select[name="studentId"]').last().select('Aluno E2E preparado');
      cy.get('input[name="sourceInstitution"]').type('Escola de Origem');
      cy.get('input[name="courseName"]').type('Ensino Fundamental');
      cy.get('input[name="academicYear"]').last().type('2022');
      cy.get('input[name="period"]').type('2º bimestre');
      cy.get('input[name="subjectName"]').type('História');
      cy.get('input[name="workloadHours"]').type('80');
      cy.get('input[name="gradeOrConcept"]').type('B');
      cy.get('input[name="absenceCount"]').type('3');
      cy.get('input[name="result"]').last().type('Aprovado');
      cy.contains('button', 'Registrar histórico manual').click();
      cy.contains('Histórico transferido registrado para Aluno E2E preparado.').should('be.visible');
      cy.get('form[aria-label="Editar histórico História"] input[name="result"]').clear().type('Recuperação concluída');
      cy.get('form[aria-label="Editar histórico História"]').contains('button', 'Salvar alterações').click();
      cy.contains('Histórico atualizado.').should('be.visible');
      cy.get('form[aria-label="Editar histórico História"] input[name="result"]').should('have.value', 'Recuperação concluída');
      cy.get('form[aria-label="Editar histórico História"]').contains('button', 'Excluir').click();
      cy.contains('Histórico excluído.').should('be.visible');
    });
  });
});
