/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Atos regulatórios — ticket 01', () => {
  it('cadastra atos da instituição e do curso, preserva versões e permite editar sem histórico', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find((item: { code: string }) => item.code === 'tec-administracao');
      if (!course) throw new Error('A fixture não contém o curso técnico esperado.');
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Atos regulatórios').click();
      cy.contains('h2', 'Atos regulatórios').should('be.visible');

      cy.get('select[name="target"]').select('institution');
      cy.get('textarea[name="text"]').type('Credenciamento institucional E2E, versão inicial.');
      cy.get('select[name="status"]').select('ativo');
      cy.contains('button', 'Cadastrar ato').click();
      cy.contains('Credenciamento institucional E2E, versão inicial.').should('be.visible');

      cy.get('select[name="target"]').select('course');
      cy.get('select[name="courseId"]').select(course.id);
      cy.get('textarea[name="text"]').clear().type('Ato do curso técnico E2E, versão inicial.');
      cy.get('select[name="status"]').select('ativo');
      cy.contains('button', 'Cadastrar ato').click();
      cy.contains('Ato do curso técnico E2E, versão inicial.').should('be.visible');

      cy.contains('article', 'Ato do curso técnico E2E, versão inicial.')
        .contains('button', 'Editar').click();
      cy.get('textarea[name="editText"]').clear().type('Ato do curso técnico E2E, versão revisada.');
      cy.get('select[name="editStatus"]').select('suspenso');
      cy.get('input[name="preservePreviousVersion"][value="true"]').check();
      cy.contains('button', 'Salvar edição').click();
      cy.contains('Ato do curso técnico E2E, versão inicial.').should('be.visible');
      cy.contains('Ato do curso técnico E2E, versão revisada.').should('be.visible');
      cy.contains('Status: Suspenso').should('be.visible');

      cy.contains('article', 'Ato do curso técnico E2E, versão revisada.')
        .contains('button', 'Editar').click();
      cy.get('textarea[name="editText"]').clear().type('Ato do curso técnico E2E, texto corrigido.');
      cy.get('input[name="preservePreviousVersion"][value="false"]').check();
      cy.contains('button', 'Salvar edição').click();
      cy.contains('Ato do curso técnico E2E, versão revisada.').should('not.exist');
      cy.contains('Ato do curso técnico E2E, texto corrigido.').should('be.visible');
      cy.contains('Ato do curso técnico E2E, versão inicial.').should('be.visible');
    });
  });
});
