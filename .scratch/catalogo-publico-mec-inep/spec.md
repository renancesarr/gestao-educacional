# Catálogo de referência de instituições e cursos
Status: superseded for active MVP scope by ADR 0017; retained as implementation history and fixture documentation
## Problem Statement
O operador e as pessoas que consultam o sistema precisam localizar instituições e cursos conhecidos sem criar um tenant, alterar um catálogo operacional local ou matricular alguém. Escolas virão do CSV de dados abertos do INEP; IES e cursos de graduação virão dos CSVs de dados abertos do e-MEC adicionados ao projeto.
## Solution
Manter catálogos de referência importados e pesquisáveis, separados dos dados operacionais dos tenants. Importar escolas do INEP, IES e cursos de graduação dos CSVs definidos abaixo e disponibilizar buscas de instituições pelos filtros aprovados.
## User Stories
1. Como operador autenticado, quero importar escolas do INEP, para manter referências institucionais disponíveis para consulta.
2. Como operador, quero revisar a origem, edição/data, contagens e registros inválidos antes de aplicar uma carga, para entender o que será publicado.
3. Como operador, quero consultar escolas por nome, para encontrar uma instituição conhecida.
4. Como operador, quero consultar escolas por município e UF, para encontrar instituições em uma localidade.
5. Como operador, quero consultar por nome combinado com município e UF, para distinguir instituições homônimas.
6. Como operador, quero pesquisar instituições por curso e combinar curso com município e UF, para localizar instituições que oferecem o curso procurado.
7. Como usuário, quero que uma nova importação preserve a proveniência e as versões anteriores, para distinguir dados da fonte e mudanças de edição.
8. Como usuário, quero consultar cursos importados no catálogo de referência, para descobrir os cursos sem copiá-los para um tenant.
9. Como responsável por tenant, quero que importar uma instituição ou curso não crie tenant, vínculo institucional ou matrícula, para manter separados os catálogos de referência e a operação acadêmica.
10. Como responsável pela privacidade, quero importar somente campos necessários para identificar, localizar e pesquisar os registros, para evitar armazenar dados pessoais ou detalhes sem uso definido.
## Implementation Decisions
- Catálogo de referência é global e distinto de `institution`/tenant e dos cursos operacionais de `academic`. A importação não cria tenants, cursos operacionais, pessoas, vínculos ou matrículas.
- INEP é a fonte decidida para escolas. e-MEC é a fonte decidida para instituições de Educação Superior e cursos de graduação, usando `PDA_Lista_Instituicoes_Ensino_Superior_do_Brasil_EMEC.csv` e `PDA_Dados_Cursos_Graduacao_Brasil.csv` presentes em `CSV_DADOS_ABERTOS`.
- O CSV `PDA_Cursos_Especializacao_Brasil.csv` representa especializações/pós-graduação e fica fora do MVP. Não carregar nem consultar esse conjunto.
- Cursos de graduação são referências associadas a uma IES pelo código publicado. A linha de curso também inclui município/UF da oferta; manter a localidade para permitir busca institucional por curso e localização. Preservar o código de curso publicado sem convertê-lo em código de curso operacional do tenant.
- Conservar nomes, códigos externos, grau, área, modalidade, situação e demais campos necessários às buscas aprovadas. Não importar contatos/endereço detalhado nem transformar os dados de referência em cadastro operacional.
- Os filtros aprovados para instituições são: nome; município e UF; nome com município e UF; curso; curso com município e UF.
- Filtros por curso usam os vínculos publicados em e-MEC e aceitam combinação com município/UF da oferta.
- Cargas precisam manter proveniência e distinguir versão completa de parcial. Transformações devem ser determinísticas; não completar rótulos ou dados ausentes por inferência.
- O usuário não confirmou associação de registro público a tenant, cópia de cursos para tenant, atos regulatórios nem atualização automática do catálogo operacional. Esses itens não fazem parte desta especificação.
- Auditoria de ações do operador fica fora do MVP. Proveniência e versão da carga são metadados da referência, não trilhas de auditoria.
## Testing Decisions
- Testes devem verificar comportamento observável pelo serviço público do catálogo, pelo contrato HTTP autenticado e pelo fluxo de consulta no navegador, sem depender de detalhes internos.
- Testes unitários usam amostras e stores em memória para regras e contratos de parser. Os testes SQLite de catálogo consultam somente o fixture reduzido versionado; a construção/importação completa do fixture é uma etapa manual única.
- Contratos de fonte devem ser validados com arquivos oficiais versionados. Testes não devem depender de portais externos ao rodar a suíte padrão.
- Testes de isolamento provam que importação e consulta do catálogo global não criam nem alteram dados de tenant ou matrícula.
- A suíte Cypress visível é a verificação de ponta a ponta do fluxo que o usuário acompanha; manter seu registro por execução pelo comando `npm run test:all`.
## Out of Scope
- Matrícula em instituição de referência ou associação automática de pessoas.
- Copiar cursos importados para um tenant ou sincronizar um catálogo operacional.
- Importar atos regulatórios ou documentos, até decisão explícita de escopo.
- Importar especializações/pós-graduação ou atos regulatórios.
- Auditoria, matrícula em lote e integração EAD.
## Further Notes
- **Atualização de escopo posterior:** a decisão final do MVP retirou importação/integração e-MEC da aplicação. O fixture SQLite de listagem com IES/ofertas já existentes permanece somente como dado local read-only para testes e demonstrações; o fluxo de UI/API e-MEC ainda presente no código está rastreado para remoção em [cursos-padrao-dados-locais, ticket 01](../cursos-padrao-dados-locais/issues/01-sem-novas-integracoes-de-catalogo.md). A consulta do fixture não cadastra tenant, curso operacional ou matrícula.
- O ticket 06 foi implementado segundo a decisão anterior; sua interface e endpoints de operação e-MEC serão removidos na reconciliação de escopo. Os resultados passam a ser fonte local de cenário/teste, e instituições operacionais podem ser cadastradas manualmente.
- Decisões de escopo: [ADR 0016](../../docs/adr/0016-escopo-atual-do-mvp.md).
- O ticket de importação escolar já tem implementação parcial; o arquivo do INEP em `CSV_DADOS_ABERTOS` valida cabeçalhos, etapas múltiplas e minimização de campos.
- A verificação local encontrou 902.676 linhas de graduação, 4.815 IES, zero referências de IES ausentes e 30 linhas além das chaves distintas IES/curso/município. O importador do ticket 05 preserva a primeira linha válida por chave e reporta conflitos; essas 30 linhas deixam a versão parcial e não são aplicadas como ofertas válidas.
- O parser INEP leu as 87.653 linhas fornecidas, conservando 83.376 escolas com Fundamental e/ou Médio e apontando 1.850 rejeições, incluindo EJA sem etapa identificável. Não inferir automaticamente modalidade/etapa de EJA.
- O fixture SQLite de listagem contém uma escola por município/UF e uma IES por UF com todas as ofertas da IES escolhida. Os testes SQLite e E2E consultam o fixture em modo somente leitura; o parser INEP/e-MEC e os contratos HTTP de importação continuam com testes próprios sem importar as bases oficiais para o banco de integração.
- O ticket 05 implementa importação e-MEC por streaming, prévia, validação de vínculo por código, tratamento determinístico de duplicatas/conflitos, versionamento e aplicação SQLite.
- O ticket 06 implementa consulta e-MEC por nome de IES, município/UF, curso e combinação desses filtros. A API e a interface SUPER_ADMIN paginam os resultados (20 por página na interface; máximo de 100 por página na API), distinguem IES de ofertas e mostram sua proveniência e situação. A rota exige sessão de plataforma e autorização SUPER_ADMIN no serviço.
- A busca usa catálogos de referência sem criar nem alterar tenants, cursos operacionais, vínculos de aluno ou matrículas.
