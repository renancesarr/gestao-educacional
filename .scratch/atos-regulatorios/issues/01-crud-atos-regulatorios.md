# 01 — CRUD de atos regulatórios

**Status:** ready-for-human

## Objetivo

Permitir ao `SUPER_ADMIN` cadastrar, consultar, editar e excluir atos regulatórios de uma instituição ou de seus cursos, com seleção explícita entre versões e proteção contra exclusão após uso.

## Aceite

- [x] O site permite cadastrar atos para a instituição selecionada e para um curso dessa mesma instituição.
- [x] Cada ato contém somente texto e status manual (`ativo`, `vencido`, `suspenso`, `revogado`), além da associação técnica ao tenant/curso e das versões necessárias ao histórico escolhido.
- [x] Podem coexistir vários atos na instituição ou no curso e a listagem mostra cada um sem escolher automaticamente o mais recente.
- [x] Em cada edição, o operador precisa optar por preservar a versão anterior ou sobrescrevê-la sem histórico. Versões preservadas ficam disponíveis para consulta e operações futuras; texto e status são independentes entre versões.
- [x] Exclusão remove atos sem uso e retorna conflito para ato associado a matrícula ou documento.
- [x] Leituras/escritas exigem sessão `SUPER_ADMIN`, instituição-alvo explícita e validação de pertencimento do curso ao tenant. Sem acesso cruzado entre tenants.
- [x] Persistência e testes de desenvolvimento usam SQLite; nenhuma validação PostgreSQL faz parte deste ticket.
- [x] O ticket tem teste unitário/serviço, HTTP, SQLite e um E2E visível independente com vídeo/log.

## Limites desta entrega

- Matrícula, histórico, diploma e comprovante ainda não selecionam nem registram atos. A tela de CRUD e o serviço de associação de uso estão preparados; os fluxos consumidores e o aviso/justificativa serão entregues separadamente.
- Nenhuma auditoria geral foi adicionada ao MVP.

## E2E

`frontend/cypress/e2e/tickets/atos-regulatorios/01-crud-atos-regulatorios.cy.ts`

```sh
npm run test:e2e:ticket -- atos-regulatorios/01-crud-atos-regulatorios
```

## Comments

- 2026-10-05: ciclos TDD observados para criação/listagem, edição com versão preservada, atos por curso, exclusão e bloqueio de ato usado. Os testes vermelhos falharam no endpoint/contrato ausente; após cada implementação, os mesmos testes focados passaram.
- 2026-10-05: verificações aprovadas: `npm run test:unit` (90), `npm run test:http` (13), `npm run test:sqlite` (26), `npm --prefix frontend test` (15), `npm run typecheck`, `npm --prefix frontend run typecheck` e `npm --prefix frontend run lint`.
- 2026-10-05: E2E visível aprovado (1/1) via `npm run test:e2e:ticket -- atos-regulatorios/01-crud-atos-regulatorios`. Vídeo: `logs/e2e/atos-regulatorios/01-crud-atos-regulatorios/2026-10-05T04-22-23-250Z/videos/01-crud-atos-regulatorios.cy.ts.mp4`. Log: `logs/e2e/atos-regulatorios/01-crud-atos-regulatorios/2026-10-05T04-22-23-250Z/run.txt`.
- 2026-10-05: suite PostgreSQL não executada, conforme decisão de desenvolvimento exclusivamente com SQLite. Fluxos de matrícula/documentos ainda não estão integrados ao CRUD.
