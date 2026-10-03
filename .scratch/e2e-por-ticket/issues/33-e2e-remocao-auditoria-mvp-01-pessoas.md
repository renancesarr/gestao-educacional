# 33 — E2E de confirmar jornada de pessoas sem superfície de auditoria
**What to build:** Cadastro e consulta funcionam e a interface não oferece leitura de auditoria nem depende de evento para confirmar sucesso.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/remocao-auditoria-mvp/issues/01-pessoas.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1); o cadastro funciona sem superfície de auditoria na interface. Evidência: `logs/e2e/remocao-auditoria-mvp/01-pessoas/2026-10-03T11-25-46-703Z/videos/01-pessoas.cy.ts.mp4`; log: `logs/e2e/remocao-auditoria-mvp/01-pessoas/2026-10-03T11-25-46-703Z/run.txt`.
