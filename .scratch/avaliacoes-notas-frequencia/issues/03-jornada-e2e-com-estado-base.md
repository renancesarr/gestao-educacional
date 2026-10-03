# 03 — Focar a jornada E2E acadêmica em avaliações, notas e frequência

**What to build:** a jornada visível no navegador valida o CRUD acadêmico novo usando um estado-base preparado e validado, sem repetir os cadastros e provisionamentos já testados.

**Blocked by:** None — pode começar imediatamente.

**Status:** done
- [x] O E2E visível inicia com fixture determinística contendo `SUPER_ADMIN`, instituição, curso, matéria e matrícula necessários ao cenário.
- [x] A fixture é validada antes do fluxo; se faltar dado ou vínculo esperado, o teste falha com indicação clara de problema no estado-base.
- [x] A jornada percorre os fluxos de avaliações, notas e frequência, incluindo os lançamentos com datas acadêmicas anteriores, sem criar interativamente `SUPER_ADMIN`, instituição ou curso.
- [x] Os fluxos de provisionamento e cadastro-base permanecem cobertos por testes direcionados que podem ser executados quando esses fluxos forem alterados ou quando uma falha indicar problema na preparação.
- [x] O E2E continua abrindo o navegador Electron visível e a suíte completa continua incluindo esse teste.

## Comments

Estado-base montado em memória pelo backend E2E a partir de `academic-scenario.sqlite` read-only, com provisionamento e ativação de `SUPER_ADMIN` fora da jornada visível e matrícula de aluno de teste criada antes de iniciar o servidor. A jornada Cypress agora autentica, abre diretamente a instituição preparada e cobre o CRUD acadêmico retroativo sem repetir onboarding, cadastro de instituição ou curso.

Verificações: `npm run test:all` passou (68 unitários backend, 8 HTTP, 21 SQLite, 11 testes unitários frontend, lint, typechecks, build e 1 E2E visível no Electron). Log: `logs/log-teste-2026-10-03T08-02-01-854Z.txt`. Os testes direcionados existentes de onboarding, cursos e matrículas continuam na suíte completa. Não houve commit; o usuário atualiza o Git.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/avaliacoes-notas-frequencia/03-jornada-e2e-com-estado-base/2026-10-03T11-32-08-730Z/run.txt`) e produziu o vídeo `logs/e2e/avaliacoes-notas-frequencia/03-jornada-e2e-com-estado-base/2026-10-03T11-32-08-730Z/videos/03-jornada-e2e-com-estado-base.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
