# 01: Evoluir o ciclo de vida do curso
**What to build:** O `SUPER_ADMIN` consegue consultar, renomear e ativar/desativar cursos da instituição-alvo. Cursos inativos continuam visíveis para gestão; código e item do escopo educacional permanecem estáveis.
**Blocked by:** None (can start immediately).
**Status:** done
- [x] Curso novo inicia ativo e a consulta do catálogo retorna também cursos inativos, mantendo ordem por código e filtro de escopo existentes.
- [x] O `SUPER_ADMIN` altera somente nome e `ativo`; tentativa de alterar código ou escopo é recusada.
- [x] Testes unitários isolados, SQLite e HTTP cobrem os comportamentos observáveis e recusas relevantes.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/ppc-matricula-direta/01-ciclo-de-vida-do-curso/2026-10-03T11-07-55-623Z/run.txt`) e produziu o vídeo `logs/e2e/ppc-matricula-direta/01-ciclo-de-vida-do-curso/2026-10-03T11-07-55-623Z/videos/01-ciclo-de-vida-do-curso.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
