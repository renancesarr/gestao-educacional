# 06 — E2E de consultar e filtrar cursos institucionais
**What to build:** O operador consulta cursos ordenados por código e filtra pelo escopo, sem misturar ou reutilizar silenciosamente a instituição-alvo.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/catalogo-cursos/issues/02-consultar-catalogo-institucional.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam ordem crescente, filtro por escopo e isolamento entre os tenants selecionados.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- catalogo-cursos/02-consultar-catalogo-institucional`. Vídeo/log em `logs/e2e/catalogo-cursos/02-consultar-catalogo-institucional/2026-10-03T10-57-24-975Z/`.
