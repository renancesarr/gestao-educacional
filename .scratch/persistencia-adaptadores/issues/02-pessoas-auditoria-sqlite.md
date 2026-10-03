# 02: Persistir pessoas e auditoria em SQLite

**What to build:** os fluxos existentes de cadastro e consulta de pessoas podem ser verificados com o adaptador SQLite local, preservando o isolamento institucional e a gravação consistente dos eventos de auditoria.

**Blocked by:** 01 — Executar integração de identidade e sessões com SQLite.

**Status:** done
- [x] O adaptador SQLite implementa os contratos existentes de pessoas e leitura de auditoria sem propagar detalhes de SQLite aos serviços.
- [x] Cadastro e evento obrigatório de auditoria são atômicos; uma falha de persistência não deixa pessoa criada sem seu evento correspondente.
- [x] Consultas e identificadores respeitam `tenantId`, inclusive quando outro tenant tenta consultar o mesmo identificador ou ID.
- [x] Testes de integração exercitam os casos públicos contra SQLite em memória isolado por teste.
- [x] Os testes unitários permanecem independentes de SQLite e dos demais bancos.

## Comments

Implementado o adaptador SQLite para pessoas e eventos de auditoria. Os testes atravessam os serviços públicos; verificam criação e consulta, conflito sem sobrescrita por identificador institucional, identificador igual em tenants diferentes, consulta cruzada e rollback após falha de auditoria. Ciclo TDD para duplicidade: teste falhou porque o adaptador tratava apenas conflito de CPF; passou após detectar os dois identificadores antes da gravação. `npm run test:sqlite`, `npm test` e `npm run typecheck` passaram.

O ticket 03 ampliou o esquema compartilhado de `audit_events` para aceitar também os eventos institucionais e de criação de conta, mantendo as restrições e consultas de auditoria de pessoas.

Revisão pela ADR 0016: este ticket descreve a implementação histórica do adaptador. Persistir ou consultar auditoria não é requisito do MVP vigente; remover os usos do runtime por ticket próprio, sem retirar o requisito do sistema completo.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/run.txt`) e produziu o vídeo `logs/e2e/persistencia-adaptadores/02-pessoas-auditoria-sqlite/2026-10-03T11-37-55-815Z/videos/02-pessoas-auditoria-sqlite.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
