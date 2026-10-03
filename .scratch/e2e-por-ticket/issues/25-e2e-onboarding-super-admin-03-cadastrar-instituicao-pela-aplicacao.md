# 25 — E2E de criar instituição e escopo pela interface
**What to build:** `SUPER_ADMIN` cria instituição com escopo válido; duplicidade é rejeitada e a conta/escope permanecem coerentes.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/onboarding-super-admin/issues/03-cadastrar-instituicao-pela-aplicacao.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), criando uma nova instituição com escopo Fundamental e primeira conta TENANT_ADMIN, depois abrindo a instituição pela UI. Evidência: `logs/e2e/onboarding-super-admin/03-cadastrar-instituicao-pela-aplicacao/2026-10-03T11-24-03-067Z/videos/03-cadastrar-instituicao-pela-aplicacao.cy.ts.mp4`; log: `logs/e2e/onboarding-super-admin/03-cadastrar-instituicao-pela-aplicacao/2026-10-03T11-24-03-067Z/run.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/onboarding-super-admin/03-cadastrar-instituicao-pela-aplicacao/2026-10-03T11-24-03-067Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/onboarding-super-admin/03-cadastrar-instituicao-pela-aplicacao/2026-10-03T11-24-03-067Z/videos/03-cadastrar-instituicao-pela-aplicacao.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
