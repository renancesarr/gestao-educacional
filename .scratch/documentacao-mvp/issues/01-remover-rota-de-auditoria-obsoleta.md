# Remover endpoint de auditoria obsoleto da documentação do MVP
**Priority:** 2
**Status:** ready-for-human

## What to build
Remover da tabela HTTP de `docs/EXECUCAO.md` a rota `GET /api/people/:id/audit`, que responde 404 e não está disponível no MVP. Preservar a explicação de que auditoria continua prevista para o sistema completo.

## Acceptance criteria
- [x] A tabela HTTP não lista `/api/people/:id/audit` como endpoint legado.
- [x] O texto continua explícito que as rotas de auditoria estão fora do MVP.
- [x] Uma busca documental confirma que a rota não aparece como contrato ativo em `docs/EXECUCAO.md`.

## Comments

- 2026-10-04: removida a linha obsoleta da tabela HTTP; as notas sobre auditoria fora do MVP permanecem. `rg -n '/api/people/:id/audit' docs/EXECUCAO.md` não encontra ocorrência.
