# 01 — Importar e pesquisar o catálogo de escolas do INEP

**What to build:** O `SUPER_ADMIN` consegue revisar e aplicar uma versão oficial do catálogo INEP e disponibilizar instituições importadas para consulta. Importar uma escola não cria tenant, curso operacional nem matrícula.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] A carga é iniciada pelo operador e usa somente interface ou arquivo oficial; antes de aplicar, mostra fonte, edição quando disponível, data de coleta, contagens e conflitos conhecidos.
- [x] O mapeamento identifica os cabeçalhos usados pelo CSV do INEP fornecido em `CSV_DADOS_ABERTOS` e registra o contrato de campos/cobertura comprovado.
- [x] O catálogo preserva identificadores, situação e rótulos publicados necessários à seleção da escola e ao escopo de Ensino Fundamental, Ensino Médio e EJA; não importa contatos nem dados de responsáveis.
- [x] A prévia permite aplicar a versão; registros válidos são preservados, registros não mapeáveis exibem motivo e tornam a versão parcial, sem inventar valores ou apagar versões anteriores.
- [x] O `SUPER_ADMIN` consegue pesquisar registros importados; operações de importação são protegidas no servidor e apresentadas no fluxo administrativo.
- [x] Testes unitários exercitam o serviço público do catálogo com stores e adaptadores em memória, sem banco ou rede; integração cobre SQLite e o formato oficial versionado usado pelo adaptador.
- [x] A implementação não declara cobertura nacional completa sem validar que a fonte oficial usada cobre o escopo necessário.
- [x] A consulta suporta nome; município/UF; nome com município/UF. Os filtros por curso ficam no ticket de integração do catálogo e-MEC.


## Comments

Implementado em `public_catalog`, com serviço testado por store em memória, adaptador SQLite versionado, endpoints protegidos por sessão `SUPER_ADMIN`, importação CSV manual, prévia/aplicação e pesquisa da versão vigente. A UI exibe a fonte oficial registrada, edição, coleta, contagens e rejeições, e informa que a importação não atesta cobertura nacional. Contatos e dados de pessoas são descartados pelo mapeamento.

O CSV oficial disponibilizado pelo usuário remove a pendência de amostra oficial. Validar seus cabeçalhos e rótulos reais durante a execução deste ticket.

Validação: testes unitários do backend (58), HTTP (6), SQLite (16), frontend (10), lint, typecheck, build Next.js e Cypress E2E passaram.

Atualização 2026-10-03: parser agora reconhece `Escola` e `Etapas e Modalidade de Ensino Oferecidas`, divide múltiplas etapas (Fundamental/Médio), mantém rótulos e não armazena telefone/endereço. A leitura local das 87.653 linhas produziu 83.376 registros importáveis, 1.850 rejeições e 2.426 registros fora do escopo. EJA sem etapa de Ensino Fundamental/Médio identificável é rejeitada em vez de inferida. A especificação local cobre os cabeçalhos e minimização; falta executar a integração completa do arquivo através da prévia e armazenamento para fechar o ticket.

Atualização 2026-10-03: busca da versão vigente agora aceita nome, código INEP, município/UF e combinação dos filtros, com limite de 100 registros. A tela administrativa exibe esses filtros. Serviço/memória, contrato HTTP, SQLite, API do frontend e Cypress foram atualizados. A integração percorre o CSV INEP fornecido pela prévia, aplicação e busca SQLite: 83.376 registros válidos, 1.850 rejeitados e consulta por nome, município e UF aprovada. Testes unitários/SQLite, typecheck e lint passaram; teste HTTP passou com loopback habilitado; Cypress headed passou com 1 cenário visível. Implementação pronta para revisão humana.
