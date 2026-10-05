# 37 — E2E: seleção de atos regulatórios na matrícula

**Status:** ready-for-human

**Ticket de origem:** `atos-regulatorios/02-selecao-atos-na-matricula`

## Aceite

- Spec independente cobre seleção dos atos institucional e do curso no fluxo de matrícula.
- A matrícula registra snapshots dos atos escolhidos e exige justificativa para permitir ato ausente ou inativo.
- A exclusão de ato usado é bloqueada e a consulta posterior mostra o texto/status usados.
- Runner seletivo executa o spec em tela virtual no Linux, sem janela no desktop, e gera MP4 e log locais.

## Evidência

- Spec: `frontend/cypress/e2e/tickets/atos-regulatorios/02-selecao-atos-na-matricula.cy.ts`
- Comando: `npm run test:e2e:ticket -- atos-regulatorios/02-selecao-atos-na-matricula`

- Execução aprovada (1/1), 2026-10-05. Vídeo: `logs/e2e/atos-regulatorios/02-selecao-atos-na-matricula/2026-10-05T05-48-36-809Z/videos/02-selecao-atos-na-matricula.cy.ts.mp4`.
- Log: `logs/e2e/atos-regulatorios/02-selecao-atos-na-matricula/2026-10-05T05-48-36-809Z/run.txt`.
