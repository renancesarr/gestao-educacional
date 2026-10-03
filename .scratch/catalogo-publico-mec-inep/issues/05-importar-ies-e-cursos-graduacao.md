# 05 — Importar IES e cursos de graduação do e-MEC

**What to build:** o `SUPER_ADMIN` consegue importar e consultar as instituições e ofertas de graduação dos CSVs fornecidos, preservando origem e situação sem criar tenants ou matrículas.

**Blocked by:** 01 — Importar e pesquisar o catálogo de escolas do INEP (reutilizar prévia, versionamento e proveniência).

**Priority:** 1

**Status:** wontfix
## Comments

- 2026-10-03: a decisão de escopo foi posteriormente alterada pela ADR 0017. A importação e-MEC implementada fica fora do MVP ativo e será removida da operação no ticket 01 de `.scratch/cursos-padrao-dados-locais/`. A base SQLite atual mantém suas IES/ofertas somente como fixture local read-only.

- 2026-10-03: implementado em TDD. Parser streaming, prévia e versionamento do catálogo e-MEC, validação das referências das ofertas, deduplicação determinística, relatório de rejeições/conflitos, aplicação transacional, persistência SQLite, rotas SUPER_ADMIN e interface visível de revisão/aplicação. Os arquivos locais produziram 4.815 IES e 902.646 ofertas válidas; 30 linhas conflitantes foram relatadas e mantidas fora do catálogo aplicado. `npm run test:all` passou (unitários, HTTP, SQLite, typecheck, testes unitários frontend, lint, typecheck, build e Cypress headed com navegador visível). Log: `logs/log-teste-2026-10-03T05-21-31-110Z.txt`. Ticket pronto para revisão humana.

- [x] Importar `PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv` e `PDA_Dados_Cursos_Graduacao_Brasil.csv` de `CSV_DADOS_ABERTOS`.
- [x] Tratar cada oferta por IES/curso/município/UF, preservando códigos e rótulos publicados, incluindo grau, modalidade e situação quando existentes.
- [x] Validar vínculo de cada oferta a uma IES pelo código publicado; relatar linhas inválidas e conflitos na prévia, sem descartá-los silenciosamente.
- [x] Tratar duplicatas de maneira determinística e reportar contagens válidas, duplicadas, rejeitadas e conflitos antes de aplicar uma versão.
- [x] Processar os arquivos grandes sem exigir que o navegador envie todo o conteúdo como um único payload JSON nem carregar os CSVs inteiros em memória sem limite.
- [x] Permitir aplicação/versionamento e consulta autenticada no catálogo de referência, sem criar tenant, curso operacional, pessoa, vínculo ou matrícula.
- [x] Não importar o CSV de especializações/pós-graduação nem atos regulatórios.
- [x] Testes de serviço/HTTP e parser validam os contratos de importação; a base reduzida é validada uma vez pelo construtor e os testes SQLite/E2E consultam o fixture em modo somente leitura.

- **Reclassificação de escopo (2026-10-03):** `wontfix`. A ADR 0017 retirou operação/importação/consulta e-MEC do MVP; as IES/ofertas permanecem apenas no fixture local read-only. O ticket de substituição `.scratch/cursos-padrao-dados-locais/issues/01-sem-novas-integracoes-de-catalogo.md` e os E2Es 09/10 verificam a retirada. Não marcar como funcionalidade `done`, pois a proposta original foi superada.
