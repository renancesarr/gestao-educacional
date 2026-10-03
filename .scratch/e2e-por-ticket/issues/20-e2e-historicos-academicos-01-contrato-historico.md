# 20 — E2E de verificar contrato de lançamento manual de histórico
**What to build:** A tela permite inserir fato histórico anterior com rótulos da instituição/curso de origem, sem exigir matrícula atual nem gerar conteúdo calculado/oficial.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/historicos-academicos/issues/01-contrato-historico.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), lançando um fato de 2018 para curso textual sem exigir matrícula atual nem curso operacional correspondente. Evidência: `logs/e2e/historicos-academicos/01-contrato-historico/2026-10-03T11-33-23-002Z/videos/01-contrato-historico.cy.ts.mp4`; log: `logs/e2e/historicos-academicos/01-contrato-historico/2026-10-03T11-33-23-002Z/run.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/historicos-academicos/01-contrato-historico/2026-10-03T11-33-23-002Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/historicos-academicos/01-contrato-historico/2026-10-03T11-33-23-002Z/videos/01-contrato-historico.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
