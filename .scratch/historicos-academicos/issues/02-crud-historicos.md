# 02 — Entregar CRUD de históricos acadêmicos
**What to build:** operadores autorizados criam, consultam, editam e excluem registros de histórico acadêmico conforme o contrato acordado.
**Blocked by:** 01 — Definir conteúdo e ciclo de vida do histórico acadêmico.
**Priority:** 1
**Status:** ready-for-human
- [x] Serviço, HTTP, persistência SQLite e interface implementam o CRUD manual definido pela ADR 0021.
- [x] Vínculos com a pessoa, autorização `SUPER_ADMIN` e tenant-alvo são validados no servidor e isolados por tenant.
- [x] O histórico não é declarado oficial e não há gravação de auditoria no MVP.

## Comments

Implementado em 2026-10-03. Verificações: unitário `tests/unit/academic-history.test.ts`, SQLite `tests/sqlite/academic-history.test.ts`, HTTP `tests/http/academic-history.test.ts`, typecheck backend/frontend, testes unitários/lint/build frontend e E2E visível. A suíte completa `npm run test:all` passou; log: `logs/log-teste-2026-10-03T09-53-12-010Z.txt`.
