# Consulta de alunos
Status: ready-for-agent
## Problem Statement
Operadores precisam localizar alunos já cadastrados em sua instituição; pessoas do público também precisam consultar alunos, mas receber somente dados limitados. A busca deve aceitar CPF, nome, município/UF e curso sem permitir acesso irrestrito ao cadastro.
## Solution
Oferecer busca autenticada para a operação acadêmica e busca pública com uma projeção de resultado reduzida. Ambas suportam os critérios de busca aprovados. Município/UF significa município e UF de nascimento. A resposta pública contém apenas nome do aluno, curso e instituição.
## User Stories
1. Como operador autenticado, quero localizar um aluno por CPF, para abrir o cadastro correto.
2. Como operador autenticado, quero localizar alunos pelo nome, para encontrar registros quando não tenho o CPF.
3. Como operador autenticado, quero filtrar alunos por município e UF, para encontrar registros associados à localidade.
4. Como operador autenticado, quero filtrar alunos por curso, para consultar os alunos vinculados a um percurso.
5. Como operador, quero combinar critérios de busca quando necessário, para reduzir resultados ambíguos.
6. Como `SUPER_ADMIN`, quero ver os dados necessários à gestão acadêmica da instituição-alvo após autenticação, para atuar sobre o cadastro autorizado.
7. Como pessoa do público, quero pesquisar aluno pelos critérios aprovados, para encontrar uma referência pública do vínculo acadêmico.
8. Como titular de dados, quero que a consulta pública retorne somente nome, curso e instituição, para reduzir exposição de informações pessoais.
9. Como responsável pela segurança, quero que a busca autenticada exija sessão `SUPER_ADMIN` e instituição-alvo explícita validada pelo servidor, para não aceitar escopo forjado pelo cliente.
10. Como responsável pela privacidade, quero respostas indistinguíveis para registros fora do escopo autorizado, para não revelar sua existência.
## Implementation Decisions
- `people` continua dono do cadastro pessoal; vínculo com curso e perfil acadêmico são consultados por contratos públicos de `academic`.
- A busca autenticada e a busca pública são superfícies diferentes, com autorização e projeções diferentes. A resposta pública nunca reutiliza o DTO completo do operador.
- Critérios aprovados: CPF, nome, município e UF de nascimento e curso. Consulta parcial/prefixo, combinação de filtros, ordenação e paginação devem seguir o padrão adequado do catálogo de pessoas e não ampliar resultados sem limite.
- Para busca pública, retornar apenas nome do aluno, curso e instituição. Nunca retornar CPF, data de nascimento, contatos ou demais dados pessoais.
- Município e UF de nascimento são dados da pessoa, não a localidade da instituição. Capturá-los no cadastro de pessoas para que a busca funcione de ponta a ponta.
- Consultas autenticadas são operadas pelo `SUPER_ADMIN`, que informa explicitamente o tenant-alvo em cada busca; o servidor valida sessão, papel e existência do tenant. O operador pode ver os dados cadastrais e acadêmicos necessários, incluindo CPF e município/UF de nascimento. A busca pública usa apenas um DTO separado com nome, curso e instituição.
- A consulta pública considera somente matrículas ativas em cursos ativos. Seu DTO e sua tela não retornam CPF, município/UF de nascimento, identificadores, datas ou contatos.
- Matrícula em lote e integração EAD não fazem parte deste fluxo. Auditoria continua fora do MVP.
## Testing Decisions
- Testar primeiro a fronteira pública do serviço de busca com store em memória: cada filtro, combinações definidas, recusa de acesso e isolamento de tenant.
- Testes HTTP verificam sessão e projeção pública separada; a interface do navegador verifica que os formulários e resultados refletem os contratos.
- Reutilizar como prior art os testes públicos atuais de `people` e `academic`, além dos testes HTTP de busca existentes.
- Incluir exemplos fictícios e garantir que a resposta pública não contenha campos fora da lista que vier a ser aprovada.
## Out of Scope
- Alterar cadastros ou mesclar pessoas durante a busca.
- Expor histórico, notas, frequência ou credenciais na tela de busca pública.
- Matrícula em lote, integração com ambientes EAD e auditoria.
## Further Notes
- O público pode consultar alunos com resultados limitados, conforme decisão do usuário e ADR 0016.
- A projeção pública e o significado da localização foram decididos pelo usuário: nome/curso/instituição e município/UF de nascimento.
