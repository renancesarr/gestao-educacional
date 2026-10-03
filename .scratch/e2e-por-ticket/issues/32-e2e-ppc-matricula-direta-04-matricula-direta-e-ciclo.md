# 32 — E2E de matricular pessoa diretamente em curso
**What to build:** O `SUPER_ADMIN` cria matrícula individual elegível, consulta o vínculo e realiza transições manuais permitidas.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/ppc-matricula-direta/issues/04-matricula-direta-e-ciclo.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam matrícula em curso elegível e transições ativa → trancada → ativa → cancelada, sem reabrir estado final.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- ppc-matricula-direta/04-matricula-direta-e-ciclo`. Vídeo/log em `logs/e2e/ppc-matricula-direta/04-matricula-direta-e-ciclo/2026-10-03T11-06-14-228Z/`.
