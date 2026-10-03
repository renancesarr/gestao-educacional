# 02 — Consultar alunos publicamente com resultado limitado

**What to build:** pessoas do público conseguem localizar referências acadêmicas de alunos, vendo somente nome, curso e instituição.

**Blocked by:** None — ticket 01 implementado; os critérios compartilhados estão disponíveis.

**Priority:** 1

**Status:** ready-for-human

- [x] Busca pública aceita CPF, nome, município/UF de nascimento e curso sem exigir autenticação, respeitando limites e paginação.
- [x] Cada resultado público contém somente nome do aluno, curso e instituição; nunca CPF, data de nascimento, contatos ou outros campos pessoais.
- [x] Busca pública usa um DTO e uma rota separados da resposta autenticada.
- [x] Resultados públicos incluem somente matrículas ativas em cursos ativos e não retornam identificadores internos.
- [x] Testes HTTP confirmam ausência dos campos proibidos mesmo diante de registros preenchidos.
- [x] A interface pública permite pesquisar e apresenta somente os três campos aprovados.

## Comments

- Implementados endpoint `POST /api/public/students/search`, validação dos filtros, paginação, projeção segura e adaptador SQLite.
- Criada a página `/consulta-publica-alunos`, sem exigir login; ela mostra somente nome, curso e instituição.
- A consulta pública considera matrículas ativas em cursos ativos, conforme decisão conservadora documentada na especificação; a implementação continua restrita ao adaptador SQLite do MVP.
- Verificado por `npm run test:all`: 74 testes unitários backend, 10 HTTP, 23 SQLite, 13 testes unitários frontend, typecheck/lint/build e 3 E2E visíveis no Cypress/Electron passaram.
- Log da execução: `logs/log-teste-2026-10-03T08-54-44-014Z.txt`.
