# 01: Executar integração de identidade e sessões com SQLite
**What to build:** a equipe consegue verificar localmente o comportamento de login institucional e sessões persistidas em SQLite em memória, sem depender de um servidor ou serviço de banco externo.
**Blocked by:** None (can start immediately).
**Status:** done
- [x] SQLite em memória implementa o contrato de persistência usado pelos fluxos de identidade institucional e sessão sem expor tipos ou detalhes SQLite ao domínio.
- [x] Login, leitura de sessão e encerramento de sessão funcionam através das interfaces públicas existentes.
- [x] Os testes de integração usam uma base SQLite isolada por teste e demonstram que sessões e contas permanecem tenant-scoped.
## Comments
O teste de serviço público primeiro falhou porque o adaptador não existia e passou após sua implementação; o cenário de contas homônimas entre tenants confirma isolamento e logout independente. `npm run test:sqlite` (2 testes), `npm test` (36 testes unitários) e `npm run typecheck` passaram.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/persistencia-adaptadores/01-identidade-sessoes-sqlite/2026-10-03T11-35-54-275Z/run.txt`) e produziu o vídeo `logs/e2e/persistencia-adaptadores/01-identidade-sessoes-sqlite/2026-10-03T11-35-54-275Z/videos/01-identidade-sessoes-sqlite.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
