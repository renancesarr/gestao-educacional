# 18 — E2E de consultar ppc técnico demonstrativo
**What to build:** A UI apresenta Técnico em Administração e matérias de exemplo sob o escopo técnico, separado do Ensino Médio regular.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/cursos-padrao-dados-locais/issues/04-tecnico-em-administracao.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md).

- 2026-10-03: Cypress headed passou (1/1). Confere as oito matérias e soma as cargas horárias visíveis (mínimo 800h). Evidência: `logs/e2e/cursos-padrao-dados-locais/04-tecnico-em-administracao/2026-10-03T11-19-19-466Z/videos/04-tecnico-em-administracao.cy.ts.mp4`; log: `logs/e2e/cursos-padrao-dados-locais/04-tecnico-em-administracao/2026-10-03T11-19-19-466Z/run.txt`.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.
