# 02 — Desligar auditoria da identidade de plataforma e onboarding
**What to build:** provisionar, ativar, autenticar e recuperar a conta `SUPER_ADMIN`, além de criar uma instituição, sem gravar eventos de auditoria no MVP.
**Blocked by:** 01 — Desligar auditoria dos fluxos de pessoas, para consolidar a composição HTTP/fixture sem dependências de auditoria.
**Priority:** 1
**Status:** done
- [x] Operações de ciclo de vida de `SUPER_ADMIN` não criam eventos de auditoria tenant-scoped nem de plataforma.
- [x] Criar instituição, escopo e conta inicial permanece atômico para os dados necessários, sem depender de inserts de auditoria.
- [x] Testes comprovam provisionamento, ativação, autenticação, recuperação, onboarding e persistência funcional sem requisito de auditoria.
- [x] O requisito e o módulo de auditoria do sistema completo permanecem nos documentos e não são removidos.
## Comments
Ticket alinhado à ADR 0016 e dividido do ticket 01 por fronteira de identidade/onboarding.
Implementado em 2026-10-03. `SUPER_ADMIN` e onboarding não gravam eventos, os stores preservam as tabelas para histórico/retomada futura, e o CLI não coleta mais identidade de operador para auditoria. Verificações: 55 testes unitários, 6 testes HTTP, 16 testes SQLite, typecheck backend/frontend, lint frontend e E2E visível (1/1) aprovados pela suíte `npm run test:all`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/remocao-auditoria-mvp/02-identidade-e-onboarding/2026-10-03T11-26-56-779Z/run.txt`) e produziu o vídeo `logs/e2e/remocao-auditoria-mvp/02-identidade-e-onboarding/2026-10-03T11-26-56-779Z/videos/02-identidade-e-onboarding.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
