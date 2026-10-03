/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Contrato de histórico acadêmico — ticket 01', () => {
  it('registra fato acadêmico antigo com curso de origem livre, sem matrícula atual', () => {
    loadSchoolScenario(school => {
      loginAsSuperAdmin();
      openInstitutionPeople(school.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('select[name="studentId"]').last().select('Aluno E2E preparado');
      cy.get('input[name="sourceInstitution"]').type('Escola de Origem Desativada');
      cy.get('input[name="courseName"]').type('Curso antigo sem código atual');
      cy.get('input[name="academicYear"]').last().type('2018');
      cy.get('input[name="period"]').type('2º semestre');
      cy.get('input[name="subjectName"]').type('Componente histórico');
      cy.get('input[name="workloadHours"]').type('64');
      cy.get('input[name="gradeOrConcept"]').type('7,5');
      cy.get('input[name="absenceCount"]').type('4');
      cy.get('input[name="result"]').last().type('Concluído');
      cy.contains('button', 'Registrar histórico manual').click();
      cy.contains('Histórico transferido registrado para Aluno E2E preparado.').should('be.visible');
      cy.get('form[aria-label="Editar histórico Componente histórico"]').within(() => {
        cy.get('input[name="academicYear"]').should('have.value', '2018');
        cy.get('input[name="courseName"]').should('have.value', 'Curso antigo sem código atual');
      });
      cy.get('body').should('not.contain', 'documento oficial');
    });
  });
});
