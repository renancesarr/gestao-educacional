/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Técnico em Administração local — ticket 04', () => {
  it('consulta o curso técnico e matérias demonstrativas com carga horária', () => {
    loadSchoolScenario(school => {
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('strong', 'tec-administracao · Técnico em Administração').should('be.visible');
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'PPC / matérias').click();
      cy.get('select[aria-label="Selecionar curso"]').select(school.courses[3]!.id);
      cy.get('.item-list li').should('have.length', 8).then(items => {
        const totalHours = [...items].reduce((total, item) => {
          const hours = item.textContent?.match(/(\d+)h/)?.[1];
          return total + Number(hours ?? 0);
        }, 0);
        expect(totalHours).to.be.at.least(800);
      });
      cy.get('.item-list').should('contain', 'Gestão de Pessoas').and('contain', 'Finanças');
    });
  });
});
