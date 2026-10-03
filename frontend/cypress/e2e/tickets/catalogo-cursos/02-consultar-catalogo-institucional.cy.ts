/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin } from '../../../support/ticket-login';

describe('Consultar catálogo de cursos — ticket 02', () => {
  it('ordena os cursos, filtra pelo escopo e respeita a instituição escolhida', () => {
    loginAsSuperAdmin();
    loadSchoolScenario((scenario, scenarios) => {
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.get('select[aria-label="Filtrar cursos por escopo"]').should('be.visible');
      cy.get('ul.item-list').should('contain', 'fund-anos-iniciais').and('contain', 'tec-administracao').and('not.contain', 'bach-administracao');
      cy.get('ul.item-list li strong').then(items => {
        const codes = [...items].map(item => item.textContent?.split(' · ')[0]);
        expect(codes).to.deep.equal(['fund-anos-finais', 'fund-anos-iniciais', 'medio-regular', 'tec-administracao']);
      });

      cy.get('select[aria-label="Filtrar cursos por escopo"]').select('Ensino Fundamental');
      cy.contains('button', 'Atualizar lista').click();
      cy.get('ul.item-list').should('contain', 'fund-anos-iniciais').and('not.contain', 'tec-administracao');

      cy.get('select[aria-label="Filtrar cursos por escopo"]').select('Educação Profissional Técnica de nível médio');
      cy.contains('button', 'Atualizar lista').click();
      cy.get('ul.item-list').should('contain', 'tec-administracao').and('not.contain', 'fund-anos-iniciais');

      cy.visit(`/institutions/${scenarios.higherEducation.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.get('ul.item-list').should('contain', 'bach-administracao').and('not.contain', 'tec-administracao');
    });
  });
});
