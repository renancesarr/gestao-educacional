/// <reference types="cypress" />
import { loginAsSuperAdmin, loadSchoolScenario } from '../../../support/ticket-login';

describe('Bacharelado em Administração local — ticket 05', () => {
  it('consulta o curso superior e os componentes demonstrativos do PPC', () => {
    loadSchoolScenario((_school, scenarios) => {
      const higher = scenarios.higherEducation as typeof scenarios.higherEducation & {
        courses: Array<{ id: string; code: string; name: string; subjects: number }>;
      };
      loginAsSuperAdmin();
      cy.visit(`/institutions/${higher.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('strong', 'bach-administracao · Bacharelado em Administração').should('be.visible');
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'PPC / matérias').click();
      cy.get('select[aria-label="Selecionar curso"]').select(higher.courses[0]!.id);
      cy.get('.item-list').should('contain', 'Administração Geral').and('contain', 'Contabilidade');
      cy.get('.item-list li').should('have.length', 8);
    });
  });
});
