# 09 — E2E de confirmar que e-mec operacional foi retirado
**What to build:** A interface não oferece importação ou atualização operacional e-MEC; rotas antigas não aceitam importação. A evidência segue ADR 0017 e mantém uso local da fixture.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/catalogo-publico-mec-inep/issues/05-importar-ies-e-cursos-graduacao.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1). Confirmou ausência da interface operacional e resposta 404 da rota e-MEC removida; teste enviou `Origin` igual ao host permitido. Evidência: `logs/e2e/catalogo-publico-mec-inep/05-importar-ies-e-cursos-graduacao/2026-10-03T11-15-12-139Z/videos/05-importar-ies-e-cursos-graduacao.cy.ts.mp4`; log: `logs/e2e/catalogo-publico-mec-inep/05-importar-ies-e-cursos-graduacao/2026-10-03T11-15-12-139Z/run.txt`.
