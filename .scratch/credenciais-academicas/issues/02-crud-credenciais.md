# 02 — Entregar CRUD e validação de credenciais acadêmicas

**What to build:** operadores autorizados criam, consultam, editam e excluem credenciais, inclusive emitidas, e a validação pública reflete o estado aprovado.

**Blocked by:** 01 — Definir efeitos de edição e exclusão de credencial emitida.

**Priority:** 1

**Status:** done
- [x] Serviço, HTTP, persistência SQLite e interface implementam CRUD incluindo edição/exclusão após emissão.
- [x] Validação pública reflete emissão, edição e exclusão; tokens antigos e excluídos retornam 404.
- [x] Respostas públicas contêm apenas os campos mínimos do glossário e ADR 0020.
- [x] Testes cobrem isolamento, autorização, integridade, hash e rotação do token; a URL atual é verificada no E2E como destino que pode ser usado por QR.
- [x] Credenciais permanecem demonstrativas; nenhuma auditoria ou integração EAD foi adicionada.

**Limitação:** a interface não renderiza uma imagem QR; apresenta o link de validação atual.

## Comments

Implementado em 2026-10-03. Evidências: `tests/unit/credential.test.ts`, `tests/sqlite/credential.test.ts`, `tests/http/credential.test.ts` e jornada E2E visível de emissão/edição/validação/exclusão. A suíte completa `npm run test:all` passou com o E2E visível; log: `logs/log-teste-2026-10-03T09-53-12-010Z.txt`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/credenciais-academicas/02-crud-credenciais/2026-10-03T10-39-50-700Z/run.txt`) e produziu o vídeo `logs/e2e/credenciais-academicas/02-crud-credenciais/2026-10-03T10-39-50-700Z/videos/02-crud-credenciais.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
