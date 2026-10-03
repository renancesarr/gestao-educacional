# 02 — Entregar CRUD de avaliações, notas e frequência
**What to build:** operadores autorizados criam, consultam, editam e excluem avaliações, notas e frequência de alunos de seus cursos e matérias.
**Blocked by:** 01 — Fechar contrato dos CRUDs de avaliação, nota e frequência.
**Priority:** 1
**Status:** ready-for-human
- [x] Serviços, HTTP, persistência e interface entregam os três CRUDs conforme os contratos aprovados.
- [x] Cada leitura/escrita valida tenant, aluno, matrícula, curso, matéria e avaliação no servidor.
- [x] Testes no serviço público, SQLite, HTTP e Cypress visível verificam o comportamento externo e isolamento.
- [x] Nenhuma operação introduz auditoria ou integração EAD.
## Comments
Seams TDD confirmados pelo usuário: serviço público de `academic`, SQLite, HTTP e Cypress em navegador visível.
Implementação concluída e validada com `npm run test:all`; log completo: `logs/log-teste-2026-10-03T07-47-48-102Z.txt`. Status `ready-for-human` para revisão do usuário.
