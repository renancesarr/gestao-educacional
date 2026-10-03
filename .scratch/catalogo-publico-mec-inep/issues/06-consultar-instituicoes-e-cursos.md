# 06 — Consultar instituições e cursos no catálogo de referência

**What to build:** operadores conseguem localizar instituições e ofertas acadêmicas do catálogo público com os critérios aprovados, sem misturar os dados de referência aos cadastros dos tenants.

**Blocked by:** 01 — Importar e pesquisar o catálogo de escolas do INEP; 05 — Importar IES e cursos de graduação do e-MEC.

**Priority:** 1

**Status:** wontfix
- [x] Pesquisar instituição por nome, município/UF e nome combinado com município/UF.
- [x] Pesquisar instituição por curso e combinar curso com município/UF da oferta.
- [x] Resultados apresentam fonte/situação e diferenciam IES e ofertas de curso.
- [x] Consultas têm paginação/limites e usam somente campos importados para identificação e pesquisa.
- [x] A consulta não cria nem altera tenants, catálogo operacional, vínculos de aluno ou matrículas.
- [x] Testes HTTP, SQLite, cliente e interface visível verificam filtros, resultados, limites e consulta do catálogo.

## Comments

- 2026-10-03: a decisão de escopo posterior da ADR 0017 retirou operações de integração e-MEC do MVP. O código de consulta e-MEC implementado será retirado da interface/API de operação pelo ticket 01 de `.scratch/cursos-padrao-dados-locais/`; o fixture de referência fica reservado a consultas locais de teste/demonstração.

- Implementados `GET /api/platform/public-catalog/emec/search` e busca/paginação no painel SUPER_ADMIN. Página da interface: 20 registros; limite da API: 100. Combina nome da IES, curso e localidade da oferta; a autenticação e autorização ficam no servidor.
- Verificações: `npm run test:all` passou, incluindo 66 testes unitários backend, 8 HTTP, 18 SQLite, 12 testes frontend, typechecks, lint, build Next.js e Cypress headed (1 jornada passou). O log completo foi salvo em `logs/log-teste-2026-10-03T06-15-41-777Z.txt`. Testes HTTP e SQLite direcionados também passaram.

- **Reclassificação de escopo (2026-10-03):** `wontfix`. A ADR 0017 retirou operação/importação/consulta e-MEC do MVP; as IES/ofertas permanecem apenas no fixture local read-only. O ticket de substituição `.scratch/cursos-padrao-dados-locais/issues/01-sem-novas-integracoes-de-catalogo.md` e os E2Es 09/10 verificam a retirada. Não marcar como funcionalidade `done`, pois a proposta original foi superada.
