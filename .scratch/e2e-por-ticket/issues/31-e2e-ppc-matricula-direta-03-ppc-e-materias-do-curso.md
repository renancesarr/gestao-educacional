# 31 — E2E de compor e manter ppc do curso
**What to build:** O operador cadastra matéria, carga horária e colaboradores, consulta detalhe e edita/desativa matéria.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/ppc-matricula-direta/issues/03-ppc-e-materias-do-curso.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam criação, persistência, detalhe do PPC, carga horária, colaborador, edição e desativação da matéria.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- ppc-matricula-direta/03-ppc-e-materias-do-curso`. Vídeo/log em `logs/e2e/ppc-matricula-direta/03-ppc-e-materias-do-curso/2026-10-03T11-04-37-174Z/`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/ppc-matricula-direta/03-ppc-e-materias-do-curso/2026-10-03T11-04-37-174Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/ppc-matricula-direta/03-ppc-e-materias-do-curso/2026-10-03T11-04-37-174Z/videos/03-ppc-e-materias-do-curso.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais. No run agregado `npm run test:all`, este spec falhou depois de outro spec alterar o estado compartilhado; a execução isolada acima passou. O ticket 35 acompanha a fronteira correta de execução.
