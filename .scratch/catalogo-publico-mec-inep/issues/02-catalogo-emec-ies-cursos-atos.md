# 02 — Importar instituições, cursos e atos do e-MEC

**What to build:** O `SUPER_ADMIN` consegue revisar e aplicar uma versão oficial do e-MEC e consultar IES, cursos de graduação e atos associados, mantendo os conceitos e rótulos da fonte.

**Blocked by:** 01 — Importar o catálogo público de escolas do INEP.

**Status:** wontfix

- [ ] A carga usa mecanismo oficial disponível ou arquivo oficial e reutiliza a revisão, proveniência, versionamento e preservação de versões introduzidos para o catálogo.
- [ ] A prévia apresenta origem, edição/data de coleta, registros válidos, rejeitados e conflitos; rejeições têm motivo e tornam a versão parcial sem impedir a aplicação dos registros válidos.
- [ ] IES, cursos de graduação e atos permanecem fiéis à semântica da fonte; datas mantêm seus tipos e rótulos originais, sem criar uma data genérica de criação do curso.
- [ ] Atos preservam identificadores, tipos, datas, rótulos, referências oficiais, versão e texto disponível; arquivos originais são armazenados pela porta de conteúdo quando fornecidos, com metadados no banco relacional.
- [ ] A consulta e o fluxo administrativo permitem ao `SUPER_ADMIN` revisar e aplicar a versão; a atualização do catálogo global não altera cursos locais.
- [ ] Testes unitários cobrem o serviço público com amostras e stores em memória, sem banco ou rede; testes de integração cobrem SQLite, armazenamento de arquivos e contratos dos formatos oficiais versionados.
- [ ] A implementação registra limitações quando a fonte não fornece interface ou conteúdo completo e não declara cobertura nacional sem validação.

## Comments

Proposta substituída pela ADR 0016. Importação de atos não está no recorte. A antiga decisão pendente sobre fonte foi resolvida: o usuário forneceu os CSVs de IES e cursos de graduação e escolheu e-MEC para o catálogo de referência. A implementação está coberta por novo ticket mais estreito; este ticket permanece `wontfix` porque atos e comportamentos adicionais foram excluídos.

Revisão após ADR 0016: o catálogo de cursos deve ser importado e consultável no MVP; a fonte e o formato ainda precisam de confirmação. O e-MEC é uma fonte candidata já pesquisada, mas os dados encontrados não comprovam uma edição atual nem uma exportação nacional completa. A inclusão de atos permanece sem decisão de escopo. Não iniciar implementação até fechar esses pontos.


## Comments

Foram inspecionados os CSVs enviados pelo usuário. O arquivo de IES contém 4.815 registros; o de graduação, 902.676 linhas. O CSV de graduação repete `CODIGO_CURSO` em linhas de municípios diferentes, portanto sua granularidade é curso/localidade e não uma linha por curso. Especialização permanece fora do escopo aprovado.

A página oficial do conjunto de indicadores MEC identifica as três bases como publicadas/atualizadas em 29/12/2022. Esses arquivos não podem ser tratados como edição atual do Cadastro e-MEC. O CSV de graduação não traz atos regulatórios nem links/documentos de atos. A interface oficial do Cadastro e-MEC segue disponível para consulta e contém dados cadastrais e atos, mas não foi confirmada uma exportação nacional oficial em formato de arquivo.

Referências consultadas: [Indicadores sobre Ensino Superior — MEC](https://dadosabertos.mec.gov.br/indicadores-sobre-ensino-superior), [Cadastro Nacional de Cursos e IES — MEC](https://www.gov.br/mec/pt-br/politica-regulacao-supervisao-educacao-superior/cadastro-nacional-de-cursos-e-ies), [Cadastro e-MEC](https://wsemec.mec.gov.br/emec/nova).

Não foram importados dados nem alterados os CSVs locais. Para respeitar a decisão de usar registros oficiais mais atuais, a importação do ticket permanece pendente até uma fonte oficial em vigor e um caminho autorizado para obter os atos serem definidos.
