# 01 — Executar um E2E por ID de ticket e salvar vídeo
**What to build:** o implementador informa um ticket e executa apenas seu spec Cypress no Electron visível; a execução gera vídeo e log locais únicos, sem iniciar a suíte completa.
**Blocked by:** None — can start immediately.
**Priority:** 1
**Status:** done
- [x] O comando aceita somente um ID de ticket do tracker local, valida o formato e rejeita caminhos fora do diretório de tickets.
- [x] A execução exige o arquivo Cypress correspondente, seleciona exatamente esse spec e falha claramente para ID inexistente, spec ausente ou execução sem testes.
- [x] Cypress roda com Electron headed e captura vídeo MP4 de uma spec, inclusive quando passa.
- [x] Cada execução cria um diretório novo por ticket e timestamp com log completo e vídeo; o comando imprime ambos os caminhos e mantém execuções anteriores.
- [x] Uma execução seletiva não dispara `npm run test:all`; a suíte ampla continua disponível separadamente.
- [x] Testes unitários do runner cobrem entradas válidas/inválidas, segurança do caminho, seleção única e organização da evidência.
- [x] Um E2E de ticket existente comprova que seleção, browser visível, vídeo e log funcionam de ponta a ponta.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). A fronteira escolhida é Cypress/Electron visível, conforme solicitação do usuário.

Implementação verificada em 2026-10-03: `node --test tests/unit/e2e-ticket-runner.test.ts` passou. `npm run test:e2e:ticket -- consulta-alunos/02-busca-publica-limitada` descobriu/executou um único teste e gerou `logs/e2e/consulta-alunos/02-busca-publica-limitada/2026-10-03T10-36-47-426Z/run.txt` e o MP4 correspondente.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/consulta-alunos/02-busca-publica-limitada/2026-10-03T10-36-47-426Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/consulta-alunos/02-busca-publica-limitada/2026-10-03T10-36-47-426Z/videos/02-busca-publica-limitada.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
