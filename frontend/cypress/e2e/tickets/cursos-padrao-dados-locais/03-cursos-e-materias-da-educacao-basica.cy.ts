/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Educação Básica de demonstração — ticket 03', () => {
  it('consulta cursos Fundamental e Médio e seus componentes do PPC', () => {
    loadSchoolScenario(school => {
      loginAsSuperAdmin();
      cy.visit(`/institutions/${school.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('strong', 'fund-anos-iniciais · Ensino Fundamental — Anos Iniciais (1º ao 5º ano)')
        .should('be.visible');
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'PPC / matérias').click();
      cy.contains('h3', 'Consultar e editar PPC').should('be.visible');
      cy.get('select[aria-label="Selecionar curso"]').select(school.courses[0]!.id);
      cy.contains('strong', 'Língua Portuguesa').should('be.visible');
      cy.get('select[aria-label="Selecionar curso"]').select(school.courses[2]!.id);
      cy.get('.item-list').should('contain', 'Ciências Humanas e Sociais Aplicadas');
    });
  });
});
