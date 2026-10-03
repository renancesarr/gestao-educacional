/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('PPC e matérias do curso — ticket 03', () => {
  it('cria matéria com carga e colaborador, consulta detalhe, edita e desativa', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find(item => item.code === 'tec-administracao');
      if (!course) throw new Error('A fixture não contém o curso técnico esperado.');
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Colaboradores').click();
      cy.contains('button', 'Carregar colaboradores').click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'PPC / matérias').click();
      cy.intercept('POST', '/api/platform/courses/*/subjects').as('createSubject');

      cy.get('form').contains('h3', 'Adicionar matéria ao PPC').parent().within(() => {
        cy.get('select[name="courseId"]').select(course.id);
        cy.get('input[name="name"]').type('Componente E2E');
        cy.get('input[name="code"]').type('e2e-componente');
        cy.get('input[name="hours"]').type('12');
        cy.get('input[name="collaboratorIds"]').first().check();
        cy.contains('button', 'Adicionar matéria').click();
      });
      cy.wait('@createSubject').then(({ request, response }) => {
        expect(request.url).to.include(course.id);
        expect(response?.statusCode).to.eq(201);
        expect(response?.body.code).to.eq('e2e-componente');
        expect(response?.body.courseId).to.eq(course.id);
      });
      cy.contains('[role="status"]', 'Matéria adicionada: e2e-componente · Componente E2E').should('be.visible');

      cy.intercept('POST', '/api/platform/courses/detail').as('courseDetails');
      cy.get('select[aria-label="Selecionar curso"]').select(course.id);
      cy.wait('@courseDetails').then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.subjects.map((subject: { code: string }) => subject.code), JSON.stringify(response?.body.subjects)).to.include('e2e-componente');
      });
      cy.contains('li', 'e2e-componente').should('contain', '12h').and('contain', 'Colaborador Fictício do Cenário');
      cy.window().then(win => {
        cy.stub(win, 'prompt').onFirstCall().returns('Componente E2E revisado').onSecondCall().returns('15');
      });
      cy.contains('li', 'e2e-componente').contains('button', 'Editar').click();
      cy.contains('Matéria atualizada.').should('be.visible');
      cy.contains('li', 'e2e-componente').should('contain', 'Componente E2E revisado').and('contain', '15h');
      cy.contains('li', 'e2e-componente').contains('button', 'Desativar').click();
      cy.contains('Matéria desativada.').should('be.visible');
      cy.contains('li', 'e2e-componente').should('contain', 'inativa');
    });
  });
});
