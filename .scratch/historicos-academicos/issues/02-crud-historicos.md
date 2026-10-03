# 02 — Entregar CRUD de históricos acadêmicos
**What to build:** operadores autorizados criam, consultam, editam e excluem registros de histórico acadêmico conforme o contrato acordado.
**Blocked by:** 01 — Definir conteúdo e ciclo de vida do histórico acadêmico.
**Priority:** 1
**Status:** done
- [x] Serviço, HTTP, persistência SQLite e interface implementam o CRUD manual definido pela ADR 0021.
- [x] Vínculos com a pessoa, autorização `SUPER_ADMIN` e tenant-alvo são validados no servidor e isolados por tenant.
- [x] O histórico não é declarado oficial e não há gravação de auditoria no MVP.

## Comments

Implementado em 2026-10-03. Verificações: unitário `tests/unit/academic-history.test.ts`, SQLite `tests/sqlite/academic-history.test.ts`, HTTP `tests/http/academic-history.test.ts`, typecheck backend/frontend, testes unitários/lint/build frontend e E2E visível. A suíte completa `npm run test:all` passou; log: `logs/log-teste-2026-10-03T09-53-12-010Z.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/historicos-academicos/02-crud-historicos/2026-10-03T10-39-31-218Z/run.txt`) e produziu o vídeo `logs/e2e/historicos-academicos/02-crud-historicos/2026-10-03T10-39-31-218Z/videos/02-crud-historicos.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
