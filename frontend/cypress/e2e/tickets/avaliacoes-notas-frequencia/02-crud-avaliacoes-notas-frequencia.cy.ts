/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Avaliações, notas e frequência — ticket 02', () => {
  it('registra e consulta avaliação, nota e frequência com datas retroativas', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find((item: { code: string }) => item.code === 'tec-administracao');
      if (!course) throw new Error('A fixture não contém o curso técnico esperado.');
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="recordsCourse"]').type(course.id);
      cy.contains('button', 'Carregar curso, matérias e matrículas').click();
      cy.contains('Curso, matérias e matrículas carregados.').should('be.visible');
      cy.get('select[aria-label="Matrícula"]').should('contain', 'Aluno E2E preparado');
      cy.get('input[name="title"]').type('Avaliação transferida');
      cy.get('input[name="occursOn"]').first().type('2025-03-12');
      cy.get('input[name="maxPoints"]').type('10');
      cy.contains('button', 'Criar avaliação').click();
      cy.contains('Avaliação criada: Avaliação transferida · 2025-03-12').should('be.visible');
      cy.get('select[name="assessmentId"]').select('Avaliação transferida · máximo 10');
      cy.get('input[name="value"]').type('8');
      cy.contains('button', 'Registrar nota').click();
      cy.contains('Nota registrada: 8.').should('be.visible');
      cy.intercept('POST', '/api/platform/courses/*/subjects/*/attendance').as('createAttendance');
      cy.intercept('POST', '/api/platform/grades/search').as('listGrades');
      cy.intercept('POST', '/api/platform/attendance/search').as('listAttendance');
      cy.get('input[name="occursOn"]').last().type('2025-03-13');
      cy.get('select[name="status"]').select('presente');
      cy.contains('button', 'Registrar frequência').click();
      cy.wait('@createAttendance').its('response.statusCode').should('eq', 201);
      cy.wait('@listGrades').its('response.statusCode').should('eq', 200);
      cy.wait('@listAttendance').its('response.statusCode').should('eq', 200);
      cy.contains('Frequência registrada: presente · 2025-03-13.').should('be.visible');
      cy.contains('Avaliação transferida · nota 8').should('be.visible');
      cy.contains('2025-03-13 · presente').should('be.visible');

      cy.get('form[aria-label="Editar avaliação Avaliação transferida"] input[name="title"]')
        .clear().type('Avaliação transferida corrigida');
      cy.get('form[aria-label="Editar avaliação Avaliação transferida"]').contains('button', 'Salvar avaliação').click();
      cy.contains('Avaliação atualizada: Avaliação transferida corrigida.').should('be.visible');
      cy.get('form[aria-label="Editar avaliação Avaliação transferida corrigida"]').contains('button', 'Excluir avaliação').click();
      cy.contains('[role="alert"]', 'Avaliação com notas registradas não pode ser excluída.').should('be.visible');

      cy.window().then(win => {
        cy.stub(win, 'prompt').onFirstCall().returns('9').onSecondCall().returns('2025-03-14');
      });
      cy.contains('Avaliação transferida corrigida · nota 8').parent().contains('button', 'Editar').click();
      cy.contains('Nota atualizada.').should('be.visible');
      cy.contains('Avaliação transferida corrigida · nota 9').should('be.visible');
      cy.contains('Avaliação transferida corrigida · nota 9').parent().contains('button', 'Excluir').click();
      cy.contains('Nota excluída.').should('be.visible');

      cy.contains('2025-03-13 · presente').parent().contains('button', 'Alternar situação').click();
      cy.contains('Frequência atualizada: ausente.').should('be.visible');
      cy.contains('2025-03-13 · ausente').parent().contains('button', 'Editar data').click();
      cy.contains('Frequência atualizada: 2025-03-14.').should('be.visible');
      cy.contains('2025-03-14 · ausente').parent().contains('button', 'Excluir').click();
      cy.contains('Frequência excluída.').should('be.visible');

      cy.get('form[aria-label="Editar avaliação Avaliação transferida corrigida"]').contains('button', 'Excluir avaliação').click();
      cy.contains('Avaliação excluída.').should('be.visible');
      cy.contains('Avaliações de').parent().should('not.contain', 'Avaliação transferida corrigida');
    });
  });
});
