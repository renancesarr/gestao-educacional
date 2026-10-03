# 08 — E2E de revisar, aplicar e consultar escolas inep
**What to build:** A UI apresenta prévia da fonte local, aplica os registros válidos e permite localizar escola por nome/localidade, sem criar tenant ou matrícula.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/catalogo-publico-mec-inep/issues/01-catalogo-inep-escolas.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), consultando uma escola local do INEP por nome e município/UF, sem reimportar CSV nem alterar a fixture. Evidência: `logs/e2e/catalogo-publico-mec-inep/01-catalogo-inep-escolas/2026-10-03T11-12-18-031Z/videos/01-catalogo-inep-escolas.cy.ts.mp4`; log: `logs/e2e/catalogo-publico-mec-inep/01-catalogo-inep-escolas/2026-10-03T11-12-18-031Z/run.txt`.
