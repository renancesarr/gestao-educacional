# 01: Evoluir o ciclo de vida do curso
**What to build:** O `SUPER_ADMIN` consegue consultar, renomear e ativar/desativar cursos da instituição-alvo. Cursos inativos continuam visíveis para gestão; código e item do escopo educacional permanecem estáveis.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] Curso novo inicia ativo e a consulta do catálogo retorna também cursos inativos, mantendo ordem por código e filtro de escopo existentes.
- [x] O `SUPER_ADMIN` altera somente nome e `ativo`; tentativa de alterar código ou escopo é recusada.
- [x] Testes unitários isolados, SQLite e HTTP cobrem os comportamentos observáveis e recusas relevantes.
