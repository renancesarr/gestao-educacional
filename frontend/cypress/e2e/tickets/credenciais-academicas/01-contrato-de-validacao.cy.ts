/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Contrato de edição e exclusão de credencial — ticket 01', () => {
  it('invalida o token antigo ao editar e retorna 404 após exclusão', () => {
    loadSchoolScenario(school => {
      const course = school.courses.find(item => item.code === 'tec-administracao');
      if (!course) throw new Error('Estado-base inválido: curso técnico ausente.');
      loginAsSuperAdmin();
      openInstitutionPeople(school.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="courseId"]').type(course.id);
      cy.get('select[name="studentId"]').first().select('Aluno E2E preparado');
      cy.get('select[name="type"]').select('diploma');
      cy.get('input[name="issuedOn"]').type('2023-12-20');
      cy.contains('button', 'Emitir credencial').click();
      cy.contains('Credencial emitida para Aluno E2E preparado').should('be.visible');
      cy.get('a').contains('Validar').invoke('attr', 'href').then(oldUrl => {
        const oldPath = new URL(String(oldUrl), String(Cypress.config('baseUrl'))).pathname;
        cy.contains('button', 'Salvar edição').click();
        cy.contains('Credencial atualizada. O link anterior foi invalidado.').should('be.visible');
        cy.request({ url: `${oldPath.replace('/validar/', '/api/credentials/validate/')}`, failOnStatusCode: false })
          .its('status').should('eq', 404);
        cy.get('a').contains('Validar').invoke('attr', 'href').then(currentUrl => {
          const currentPath = new URL(String(currentUrl), String(Cypress.config('baseUrl'))).pathname;
          const currentToken = currentPath.split('/').at(-1);
          cy.visit(String(currentUrl));
          cy.contains('credencial válida').should('be.visible');
          cy.contains('Aluno E2E preparado').should('be.visible');
          cy.get('body').should('not.contain', 'CPF').and('not.contain', '12345678901');
          openInstitutionPeople(school.tenant.id);
          cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
          cy.contains('button', 'Atualizar lista').click();
          cy.contains('button', 'Excluir').click();
          cy.contains('Credencial excluída; o link público foi invalidado.').should('be.visible');
          cy.request({ url: `/api/credentials/validate/${currentToken}`, failOnStatusCode: false })
            .its('status').should('eq', 404);
        });
      });
    });
  });
});
