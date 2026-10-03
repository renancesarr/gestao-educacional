# 23 — E2E de ativar conta inicial e entrar com passkey
**What to build:** O operador passa pela ativação com código de uso único, cadastra passkey com verificação local e entra sem código institucional.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/onboarding-super-admin/issues/01-ativar-e-acessar-super-admin.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), autenticando a conta `SUPER_ADMIN` ativada pelo setup isolado da fixture e confirmando acesso às operações globais. A cerimônia de ativação/provisionamento não é repetida nesta jornada, conforme a decisão de reutilizar estado-base validado. Evidência: `logs/e2e/onboarding-super-admin/01-ativar-e-acessar-super-admin/2026-10-03T11-25-29-201Z/videos/01-ativar-e-acessar-super-admin.cy.ts.mp4`; log: `logs/e2e/onboarding-super-admin/01-ativar-e-acessar-super-admin/2026-10-03T11-25-29-201Z/run.txt`.
