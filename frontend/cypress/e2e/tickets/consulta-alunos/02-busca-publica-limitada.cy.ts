/// <reference types="cypress" />

describe('Consulta pública limitada de alunos — ticket 02', () => {
  it('localiza aluno sem login e apresenta apenas nome, curso e instituição', () => {
    cy.visit('/consulta-publica-alunos');
    cy.get('input[name="name"]').type('Aluno E2E preparado');
    cy.contains('button', 'Buscar alunos').click();

    cy.contains('1 aluno(s) encontrado(s).').should('be.visible');
    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      cy.get('[aria-label="Resultados públicos"]')
        .should('contain', 'Aluno E2E preparado')
        .and('contain', 'Técnico em Administração')
        .and('contain', manifest.scenarios.school.tenant.name);
    });
    cy.get('[aria-label="Resultados públicos"]')
      .should('not.contain', 'CPF:')
      .and('not.contain', 'Recife');
  });
});
