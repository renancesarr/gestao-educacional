# 13 — E2E de verificar efeitos de editar/excluir credencial
**What to build:** Emitir, editar e validar uma credencial demonstra mudança de hash/token, invalidação do link antigo e resposta genérica para token excluído.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** ready-for-human
**Ticket de origem:** `.scratch/credenciais-academicas/issues/01-contrato-de-validacao.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam os critérios do ticket de origem e as decisões vigentes das ADRs, sem validar requisito superado.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

- 2026-10-03: Cypress headed passou (1/1): edição invalida a rota do token anterior, a consulta pública da credencial atual omite CPF e a exclusão retorna 404. Evidência: `logs/e2e/credenciais-academicas/01-contrato-de-validacao/2026-10-03T11-33-02-296Z/videos/01-contrato-de-validacao.cy.ts.mp4`; log: `logs/e2e/credenciais-academicas/01-contrato-de-validacao/2026-10-03T11-33-02-296Z/run.txt`.
