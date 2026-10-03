# 01 — Preparar fixture SQLite reduzido e testar somente listagens do catálogo

**What to build:** a suíte pode consultar um catálogo SQLite reduzido e estável, com cobertura territorial de escolas e IES, sem refazer importações em lote ou cadastros manuais para preparar os testes.

**Blocked by:** None — the current public listing contracts are sufficient for this ticket.

**Priority:** 1

**Status:** done
- [x] Criar um fixture SQLite separado da base operacional, com uma escola por cada combinação município/UF presente no CSV do INEP (5.567 nas fontes atuais) e todos os campos/etapas publicados dessa escola.
- [x] Incluir uma IES por cada uma das 27 UFs, escolhida deterministicamente pelo menor código e-MEC entre as IES com ofertas; incluir o registro completo e todas as ofertas associadas a cada IES (5.358 ofertas nos arquivos atuais).
- [x] Preservar códigos e rótulos externos como publicados, sem criar tenants, pessoas, vínculos, matrículas ou cursos operacionais.
- [x] Substituir os testes SQLite e Cypress do catálogo que importavam CSVs ou inseriam registros durante a execução por testes de leitura/listagem sobre o fixture; as conexões de teste são read-only.
- [x] Verificar pelos contratos públicos a busca escolar por município/UF e as listagens de IES/ofertas dentro do limite atual de 100 itens.
- [x] Manter a suíte de listagem independente dos CSVs e do processo de construção do fixture; os testes SQLite/E2E não reexecutam o importador INEP/e-MEC. Testes unitários de parser continuam cobrindo o formato de origem.
- [x] Validar uma vez a base: contagens, unicidade da escola por município/UF, uma IES por UF, ofertas associadas, integridade SQLite e ausência de tabelas operacionais.
- [x] Substituir apenas eventual fixture antigo do catálogo em `tests/fixtures`; não remover nem alterar o banco SQLite operacional. A inspeção inicial encontrou zero arquivos SQLite persistidos na árvore do projeto.

## Comments

- 2026-10-03: fixture gerado pelo script de construção, 5,7 MB, com 5.567 escolas, 27 IES e 5.358 ofertas. `PRAGMA integrity_check` retornou `ok`; leitura por município/UF, listagem das 27 IES e primeira página de ofertas passaram com banco read-only. `npm run test:sqlite` (17 testes) e Cypress headed (1 jornada visível) passaram. Nenhum arquivo SQLite anterior existia no projeto; o banco operacional não foi tocado. Pronto para revisão humana.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/catalogo-listagem-sqlite/01-fixture-catalogo-e-testes-listagem/2026-10-03T11-10-15-508Z/run.txt`) e produziu o vídeo `logs/e2e/catalogo-listagem-sqlite/01-fixture-catalogo-e-testes-listagem/2026-10-03T11-10-15-508Z/videos/01-fixture-catalogo-e-testes-listagem.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
