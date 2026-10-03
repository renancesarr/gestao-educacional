/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Credenciais acadêmicas — ticket 02', () => {
  it('emite, edita, valida publicamente e exclui credencial demonstrativa', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find((item: { code: string }) => item.code === 'tec-administracao');
      if (!course) throw new Error('A fixture não contém o curso necessário para emitir a credencial.');
      openInstitutionPeople(scenario.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="courseId"]').type(course.id);
      cy.get('select[name="studentId"]').first().select('Aluno E2E preparado');
      cy.get('select[name="type"]').select('diploma');
      cy.get('input[name="issuedOn"]').type('2025-06-10');
      cy.contains('button', 'Emitir credencial').click();
      cy.contains('Credencial emitida para Aluno E2E preparado').should('be.visible');
      cy.get('a').contains('Validar').invoke('attr', 'href').then(oldUrl => {
        cy.contains('button', 'Salvar edição').click();
        cy.contains('Credencial atualizada. O link anterior foi invalidado.').should('be.visible');
        cy.get('a').contains('Validar').invoke('attr', 'href').should('match', /\/validar\//).should('not.eq', oldUrl).then(url => {
          cy.visit(String(url));
          cy.contains('credencial válida').should('be.visible');
          cy.contains('Aluno E2E preparado').should('be.visible');
          cy.contains('Técnico em Administração').should('be.visible');
          cy.contains('Documento demonstrativo').should('be.visible');
          cy.get('body').should('not.contain', 'CPF');
        });
      });
      openInstitutionPeople(scenario.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('button', 'Excluir').click();
      cy.contains('Credencial excluída; o link público foi invalidado.').should('be.visible');
    });
  });
});
