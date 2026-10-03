# 03 — E2E de evidenciar crud de avaliação, nota e frequência
**What to build:** A jornada cria, consulta, edita e exclui os três recursos, confirma os vínculos e demonstra as restrições de tenant e exclusão aprovadas.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/avaliacoes-notas-frequencia/issues/02-crud-avaliacoes-notas-frequencia.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam o CRUD dos três recursos, datas retroativas, vínculos de avaliação/nota e a restrição de exclusão aprovada. O escopo institucional é escolhido explicitamente; tentativas de acesso cruzado já são verificadas nos seams de serviço/HTTP do ticket original.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: o CRUD completo passou 1/1 com `npm run test:e2e:ticket -- avaliacoes-notas-frequencia/02-crud-avaliacoes-notas-frequencia`. Vídeo/log em `logs/e2e/avaliacoes-notas-frequencia/02-crud-avaliacoes-notas-frequencia/2026-10-03T10-50-15-164Z/`.
