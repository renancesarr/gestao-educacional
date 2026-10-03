# Fixture SQLite reduzida para testes de listagem do catálogo

Status: ready-for-human

## Problem Statement

As suítes de catálogo carregam ou montam dados durante os testes de persistência. Para validar consultas e listagens, isso repete trabalho de importação dos arquivos oficiais, torna a suíte mais lenta e mistura preparação dos dados com o comportamento que precisa ser verificado.

## Solution

Manter um fixture SQLite pequeno, produzido uma vez a partir dos CSVs locais do INEP e e-MEC, e executar os testes SQLite e E2E do catálogo diretamente contra consultas/listagens desse banco. Esses testes não devem repetir importações em lote nem cadastros manuais de catálogo; testes unitários dedicados ainda podem exercitar os parsers e contratos de importação.

## User Stories

1. Como desenvolvedor, quero consultar um fixture SQLite estável de escolas, para validar listagens sem importar o arquivo INEP em cada execução.
2. Como desenvolvedor, quero ter uma escola de cada município/UF representado no CSV, para exercitar consultas de catálogo por localidade.
3. Como desenvolvedor, quero ter uma IES em cada UF com todos os cursos publicados para ela, para verificar que listagens preservam a relação completa entre instituição e ofertas selecionadas.
4. Como mantenedor, quero que a escolha dos registros seja determinística, para obter o mesmo fixture ao regenerá-lo com os mesmos CSVs.
5. Como mantenedor, quero executar os testes de listagem sem escrita no banco, para separar cobertura de consulta da preparação da base.
6. Como mantenedor, quero que a preparação dos dados não crie tenant, matrícula, pessoa nem curso operacional, para manter o fixture restrito ao catálogo de referência.
7. Como mantenedor, quero substituir somente bancos de teste do catálogo, para preservar o banco operacional do sistema.

## Implementation Decisions

- O fixture pertence a `tests/fixtures` e é separado do banco padrão da aplicação.
- Não foi encontrado arquivo SQLite existente na árvore do projeto durante a análise. Os testes atuais usam SQLite em memória ou arquivos temporários removidos ao final; não há banco existente a apagar no escopo do projeto.
- O CSV INEP fornecido não inclui código de município; o agrupamento da amostra usa o código UF e o nome publicado do município. Uma escola é escolhida deterministicamente por combinação município/UF, ordenando pelo código INEP como texto.
- A análise identificou 5.567 combinações município/UF e 27 UFs com IES que têm ofertas publicadas.
- Para cada UF, escolher a IES de menor código publicado entre as que possuem cursos no arquivo; incluir o registro completo da IES e todas as ofertas publicadas associadas ao seu código. Com os arquivos atuais, isso resulta em 27 IES e 5.358 ofertas.
- Manter códigos externos como texto e preservar os campos do catálogo já aprovados. A fonte de verdade continua sendo os CSVs locais aprovados.
- Os testes SQLite e o E2E abrem o fixture e verificam listagem/consulta sem inserir registros, recarregar CSVs, executar importação em lote ou cadastrar manualmente escolas/IES/cursos. Testes unitários dos parsers continuam verificando os formatos oficiais.
- O banco operacional não será apagado nem substituído. A instrução de substituição se limita a arquivos de fixture do catálogo, caso existam; não abrange bancos em outros locais.
- A validação usa o contrato público de listagem e busca disponível. Filtros avançados de e-MEC e paginação futura permanecem no ticket 06; o fixture é independente dessa expansão.

## Testing Decisions

- Testes observam resultados retornados pelos serviços/consultas públicas do catálogo usando o fixture SQLite em modo somente leitura.
- Verificar busca escolar por município/UF e listagem das 27 IES com as ofertas disponíveis na página atual; conferir contagens e vínculos completos uma vez durante a geração do fixture.
- Testes SQLite/E2E não executam o construtor nem carregam os CSVs de centenas de megabytes. Testes unitários de parsing de fonte mantêm sua cobertura independente.
- Uma validação manual única do fixture construído confere contagens, unicidade das escolas por município/UF, uma IES por UF, ofertas completas das IES escolhidas e ausência de tenants/matrículas/pessoas/cursos operacionais.
- Usar como prior art as suítes SQLite separadas e os serviços públicos `public_catalog` e `emecCatalog`.

## Out of Scope

- Alterar a base SQLite operacional da aplicação.
- Atualizar ou modificar os CSVs oficiais de origem.
- Cobrir a importação dos CSVs dentro da suíte padrão ou testar cadastro manual de itens do catálogo.
- Usar os registros do fixture para matrícula, pessoas, tenants ou catálogo operacional de um tenant.
- Incluir especializações, atos regulatórios ou instituições de UFs ausentes das fontes.

## Further Notes

- Fonte INEP: `Análise - Tabela da lista das escolas.csv`.
- Fontes e-MEC: `PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv` e `PDA_Dados_Cursos_Graduacao_Brasil.csv`.
- Cobertura encontrada: 5.567 pares de município/UF; 27 UFs com IES e ofertas; 5.358 ofertas associadas às 27 IES escolhidas.
- Consulta avançada do catálogo é acompanhada em [ticket 06](../catalogo-publico-mec-inep/issues/06-consultar-instituicoes-e-cursos.md).
