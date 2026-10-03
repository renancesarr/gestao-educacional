# 16 — E2E de abrir cenário de teste acadêmico local
**What to build:** O operador consulta instituições/cursos demonstrativos preparados; cenário é separado do banco operacional e não cria matrícula automaticamente.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/cursos-padrao-dados-locais/issues/02-cenario-academico-de-teste.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), listando cursos existentes da escola e IES; a verificação do manifesto confirma que a fixture persistida tem zero matrículas. Evidência: `logs/e2e/cursos-padrao-dados-locais/02-cenario-academico-de-teste/2026-10-03T11-20-58-520Z/videos/02-cenario-academico-de-teste.cy.ts.mp4`; log: `logs/e2e/cursos-padrao-dados-locais/02-cenario-academico-de-teste/2026-10-03T11-20-58-520Z/run.txt`.
