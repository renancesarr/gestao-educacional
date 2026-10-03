# 01: Criar curso institucional pelo SUPER_ADMIN
**What to build:** permitir que o `SUPER_ADMIN` crie um curso para uma instituição-alvo explícita, com nome, código e item estruturado do escopo. O curso só pode usar um escopo declarado pelo tenant; código é único permanentemente no tenant. A entrega alcança o serviço público, adaptadores, API e painel global, sem auditoria própria do catálogo neste MVP.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] `academic.createCourse` aceita curso compatível com o escopo e rejeita entrada inválida, alvo inexistente, escopo externo e código duplicado no mesmo tenant.
- [x] A criação mantém tenants isolados e permite o mesmo código em tenants diferentes.
- [x] Testes unitários isolados, SQLite em memória e HTTP verificam o comportamento observável.
## Comments
Verificado em 2026-09-30: `npm run test:unit`, `npm run test:sqlite`, `npm run test:http` e `npm run typecheck` passaram.
