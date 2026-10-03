# 15 — E2E de operar com referências locais sem integrações externas
**What to build:** O fluxo consulta dados INEP aprovados e não oferece chamadas/importações operacionais e-MEC; cadastro operacional continua manual.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/cursos-padrao-dados-locais/issues/01-sem-novas-integracoes-de-catalogo.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), consultando escola local e confirmando ausência de ações e-MEC. Evidência: `logs/e2e/cursos-padrao-dados-locais/01-sem-novas-integracoes-de-catalogo/2026-10-03T11-17-50-194Z/videos/01-sem-novas-integracoes-de-catalogo.cy.ts.mp4`; log: `logs/e2e/cursos-padrao-dados-locais/01-sem-novas-integracoes-de-catalogo/2026-10-03T11-17-50-194Z/run.txt`.
