# 01: Executar integração de identidade e sessões com SQLite
**What to build:** a equipe consegue verificar localmente o comportamento de login institucional e sessões persistidas em SQLite em memória, sem depender de um servidor ou serviço de banco externo.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] SQLite em memória implementa o contrato de persistência usado pelos fluxos de identidade institucional e sessão sem expor tipos ou detalhes SQLite ao domínio.
- [x] Login, leitura de sessão e encerramento de sessão funcionam através das interfaces públicas existentes.
- [x] Os testes de integração usam uma base SQLite isolada por teste e demonstram que sessões e contas permanecem tenant-scoped.
## Comments
O teste de serviço público primeiro falhou porque o adaptador não existia e passou após sua implementação; o cenário de contas homônimas entre tenants confirma isolamento e logout independente. `npm run test:sqlite` (2 testes), `npm test` (36 testes unitários) e `npm run typecheck` passaram.
