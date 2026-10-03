# 02 — E2E de evidenciar contrato retroativo de avaliação, nota e frequência
**What to build:** A tela deve aceitar data acadêmica passada, limitar a nota ao máximo e registrar frequência uma vez por matrícula/matéria/data, sem calcular média ou aprovação.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/avaliacoes-notas-frequencia/issues/01-decisoes-de-crud.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), aceitando datas anteriores, rejeitando nota acima da pontuação máxima e impedindo frequência duplicada na matrícula/matéria/data. Evidência: `logs/e2e/avaliacoes-notas-frequencia/01-decisoes-de-crud/2026-10-03T11-29-58-679Z/videos/01-decisoes-de-crud.cy.ts.mp4`; log: `logs/e2e/avaliacoes-notas-frequencia/01-decisoes-de-crud/2026-10-03T11-29-58-679Z/run.txt`.
