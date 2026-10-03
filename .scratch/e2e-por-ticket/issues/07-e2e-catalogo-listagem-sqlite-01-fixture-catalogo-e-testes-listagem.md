# 07 — E2E de consultar catálogo reduzido e local
**What to build:** A interface pesquisa escolas e IES/ofertas da fixture read-only; a preparação não acontece durante a execução e a referência não vira tenant ou matrícula.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/catalogo-listagem-sqlite/issues/01-fixture-catalogo-e-testes-listagem.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1). Evidência: `logs/e2e/catalogo-listagem-sqlite/01-fixture-catalogo-e-testes-listagem/2026-10-03T11-10-15-508Z/videos/01-fixture-catalogo-e-testes-listagem.cy.ts.mp4`; log: `logs/e2e/catalogo-listagem-sqlite/01-fixture-catalogo-e-testes-listagem/2026-10-03T11-10-15-508Z/run.txt`.
