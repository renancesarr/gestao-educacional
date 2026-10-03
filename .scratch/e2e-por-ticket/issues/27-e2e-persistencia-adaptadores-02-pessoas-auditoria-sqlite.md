# 27 — E2E de validar persistência de pessoas sem auditoria no mvp
**What to build:** O cadastro e a consulta persistem o comportamento funcional e mantêm isolamento; nenhuma tela/rota exige trilha de auditoria.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/persistencia-adaptadores/issues/02-pessoas-auditoria-sqlite.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1): cadastro e leitura após recarga persistem no adaptador SQLite; a pessoa fica disponível ao tenant e a rota de auditoria não existe (404). Evidência: `logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/videos/02-pessoas-auditoria-sqlite.cy.ts.mp4`; log: `logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/run.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/videos/02-pessoas-auditoria-sqlite.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
