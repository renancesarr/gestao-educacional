# 21 — E2E de executar crud manual de histórico
**What to build:** O operador cria, consulta, edita e exclui um lançamento anterior para pessoa do tenant, sem acessar registro de outra instituição.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/historicos-academicos/issues/02-crud-historicos.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- historicos-academicos/02-crud-historicos`. Vídeo/log em `logs/e2e/historicos-academicos/02-crud-historicos/2026-10-03T10-39-31-218Z/`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/historicos-academicos/02-crud-historicos/2026-10-03T10-39-31-218Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/historicos-academicos/02-crud-historicos/2026-10-03T10-39-31-218Z/videos/02-crud-historicos.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
