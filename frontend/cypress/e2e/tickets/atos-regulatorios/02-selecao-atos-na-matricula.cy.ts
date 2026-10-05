/// <reference types="cypress" />
import { loadSchoolScenario, loginAsSuperAdmin, openInstitutionPeople } from '../../../support/ticket-login';

describe('Atos regulatórios na matrícula — ticket 02', () => {
  it('permite escolher o ato da instituição e do curso e registra os textos usados', () => {
    loginAsSuperAdmin();
    loadSchoolScenario(scenario => {
      const course = scenario.courses.find(item => item.code === 'fund-anos-iniciais');
      if (!course) throw new Error('A fixture não contém o curso de Ensino Fundamental esperado.');
      let institutionalActId = '';
      let institutionalVersionId = '';
      let courseActId = '';
      let courseVersionId = '';
      let studentId = '';
      cy.request({ method: 'POST', url: '/api/platform/regulatory-acts', headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, target: 'institution',
        text: 'Ato institucional selecionado na matrícula.', status: 'ativo',
      } }).then(response => { expect(response.status).to.eq(201); institutionalActId = response.body.id;
        institutionalVersionId = response.body.currentVersionId; });
      cy.request({ method: 'POST', url: '/api/platform/regulatory-acts', headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, target: 'course', courseId: course.id,
        text: 'Ato do curso selecionado na matrícula.', status: 'vencido',
      } }).then(response => { expect(response.status).to.eq(201); courseActId = response.body.id;
        courseVersionId = response.body.currentVersionId; });
      cy.request({ method: 'POST', url: '/api/platform/people/search', headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, institutionalId: 'aluno-e2e-preparado',
      } }).then(response => { expect(response.status).to.eq(200); studentId = response.body.id; });
      cy.then(() => cy.request({ method: 'POST', url: '/api/platform/enrollments', failOnStatusCode: false,
        headers: { Origin: 'http://localhost:3000' }, body: { targetTenantId: scenario.tenant.id, personId: studentId,
          courseId: course.id, regulatoryActs: [
            { target: 'institution', actId: institutionalActId, versionId: institutionalVersionId },
            { target: 'course', actId: courseActId, versionId: courseVersionId },
          ] } }).then(response => { expect(response.status).to.eq(409); expect(response.body.code).to.eq('CONFLICT'); }));

      openInstitutionPeople(scenario.tenant.id);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Curso').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Matrículas').click();
      cy.get('select[name="personId"] option').then(options => {
        const student = [...options].find(option => (option as HTMLOptionElement).value === studentId);
        if (!student) throw new Error('Estado-base inválido: aluno preparado ausente na matrícula.');
      cy.get('select[name="personId"]').select((student as HTMLOptionElement).value);
      });
      cy.get('select[name="courseId"]').select(course.id);
      cy.contains('button', 'Matricular').should('be.disabled');

      cy.get('select[name="institutionActVersion"]').should('be.visible').contains('option', 'Ato institucional selecionado na matrícula.')
        .then(option => cy.get('select[name="institutionActVersion"]').select(option.val() as string));
      cy.get('select[name="courseActVersion"]').should('be.visible').contains('option', 'Ato do curso selecionado na matrícula.')
        .then(option => cy.get('select[name="courseActVersion"]').select(option.val() as string));
      cy.contains('[role="alert"]', 'Há ato ausente ou inativo').should('be.visible');
      cy.contains('button', 'Matricular').should('be.disabled');
      cy.contains('label', 'Permitir matrícula mesmo assim').find('input').check();
      cy.contains('button', 'Matricular').should('be.disabled');
      cy.get('textarea[name="regulatoryExceptionReason"]').type('Ato vencido em processo de renovação; matrícula autorizada pela direção.');
      cy.contains('button', 'Matricular').should('not.be.disabled');
      cy.contains('button', 'Matricular').click();

      cy.contains('[role="status"]', 'Matrícula ativa criada para Aluno E2E preparado.').should('be.visible');
      cy.contains('[role="status"]', 'Ato institucional selecionado na matrícula.').should('be.visible');
      cy.contains('[role="status"]', 'Ato do curso selecionado na matrícula.').should('be.visible');
      cy.then(() => cy.request({ method: 'PATCH', url: `/api/platform/regulatory-acts/${courseActId}`, headers: { Origin: 'http://localhost:3000' }, body: {
        targetTenantId: scenario.tenant.id, text: 'Texto novo do ato do curso após a matrícula.', status: 'ativo', preservePreviousVersion: false,
      } }).its('status').should('eq', 200));
      cy.then(() => cy.request({ method: 'DELETE', url: `/api/platform/regulatory-acts/${courseActId}`, failOnStatusCode: false,
        headers: { Origin: 'http://localhost:3000' }, body: { targetTenantId: scenario.tenant.id } })
        .then(response => { expect(response.status).to.eq(409); expect(response.body.code).to.eq('CONFLICT'); }));
      cy.get('select[name="enrollCourse"]').select(course.id);
      cy.contains('button', 'Consultar matrículas').click();
      cy.contains('li', 'Aluno E2E preparado').should('contain', 'Ato institucional selecionado na matrícula.')
        .and('contain', 'Ato do curso selecionado na matrícula.')
        .and('not.contain', 'Texto novo do ato do curso após a matrícula.')
        .and('contain', 'vencido')
        .and('contain', 'Exceção autorizada por')
        .and('contain', 'Ato vencido em processo de renovação; matrícula autorizada pela direção.');
    });
  });
});
