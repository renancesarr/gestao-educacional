# 02: Consultar e filtrar o catálogo institucional
**What to build:** permitir que o `SUPER_ADMIN` consulte cursos do tenant-alvo explícito, retornando o catálogo por código crescente e, opcionalmente, filtrando por item estruturado do escopo. A entrega alcança o serviço público, adaptadores, API e painel global.
**Blocked by:** 01: Criar curso institucional pelo SUPER_ADMIN.
**Status:** ready-for-human
- [x] `academic.listCourses` retorna somente os cursos do tenant-alvo, em ordem crescente de código.
- [x] O filtro estruturado de escopo retorna somente cursos ligados ao item idêntico e rejeita filtros inválidos ou fora do escopo do tenant.
- [x] A API e o painel global não reutilizam silenciosamente instituição-alvo entre consultas.
- [x] Testes unitários isolados, SQLite em memória e HTTP verificam filtro, ordem e isolamento entre tenants.
## Comments
Verificado em 2026-09-30: `npm run test:unit`, `npm run test:sqlite`, `npm run test:http` e `npm run typecheck` passaram.
