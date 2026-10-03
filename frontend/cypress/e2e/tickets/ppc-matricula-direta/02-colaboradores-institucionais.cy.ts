/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Colaboradores institucionais — ticket 02', () => {
  it('vincula pessoa existente e consulta, desativa e reativa o colaborador', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('select[name="kind"]').select('institutionalId');
      cy.get('input[name="value"]').type('aluno-e2e-preparado');
      cy.contains('button', 'Buscar', { matchCase: true }).click();
      cy.get('[role="status"]').invoke('text').then(notice => {
        expect(notice).to.contain('Pessoa encontrada: Aluno E2E preparado');
        const personId = notice.split('·').at(-1)?.trim();
        expect(personId).to.match(/^[0-9a-f-]{36}$/i);
        cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Colaboradores').click();
        cy.get('input[name="personId"]').type(String(personId));
        cy.contains('button', 'Vincular pessoa').click();
        cy.contains('[role="status"]', 'Aluno E2E preparado vinculado como colaborador.').should('be.visible');
      });

      cy.contains('button', 'Carregar colaboradores').click();
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'ativo').and('not.contain', 'login');
      cy.contains('li', 'Aluno E2E preparado').contains('button', 'Desativar').click();
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'inativo');
      cy.contains('li', 'Aluno E2E preparado').contains('button', 'Reativar').click();
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'ativo');
    });
  });
});
