# 02: Consultar e filtrar o catálogo institucional
**What to build:** permitir que o `SUPER_ADMIN` consulte cursos do tenant-alvo explícito, retornando o catálogo por código crescente e, opcionalmente, filtrando por item estruturado do escopo. A entrega alcança o serviço público, adaptadores, API e painel global.
**Blocked by:** 01: Criar curso institucional pelo SUPER_ADMIN.
**Status:** done
- [x] `academic.listCourses` retorna somente os cursos do tenant-alvo, em ordem crescente de código.
- [x] O filtro estruturado de escopo retorna somente cursos ligados ao item idêntico e rejeita filtros inválidos ou fora do escopo do tenant.
- [x] A API e o painel global não reutilizam silenciosamente instituição-alvo entre consultas.
- [x] Testes unitários isolados, SQLite em memória e HTTP verificam filtro, ordem e isolamento entre tenants.
## Comments
Verificado em 2026-09-30: `npm run test:unit`, `npm run test:sqlite`, `npm run test:http` e `npm run typecheck` passaram.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/catalogo-cursos/02-consultar-catalogo-institucional/2026-10-03T10-57-24-975Z/run.txt`) e produziu o vídeo `logs/e2e/catalogo-cursos/02-consultar-catalogo-institucional/2026-10-03T10-57-24-975Z/videos/02-consultar-catalogo-institucional.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
