# 01 — Buscar alunos no escopo autenticado da instituição

**What to build:** o `SUPER_ADMIN` autenticado consegue localizar alunos por identificadores e critérios acadêmicos/de nascimento na instituição-alvo explicitamente selecionada e abrir o cadastro encontrado.

**Blocked by:** None — can start immediately.

**Priority:** 1

**Status:** done
**Decisão confirmada:** busca autenticada será realizada pelo `SUPER_ADMIN` com instituição-alvo explícita em cada operação, conforme o modelo de operação centralizada do MVP.

- [x] Buscar por CPF, nome, município/UF de nascimento e curso, permitindo combinar filtros com limites e paginação.
- [x] Cadastro HTTP e resposta do operador incluem município e UF de nascimento, com validação de entrada apropriada.
- [x] Sessão e papel `SUPER_ADMIN` são validados no servidor e cada consulta exige instituição-alvo explícita; IDs ou filtros manipulados não permitem acesso cruzado entre tenants.
- [x] A busca fornece campos acadêmicos apropriados ao operador autorizado; erros não revelam registros fora do escopo.
- [x] Testes cobrem filtros, combinações, paginação, autorização, tenant explícito e persistência SQLite.
- [x] A interface web oferece os filtros e permite abrir o cadastro retornado.

## Comments

- Decisão do usuário: a busca autenticada será operada pelo `SUPER_ADMIN` com `targetTenantId` explícito, alinhada às demais operações globais do MVP.
- Trabalho iniciado em TDD; os ciclos serão registrados ao concluir o ticket.
- Implementado: serviço composto de busca em `people`, consulta de vínculos pelo contrato público de `academic`, rota `POST /api/platform/students/search`, campos de nascimento no cadastro HTTP e formulário operacional com abertura do cadastro.
- Verificado: `npm run test:all` passou integralmente, incluindo 73 testes unitários backend, 9 HTTP, 22 SQLite, typecheck/lint/build frontend, 12 testes unitários frontend e 2 E2E visíveis no Cypress/Electron.
- Log da execução: `logs/log-teste-2026-10-03T08-39-12-253Z.txt`.
- Nota de ambiente: o diretório não foi reconhecido como repositório Git; nenhum comando de alteração de histórico foi executado.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-54-00-058Z/run.txt`) e produziu o vídeo `logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-54-00-058Z/videos/01-busca-autenticada.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
