# 35 — Manter o E2E da suíte ampla separado dos specs por ticket

**What to build:** `npm run test:all` executa o E2E-base da jornada institucional; cada um dos 33 specs de ticket continua sendo executado somente pelo comando seletivo com estado limpo.

**Blocked by:** None — a revisão da suíte ampla mostrou que os specs por ticket compartilham estado quando executados em sequência.

**Priority:** 1

**Status:** ready-for-human

- [x] A execução padrão `npm run test:e2e` seleciona somente `platform-journey.cy.ts` e não descobre os 33 specs de ticket.
- [x] `npm run test:e2e:ticket -- <feature>/<ticket>` continua selecionando exclusivamente o spec informado, com Electron visível, log e vídeo locais.
- [x] Um teste automatizado protege a seleção do E2E-base e outro comprova que o runner seletivo permanece independente da suíte ampla.
- [x] `npm run test:all` passa incluindo a jornada-base; o log registra sucesso e não executa os 33 specs em sequência.
- [x] A documentação explica os dois caminhos de execução e mantém vídeos/logs fora do Git.

## Comments

- 2026-10-03: os 33 E2Es passaram individualmente. A execução agregada encontrou quatro falhas causadas por estado persistente entre specs (avaliação duplicada, curso extra, SUPER_ADMIN previamente ativado e colaborador alterado). Esta tarefa preserva a decisão do usuário de executar somente o E2E pertinente à alteração e mantém a regressão ampla determinística.
- 2026-10-03: implementado em `fix/e2e-suite-selection`. `npm run test:all` passou (89 unitários backend, 12 HTTP, 25 SQLite, 15 unitários frontend, lint, typechecks, build e 6 E2Es na jornada-base). Evidência: `logs/log-teste-2026-10-03T14-37-46-301Z.txt` e `frontend/cypress/videos/platform-journey.cy.ts.mp4`. O E2E selecionou um spec e não executou os specs por ticket. Os testes unitários de seleção estão em `tests/unit/e2e-suite-selection.test.ts`.
