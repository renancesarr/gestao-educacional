# 14 — E2E de executar crud e validação pública de credenciais
**What to build:** A jornada cria, consulta, edita e exclui credencial demonstrativa; valida o link atual e verifica projeção pública mínima.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/credenciais-academicas/issues/02-crud-credenciais.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- credenciais-academicas/02-crud-credenciais`. Vídeo/log em `logs/e2e/credenciais-academicas/02-crud-credenciais/2026-10-03T10-39-50-700Z/`.
