# 05 — E2E de criar curso no tenant-alvo
**What to build:** O `SUPER_ADMIN` escolhe a instituição, cria curso em escopo declarado, vê o resultado e recebe erro para código duplicado ou escopo incompatível.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/catalogo-cursos/issues/01-criar-curso-institucional.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions cobrem criação no tenant-alvo, duplicidade e escopo incompatível segundo o ticket de origem.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- catalogo-cursos/01-criar-curso-institucional`. Vídeo/log em `logs/e2e/catalogo-cursos/01-criar-curso-institucional/2026-10-03T10-55-45-288Z/`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/catalogo-cursos/01-criar-curso-institucional/2026-10-03T10-55-45-288Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/catalogo-cursos/01-criar-curso-institucional/2026-10-03T10-55-45-288Z/videos/01-criar-curso-institucional.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
