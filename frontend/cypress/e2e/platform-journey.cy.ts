/// <reference types="cypress" />

const authenticationOptions = {
  challenge: 'Y3lwcmVzcy1sb2dpbi1jaGFsbGVuZ2U',
  timeout: 60_000,
  allowCredentials: [],
  userVerification: 'required' as const,
};

function installVirtualPasskey(win: Window) {
  const bytes = new TextEncoder().encode('fixture-passkey').buffer;
  const responseBytes = new Uint8Array([1, 2, 3]).buffer;
  const credential = {
    id: 'fixture-passkey', rawId: bytes, type: 'public-key', authenticatorAttachment: 'platform',
    getClientExtensionResults: () => ({}),
    response: {
      attestationObject: responseBytes, authenticatorData: responseBytes, clientDataJSON: responseBytes,
      signature: responseBytes, userHandle: null, getTransports: () => ['internal'],
      getPublicKey: () => responseBytes, getPublicKeyAlgorithm: () => -7,
    },
  };
  Object.defineProperty(win.navigator, 'credentials', {
    configurable: true,
    value: { create: async () => credential, get: async () => credential },
  });
}

describe('CRUD acadêmico com estado-base preparado', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/platform/login/options', request => request.continue(response => {
      response.body = authenticationOptions;
    })).as('loginOptions');
    cy.intercept('POST', '/api/platform/login/verify').as('loginVerify');
  });

  it('registra avaliação, nota e frequência retroativas no percurso preparado', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.contains('button', 'Continuar com passkey').click();
    cy.wait('@loginOptions').its('response.statusCode').should('eq', 200);
    cy.wait('@loginVerify').then(({ response }) => {
      expect(response?.statusCode, JSON.stringify(response?.body)).to.eq(200);
    });
    cy.contains('Acesso à plataforma autorizado.').should('be.visible');

    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      const scenario = manifest.scenarios.school;
      const technicalCourse = scenario.courses.find((course: { code: string }) => course.code === 'tec-administracao');
      expect(Boolean(technicalCourse), 'curso técnico disponível no estado-base').to.eq(true);

      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="recordsCourse"]').type(technicalCourse.id);
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
      cy.wait('@createAttendance').then(({ response }) => expect(response?.statusCode).to.eq(201));
      cy.wait('@listGrades').then(({ response }) => expect(response?.statusCode).to.eq(200));
      cy.wait('@listAttendance').then(({ response }) => expect(response?.statusCode).to.eq(200));
      cy.contains('Frequência registrada: presente · 2025-03-13.').should('be.visible');
      cy.contains('Avaliação transferida · nota 8').should('be.visible');
      cy.contains('2025-03-13 · presente').should('be.visible');
    });
  });

  it('emite, edita, valida publicamente e exclui uma credencial demonstrativa', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.contains('button', 'Continuar com passkey').click();
    cy.wait('@loginOptions');
    cy.wait('@loginVerify').its('response.statusCode').should('eq', 200);
    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      const tenantId = manifest.scenarios.school.tenant.id;
      const course = manifest.scenarios.school.courses.find((value: { code: string }) => value.code === 'tec-administracao');
      expect(Boolean(course), 'curso da credencial disponível na fixture').to.eq(true);
      cy.visit(`/institutions/${tenantId}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('select[name="kind"]').select('institutionalId');
      cy.get('input[name="value"]').type('aluno-e2e-preparado');
      cy.contains('button', 'Buscar', { matchCase: true }).click();
      cy.contains('Pessoa encontrada: Aluno E2E preparado').should('be.visible');
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('input[name="courseId"]').type(course.id);
      cy.get('select[name="studentId"]').first().select('Aluno E2E preparado');
      cy.get('select[name="type"]').select('diploma');
      cy.get('input[name="issuedOn"]').type('2025-06-10');
      cy.contains('button', 'Emitir credencial').click();
      cy.contains('Credencial emitida para Aluno E2E preparado').should('be.visible');
      cy.get('a').contains('Validar').invoke('attr', 'href').then(oldUrl => {
        cy.contains('button', 'Salvar edição').click();
        cy.contains('Credencial atualizada. O link anterior foi invalidado.').should('be.visible');
        cy.get('a').contains('Validar').invoke('attr', 'href').should('match', /\/validar\//).should('not.eq', oldUrl).then(url => {
        cy.visit(String(url));
        cy.contains('credencial válida').should('be.visible');
        cy.contains('Aluno E2E preparado').should('be.visible');
        cy.contains('Técnico em Administração').should('be.visible');
        cy.contains('Documento demonstrativo').should('be.visible');
        cy.get('body').should('not.contain', 'CPF');
        });
      });
      cy.visit(`/institutions/${tenantId}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('select[name="kind"]').select('institutionalId');
      cy.get('input[name="value"]').type('aluno-e2e-preparado');
      cy.contains('button', 'Buscar', { matchCase: true }).click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.contains('button', 'Atualizar lista').click();
      cy.contains('button', 'Excluir').click();
      cy.contains('Credencial excluída; o link público foi invalidado.').should('be.visible');
    });
  });

  it('transfere manualmente, consulta, edita e exclui histórico anterior', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.contains('button', 'Continuar com passkey').click();
    cy.wait('@loginOptions');
    cy.wait('@loginVerify').its('response.statusCode').should('eq', 200);
    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      const tenantId = manifest.scenarios.school.tenant.id;
      cy.visit(`/institutions/${tenantId}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('select[name="kind"]').select('institutionalId');
      cy.get('input[name="value"]').type('aluno-e2e-preparado');
      cy.contains('button', 'Buscar', { matchCase: true }).click();
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Avaliações, notas e frequência').click();
      cy.get('select[name="studentId"]').last().select('Aluno E2E preparado');
      cy.get('input[name="sourceInstitution"]').type('Escola de Origem');
      cy.get('input[name="courseName"]').type('Ensino Fundamental');
      cy.get('input[name="academicYear"]').last().type('2022');
      cy.get('input[name="period"]').type('2º bimestre');
      cy.get('input[name="subjectName"]').type('História');
      cy.get('input[name="workloadHours"]').type('80');
      cy.get('input[name="gradeOrConcept"]').type('B');
      cy.get('input[name="absenceCount"]').type('3');
      cy.get('input[name="result"]').last().type('Aprovado');
      cy.contains('button', 'Registrar histórico manual').click();
      cy.contains('Histórico transferido registrado para Aluno E2E preparado.').should('be.visible');
      cy.get('form[aria-label="Editar histórico História"] input[name="result"]').clear().type('Recuperação concluída');
      cy.get('form[aria-label="Editar histórico História"]').contains('button', 'Salvar alterações').click();
      cy.contains('Histórico atualizado.').should('be.visible');
      cy.get('form[aria-label="Editar histórico História"] input[name="result"]').should('have.value', 'Recuperação concluída');
      cy.get('form[aria-label="Editar histórico História"]').contains('button', 'Excluir').click();
      cy.contains('Histórico excluído.').should('be.visible');
    });
  });

  it('localiza aluno pela busca operacional, com curso, e abre seu cadastro', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.contains('button', 'Continuar com passkey').click();
    cy.wait('@loginOptions').its('response.statusCode').should('eq', 200);
    cy.wait('@loginVerify').then(({ response }) => expect(response?.statusCode).to.eq(200));
    cy.contains('Acesso à plataforma autorizado.').should('be.visible');

    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      const scenario = manifest.scenarios.school;
      cy.visit(`/institutions/${scenario.tenant.id}`);
      cy.get('nav[aria-label="Etapas do cadastro"]').contains('button', 'Pessoas').click();
      cy.get('input[name="name"]').last().type('Aluno E2E preparado');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('1 aluno(s) encontrado(s).').should('be.visible');
      cy.contains('Aluno E2E preparado').should('be.visible');
      cy.contains('button', 'Abrir cadastro').click();
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'Aluno E2E preparado');
      cy.get('[aria-label="Cadastro do aluno"]').should('contain', 'tec-administracao');
    });
  });

  it('permite consulta pública sem login e mostra somente nome, curso e instituição', () => {
    cy.visit('/consulta-publica-alunos');
    cy.get('input[name="name"]').type('Aluno E2E preparado');
    cy.contains('button', 'Buscar alunos').click();
    cy.contains('1 aluno(s) encontrado(s).').should('be.visible');
    cy.get('[aria-label="Resultados públicos"]').should('contain', 'Aluno E2E preparado')
      .and('contain', 'Técnico em Administração');
    cy.get('[aria-label="Resultados públicos"]').should('not.contain', 'CPF:')
      .and('not.contain', 'Recife');
  });

  it('mantém a etapa de pessoas utilizável em 375×812 e 1280×800', () => {
    cy.on('window:before:load', installVirtualPasskey);
    cy.visit('/');
    cy.get('input[name="username"]').type('root-cypress-e2e');
    cy.contains('button', 'Continuar com passkey').click();
    cy.wait('@loginOptions');
    cy.wait('@loginVerify').its('response.statusCode').should('eq', 200);

    cy.readFile('../tests/fixtures/academic-scenario.manifest.json').then(manifest => {
      const tenantId = manifest.scenarios.school.tenant.id;
      cy.viewport(375, 812);
      cy.visit(`/institutions/${tenantId}`);
      cy.get('input[name="name"]').last().focus();
      cy.focused().should('have.attr', 'name', 'name');
      cy.get('input[name="name"]').last().type('Nome sem correspondência');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('Nenhum aluno encontrado.').should('be.visible');
      cy.window().then(win => {
        expect(win.innerWidth).to.eq(375);
        expect(win.innerHeight).to.eq(812);
        expect(win.document.documentElement.scrollWidth).to.be.at.most(win.document.documentElement.clientWidth);
      });
      cy.get('nextjs-portal').then(portal => portal.remove());
      cy.scrollTo('top');
      cy.screenshot('institution-people-mobile-375x812', { capture: 'viewport' });
      cy.contains('Nenhum aluno encontrado.').scrollIntoView();
      cy.screenshot('institution-people-mobile-empty-375x812', { capture: 'viewport' });

      cy.viewport(1280, 800);
      cy.reload();
      cy.get('input[name="name"]').last().type('Nome sem correspondência');
      cy.contains('button', 'Buscar alunos').click();
      cy.contains('Nenhum aluno encontrado.').should('be.visible');
      cy.window().then(win => {
        expect(win.innerWidth).to.eq(1280);
        expect(win.innerHeight).to.eq(800);
        expect(win.document.documentElement.scrollWidth).to.be.at.most(win.document.documentElement.clientWidth);
      });
      cy.get('nextjs-portal').then(portal => portal.remove());
      cy.scrollTo('top');
      cy.screenshot('institution-people-desktop-1280x800', { capture: 'viewport' });
      cy.contains('Nenhum aluno encontrado.').scrollIntoView();
      cy.screenshot('institution-people-desktop-empty-1280x800', { capture: 'viewport' });
    });
  });
});
