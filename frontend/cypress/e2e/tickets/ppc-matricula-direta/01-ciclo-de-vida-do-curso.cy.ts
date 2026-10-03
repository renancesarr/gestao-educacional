/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Ciclo de vida do curso — ticket 01', () => {
  it('renomeia, desativa, mantém visível à gestão e reativa o curso', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find(item => item.code === 'tec-administracao');
      if (!course) throw new Error('A fixture não contém o curso técnico esperado.');
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('li', 'tec-administracao').should('contain', 'ativo');

      cy.window().then(win => cy.stub(win, 'prompt').returns('Técnico em Administração revisado'));
      cy.contains('li', 'tec-administracao').contains('button', 'Renomear').click();
      cy.contains('li', 'tec-administracao').should('contain', 'Técnico em Administração revisado');
      cy.contains('li', 'tec-administracao').contains('button', 'Desativar').click();
      cy.contains('li', 'tec-administracao').should('contain', 'inativo');

      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Matrículas').click();
      cy.get('select[name="courseId"] option').should('not.contain', 'tec-administracao');

      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('li', 'tec-administracao').should('contain', 'Técnico em Administração revisado').and('contain', 'inativo');
      cy.contains('li', 'tec-administracao').contains('button', 'Reativar').click();
      cy.contains('li', 'tec-administracao').should('contain', 'ativo');
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('li', 'tec-administracao').should('contain', 'ativo');
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Matrículas').click();
      cy.get('select[name="courseId"] option').should('contain', 'tec-administracao');
    });
  });
});
