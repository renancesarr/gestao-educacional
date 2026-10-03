# 35 — Manter o E2E da suíte ampla separado dos specs por ticket

**What to build:** `npm run test:all` executa o E2E-base da jornada institucional; cada um dos 33 specs de ticket continua sendo executado somente pelo comando seletivo com estado limpo.

**Blocked by:** None — a revisão da suíte ampla mostrou que os specs por ticket compartilham estado quando executados em sequência.

**Priority:** 1

**Status:** ready-for-agent

- [ ] A execução padrão `npm run test:e2e` seleciona somente `platform-journey.cy.ts` e não descobre os 33 specs de ticket.
- [ ] `npm run test:e2e:ticket -- <feature>/<ticket>` continua selecionando exclusivamente o spec informado, com Electron visível, log e vídeo locais.
- [ ] Um teste automatizado protege a seleção do E2E-base e outro comprova que o runner seletivo permanece independente da suíte ampla.
- [ ] `npm run test:all` passa incluindo a jornada-base; o log registra sucesso e não executa os 33 specs em sequência.
- [ ] A documentação explica os dois caminhos de execução e mantém vídeos/logs fora do Git.

## Comments

- 2026-10-03: os 33 E2Es passaram individualmente. A execução agregada encontrou quatro falhas causadas por estado persistente entre specs (avaliação duplicada, curso extra, SUPER_ADMIN previamente ativado e colaborador alterado). Esta tarefa preserva a decisão do usuário de executar somente o E2E pertinente à alteração e mantém a regressão ampla determinística.
