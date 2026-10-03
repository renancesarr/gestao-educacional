# 24 — E2E de recuperar super_admin por operação local
**What to build:** O processo controlado emite novo código, invalida a credencial anterior e permite novo cadastro de passkey sem recuperação por e-mail.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/onboarding-super-admin/issues/02-recuperar-conta-super-admin.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1). O backend local prepara a recuperação pelo serviço antes de abrir o navegador; a interface realiza o cadastro de nova passkey e confirma acesso. O comando de recuperação em si segue coberto por testes direcionados do serviço/CLI, sem simular uma função que não existe na UI. Evidência: `logs/e2e/onboarding-super-admin/02-recuperar-conta-super-admin/2026-10-03T11-41-17-722Z/videos/02-recuperar-conta-super-admin.cy.ts.mp4`; log: `logs/e2e/onboarding-super-admin/02-recuperar-conta-super-admin/2026-10-03T11-41-17-722Z/run.txt`.
