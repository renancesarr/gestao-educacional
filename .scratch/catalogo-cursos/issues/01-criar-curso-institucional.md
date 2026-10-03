# 01: Criar curso institucional pelo SUPER_ADMIN
**What to build:** permitir que o `SUPER_ADMIN` crie um curso para uma instituição-alvo explícita, com nome, código e item estruturado do escopo. O curso só pode usar um escopo declarado pelo tenant; código é único permanentemente no tenant. A entrega alcança o serviço público, adaptadores, API e painel global, sem auditoria própria do catálogo neste MVP.
**Blocked by:** None (can start immediately).
**Status:** done
- [x] `academic.createCourse` aceita curso compatível com o escopo e rejeita entrada inválida, alvo inexistente, escopo externo e código duplicado no mesmo tenant.
- [x] A criação mantém tenants isolados e permite o mesmo código em tenants diferentes.
- [x] Testes unitários isolados, SQLite em memória e HTTP verificam o comportamento observável.
## Comments
Verificado em 2026-09-30: `npm run test:unit`, `npm run test:sqlite`, `npm run test:http` e `npm run typecheck` passaram.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/catalogo-cursos/01-criar-curso-institucional/2026-10-03T10-55-45-288Z/run.txt`) e produziu o vídeo `logs/e2e/catalogo-cursos/01-criar-curso-institucional/2026-10-03T10-55-45-288Z/videos/01-criar-curso-institucional.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
