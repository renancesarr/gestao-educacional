# 01 — Desligar auditoria dos fluxos de pessoas
**What to build:** cadastro e consulta de pessoas funcionam sem gerar eventos de auditoria e sem expor endpoints ou permissões de consulta de auditoria no MVP.
**Blocked by:** None — can start immediately.
**Priority:** 1
**Status:** done
- [x] Criação local e global de pessoas persiste somente o registro funcional; falha de uma infraestrutura de auditoria não participa nem bloqueia a operação.
- [x] Rotas de consulta de auditoria de pessoas deixam de ser expostas; cadastro, busca por identificador e consulta por ID continuam autorizados e isolados por tenant.
- [x] Permissões e wiring do MVP não oferecem `audit:read`; o módulo `audit` e a exigência sistêmica futura permanecem preservados.
- [x] Testes unitários, HTTP e SQLite cobrem os fluxos funcionais sem eventos ou rotas de auditoria.
## Comments
Ticket alinhado à ADR 0016. Registros históricos existentes são preservados; não fazer migração destrutiva.
Implementado em 2026-10-03. Verificações locais: typecheck e 27 testes unitários/HTTP/SQLite relacionados aprovados; depois da integração com identidade/onboarding, a suíte integral com E2E visível também passou. A consulta da rota global não é roteada; sem sessão tenant, a camada HTTP retorna 401 antes do fallback 404.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/remocao-auditoria-mvp/01-pessoas/2026-10-03T11-25-46-703Z/run.txt`) e produziu o vídeo `logs/e2e/remocao-auditoria-mvp/01-pessoas/2026-10-03T11-25-46-703Z/videos/01-pessoas.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
