# 05 — Criar graduação demonstrativa em Administração

**What to build:** the test scenario demonstrates a Bacharelado em Administração at an IES already represented in the local catalog fixture, with editable example PPC components and no e-MEC integration.

**Blocked by:** 02 — Preparar cenário acadêmico local e isolado para teste.

**Priority:** 1

**Status:** done
- [x] Resolver deterministicamente uma IES e uma oferta de Bacharelado em Administração já presentes no fixture SQLite read-only.
- [x] Criar instituição e curso operacionais separados da instituição/oferta de referência, com IDs próprios de teste.
- [x] Criar matérias demonstrativas (por exemplo, Administração Geral, Contabilidade, Economia, Finanças, Marketing, Pessoas, Operações e Métodos Quantitativos), explicitamente editáveis e sem alegar que sejam matriz oficial da IES usada como referência.
- [x] Verificar consulta e PPC/matérias no tenant de cenário via SQLite e Cypress headed; o fluxo de matrícula individual é coberto no tenant efêmero da jornada E2E.
- [x] Provar que a execução não chama e-MEC, não escreve no fixture de catálogo, não registra auditoria nem cria matrícula automaticamente.

**Implementado:** manifesto registra a IES/oferta local escolhida; o cenário cria registros operacionais separados. Cypress consulta curso e matérias da graduação sem mutar o SQLite read-only.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/cursos-padrao-dados-locais/05-bacharelado-em-administracao/2026-10-03T11-19-37-994Z/run.txt`) e produziu o vídeo `logs/e2e/cursos-padrao-dados-locais/05-bacharelado-em-administracao/2026-10-03T11-19-37-994Z/videos/05-bacharelado-em-administracao.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
