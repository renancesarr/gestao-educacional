# 36 — E2E: CRUD de atos regulatórios

**Status:** ready-for-human

**Ticket de origem:** `atos-regulatorios/01-crud-atos-regulatorios`

## Aceite

- Spec independente cobre criação de ato institucional e de curso, edição preservando versão anterior e edição sem preservar versão.
- Runner seletivo executa somente esse spec em Electron numa tela virtual Xvfb e gera vídeo MP4 e log textual locais.
- A jornada usa a fixture acadêmica já preparada e não recria a instituição ou o curso.

## Evidência

- Spec: `frontend/cypress/e2e/tickets/atos-regulatorios/01-crud-atos-regulatorios.cy.ts`
- Comando: `npm run test:e2e:ticket -- atos-regulatorios/01-crud-atos-regulatorios`
- Execução aprovada (1/1), 2026-10-05. Vídeo: `logs/e2e/atos-regulatorios/01-crud-atos-regulatorios/2026-10-05T05-48-17-538Z/videos/01-crud-atos-regulatorios.cy.ts.mp4`.
- Log: `logs/e2e/atos-regulatorios/01-crud-atos-regulatorios/2026-10-05T05-48-17-538Z/run.txt`.
