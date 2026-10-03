# 01 — Manter catálogos do MVP sem novas integrações externas

**What to build:** a operação do MVP usa dados locais aprovados; escolas de referência vêm do INEP local, instituições são cadastradas manualmente para uso operacional, e IES/ofertas e-MEC permanecem somente no fixture read-only de teste.

**Blocked by:** None — can start immediately.

**Priority:** 1

**Status:** done
- [x] Remover da interface e da API de operação do MVP a importação/atualização de CSV e-MEC e suas ações de prévia/aplicação.
- [x] Manter a consulta do fixture de catálogo somente em testes/demonstração e abrir `catalog-listing.sqlite` em modo somente leitura.
- [x] Preservar a consulta INEP com os dados locais aprovados para Educação Básica; não exigir download ou chamada remota durante os testes.
- [x] Manter o cadastro manual de instituição, curso e matérias como caminho operacional explícito, sem conversão automática de catálogo em tenant ou matrícula.
- [x] Verificar por HTTP, testes SQLite e Cypress headed que a aplicação não faz chamadas externas, não altera fixture read-only e não inicia fluxo e-MEC.
- [x] Atualizar as descrições funcionais da interface para distinguir referência de catálogo, instituição operacional e dados de demonstração.

**Implementado:** interface e chamadas cliente e-MEC removidas, API retorna 404 para os caminhos antigos e Cypress headed confirmou ausência da UI e consulta local INEP. Adaptadores/testes internos do fixture histórico foram mantidos, sem ligação à operação do MVP.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/cursos-padrao-dados-locais/01-sem-novas-integracoes-de-catalogo/2026-10-03T11-17-50-194Z/run.txt`) e produziu o vídeo `logs/e2e/cursos-padrao-dados-locais/01-sem-novas-integracoes-de-catalogo/2026-10-03T11-17-50-194Z/videos/01-sem-novas-integracoes-de-catalogo.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
