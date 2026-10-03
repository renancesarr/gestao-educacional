# 29 — E2E de renomear e ativar/desativar curso
**What to build:** O operador consulta, altera nome e alterna status; curso inativo segue visível à gestão e não é oferecido como ativo para matrícula.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/ppc-matricula-direta/issues/01-ciclo-de-vida-do-curso.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam consulta, renomeação, ativação/desativação persistidas e elegibilidade do curso para novas matrículas.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- ppc-matricula-direta/01-ciclo-de-vida-do-curso`. Vídeo/log em `logs/e2e/ppc-matricula-direta/01-ciclo-de-vida-do-curso/2026-10-03T11-07-55-623Z/`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/ppc-matricula-direta/01-ciclo-de-vida-do-curso/2026-10-03T11-07-55-623Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/ppc-matricula-direta/01-ciclo-de-vida-do-curso/2026-10-03T11-07-55-623Z/videos/01-ciclo-de-vida-do-curso.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
