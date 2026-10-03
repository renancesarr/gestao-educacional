# 02 — Entregar CRUD e validação de credenciais acadêmicas

**What to build:** operadores autorizados criam, consultam, editam e excluem credenciais, inclusive emitidas, e a validação pública reflete o estado aprovado.

**Blocked by:** 01 — Definir efeitos de edição e exclusão de credencial emitida.

**Priority:** 1

**Status:** ready-for-human

- [x] Serviço, HTTP, persistência SQLite e interface implementam CRUD incluindo edição/exclusão após emissão.
- [x] Validação pública reflete emissão, edição e exclusão; tokens antigos e excluídos retornam 404.
- [x] Respostas públicas contêm apenas os campos mínimos do glossário e ADR 0020.
- [x] Testes cobrem isolamento, autorização, integridade, hash e rotação do token; a URL atual é verificada no E2E como destino que pode ser usado por QR.
- [x] Credenciais permanecem demonstrativas; nenhuma auditoria ou integração EAD foi adicionada.

**Limitação:** a interface não renderiza uma imagem QR; apresenta o link de validação atual.

## Comments

Implementado em 2026-10-03. Evidências: `tests/unit/credential.test.ts`, `tests/sqlite/credential.test.ts`, `tests/http/credential.test.ts` e jornada E2E visível de emissão/edição/validação/exclusão. A execução da suíte completa deve ser repetida depois do ajuste final no E2E.
