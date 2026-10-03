# 02 — Desligar auditoria da identidade de plataforma e onboarding
**What to build:** provisionar, ativar, autenticar e recuperar a conta `SUPER_ADMIN`, além de criar uma instituição, sem gravar eventos de auditoria no MVP.
**Blocked by:** 01 — Desligar auditoria dos fluxos de pessoas, para consolidar a composição HTTP/fixture sem dependências de auditoria.
**Priority:** 1
**Status:** ready-for-agent
- [x] Operações de ciclo de vida de `SUPER_ADMIN` não criam eventos de auditoria tenant-scoped nem de plataforma.
- [x] Criar instituição, escopo e conta inicial permanece atômico para os dados necessários, sem depender de inserts de auditoria.
- [x] Testes comprovam provisionamento, ativação, autenticação, recuperação, onboarding e persistência funcional sem requisito de auditoria.
- [x] O requisito e o módulo de auditoria do sistema completo permanecem nos documentos e não são removidos.
## Comments
Ticket alinhado à ADR 0016 e dividido do ticket 01 por fronteira de identidade/onboarding.
Implementado em 2026-10-03. `SUPER_ADMIN` e onboarding não gravam eventos, os stores preservam as tabelas para histórico/retomada futura, e o CLI não coleta mais identidade de operador para auditoria. Verificações: 55 testes unitários, 6 testes HTTP, 16 testes SQLite, typecheck backend/frontend, lint frontend e E2E visível (1/1) aprovados pela suíte `npm run test:all`.
