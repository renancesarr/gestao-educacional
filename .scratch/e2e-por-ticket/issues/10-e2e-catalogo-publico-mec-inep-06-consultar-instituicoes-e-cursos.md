# 10 — E2E de consultar referências locais sem operação e-mec
**What to build:** O usuário consulta as referências aprovadas e vê instituição/curso/localidade; a tela não apresenta o fluxo e-MEC retirado do MVP.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/catalogo-publico-mec-inep/issues/06-consultar-instituicoes-e-cursos.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1), pesquisando instituição local por município/UF e sem apresentar operação e-MEC. Evidência: `logs/e2e/catalogo-publico-mec-inep/06-consultar-instituicoes-e-cursos/2026-10-03T11-15-34-231Z/videos/06-consultar-instituicoes-e-cursos.cy.ts.mp4`; log: `logs/e2e/catalogo-publico-mec-inep/06-consultar-instituicoes-e-cursos/2026-10-03T11-15-34-231Z/run.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/catalogo-publico-mec-inep/06-consultar-instituicoes-e-cursos/2026-10-03T11-15-34-231Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/catalogo-publico-mec-inep/06-consultar-instituicoes-e-cursos/2026-10-03T11-15-34-231Z/videos/06-consultar-instituicoes-e-cursos.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
