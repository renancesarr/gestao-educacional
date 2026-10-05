# E2E isolado por ticket com vídeo de evidência
Status: ready-for-human

## Problem Statement

A suíte E2E atual concentra fluxos diferentes em uma jornada Cypress, não grava vídeo (`video` está desativado) e é executada junto da suíte completa. Assim, ao validar uma alteração, é difícil executar apenas o fluxo afetado e entregar uma evidência visual ligada ao ticket.

## Solution

Manter um teste Cypress E2E separado para cada ticket funcional ativo. O conjunto inicial tinha 33 specs; o CRUD de atos regulatórios acrescenta o spec do ticket 34 e a seleção desses atos na matrícula acrescenta o spec do ticket 35. O identificador do ticket local seleciona um único arquivo de teste e executa esse fluxo no Electron dentro de uma tela virtual Xvfb. Cada execução produz um vídeo MP4 e um log textual em diretório único por ticket/data/hora, sem abrir uma janela no desktop do usuário. O uso normal durante a implementação é executar apenas o E2E do ticket alterado; a suíte completa permanece disponível para verificações amplas explicitamente necessárias.

## User Stories

1. Como mantenedor, quero executar o E2E de um ticket pelo identificador dele, para validar só o fluxo que alterei.
2. Como revisor, quero um vídeo da jornada sem uma janela de navegador aberta no meu desktop, para poder assistir à evidência depois.
3. Como revisor, quero um vídeo mesmo quando o teste passa, para poder assistir à evidência depois.
4. Como implementador, quero que cada ticket tenha seu próprio teste/spec, para localizar falhas sem navegar por uma jornada monolítica.
5. Como mantenedor, quero que uma execução grave log e vídeo com o identificador e horário do ticket, para não sobrescrever evidências anteriores.
6. Como responsável pela fixture, quero começar de estado-base local preparado, para não repetir cadastros já cobertos por testes próprios.
7. Como responsável por dados, quero que as jornadas usem dados fictícios e fixtures locais, sem alterar o banco operacional.
8. Como responsável pela privacidade, quero que vídeos e logs permaneçam locais e fora do versionamento, pois podem conter dados de demonstração.
9. Como implementador, quero receber erro claro quando o identificador não existe ou não tem spec, para não obter falso sucesso por teste vazio.
10. Como revisor de segurança, quero que cada jornada valide autorização, escopo da instituição e dados públicos mínimos quando esses critérios pertencem ao ticket.
11. Como operador do desenvolvimento, quero manter a suíte completa disponível para regressões amplas sem executá-la a cada pequena alteração.

## Implementation Decisions

- A fronteira E2E é o navegador real de Cypress/Electron usando interface e backend local de fixture; testes não substituem unitários, HTTP nem SQLite onde esses cobrem regras e persistência com maior precisão.
- O workspace Cypress mantém um spec independente por ticket em `cypress/e2e/tickets/<feature>/<issue>.cy.ts`, com uma jornada `it` focada por spec. O ID usado no comando é o caminho do ticket sob `.scratch`, sem extensão.
- Um comando direcionado aceita um ID de ticket por execução, valida o caminho dentro do tracker e exige o spec correspondente. Executa Cypress com exatamente um `--spec`, em Electron dentro de uma tela virtual Xvfb.
- A gravação Cypress fica habilitada para `cypress run`. O comando direcionado usa uma pasta nova `logs/e2e/<feature>/<issue>/<timestamp>/`, com log do processo e vídeo MP4 do spec. Cada execução conserva seus arquivos e imprime seus caminhos. A pasta `logs/` já é ignorada pelo Git.
- A execução da jornada usa o estado-base de teste preparado e validado. Só fluxos cujo comportamento é o provisionamento/ativação ou preparação de fixture poderão preparar esse estado específico; as demais jornadas não repetem interativamente esses cadastros.
- Os 33 testes originais correspondiam aos tickets funcionais `ready-for-human` identificados na implantação inicial deste pacote. O novo CRUD de atos regulatórios acrescenta um spec independente; tickets `wontfix` não geram testes de comportamento ativo, e tickets cujo escopo foi substituído verificam a decisão vigente, como a ausência de integração operacional e-MEC ou de auditoria no MVP.
- Para uso diário, rode o teste E2E do ticket alterado e as verificações unitárias/HTTP/SQLite diretamente relacionadas. `npm run test:all` fica reservado para uma regressão ampla, integração de mudanças ou solicitação explícita.
- Não executar verificações PostgreSQL durante desenvolvimento ou teste; o runtime e as fixtures usam SQLite.

## Testing Decisions

- Testes verificam comportamento observável no navegador através da fronteira Cypress, sem assertions em internals ou dependências privadas.
- Cada spec cobre somente o fluxo de seu ticket de origem e deve começar de uma fixture determinística, declarada e validada antes da ação principal.
- Teste por ticket deve falhar se o spec não existir, se nenhum teste for descoberto ou se o fluxo depender de cadastro base ausente.
- Testar o comando runner por unidade: parsing do ID, rejeição de traversal/ID inválido, correspondência ticket-spec, montagem do comando seletivo e destinos únicos de log/vídeo.
- A evidência E2E inclui resultado Cypress e vídeo presente tanto em sucesso quanto em falha, sem janela visível no desktop do usuário.
- Prior art: `frontend/cypress.config.ts`, jornada E2E existente, backend E2E com cenário acadêmico local, `scripts/run-tests.mjs` e `npm run test:all`.

## Out of Scope

- Reescrever critérios funcionais dos 33 tickets originais ou adicionar regras acadêmicas.
- Executar E2E de tickets `wontfix` ou de especificações superadas como se fossem requisitos ativos.
- Substituir a cobertura unitária, HTTP ou SQLite por E2E.
- Cypress Cloud, publicação automática de vídeos, armazenamento remoto ou commit de vídeos no Git.
- Alterar o banco operacional ou importar CSVs como parte da execução normal de um E2E.
- Rodar todos os 33 testes a cada mudança rotineira.

## Further Notes

O pacote possui um ticket de infraestrutura e um ticket E2E por ticket funcional coberto. A base original tinha 33 specs; os tickets de CRUD de atos e seleção de atos na matrícula acrescentam mais dois. Cada jornada é executada individualmente em Electron dentro de Xvfb no Linux, sem janela no desktop, com MP4 e log locais.

## Revisão e próximo trabalho

Em 2026-10-03, os 33 specs de ticket foram revisados com execução individual aprovada, log e MP4. O ticket de infraestrutura e os 33 tickets E2E foram aceitos. Dois tickets funcionais antigos do e-MEC foram reclassificados como `wontfix` pela ADR 0017; E2Es correspondentes validam a remoção da operação.

A revisão ampla executou os 34 specs originais no mesmo backend em memória: 30 passaram e quatro falharam após estado compartilhado (avaliação duplicada, curso extra, conta SUPER_ADMIN já ativada e colaborador de cenário alterado). Como a regra aprovada é executar somente o E2E do ticket afetado, o E2E amplo continua limitado à jornada-base; os 35 specs funcionais são executados pelo runner seletivo.
