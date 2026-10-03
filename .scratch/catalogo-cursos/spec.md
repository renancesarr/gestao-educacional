# Catálogo institucional de cursos
Este documento trata de cursos operacionais pertencentes a um tenant. A importação de cursos para referência pública e sua busca são um conceito separado, definido pela ADR 0016 e pela especificação do catálogo público.
Status: ready-for-agent
## Problem Statement
O sistema já permite que o `SUPER_ADMIN` crie uma instituição e declare seu escopo educacional inicial, mas ainda não há um catálogo institucional de cursos. Sem esse catálogo, a instituição não pode estruturar percursos para que ofertas educacionais sejam configuradas depois. O catálogo precisa respeitar o escopo do tenant e manter cursos distintos de ofertas, ciclos e matrículas.
## Solution
Adicionar ao domínio `academic` o caso de uso público para cadastrar cursos pertencentes à instituição-alvo selecionada por um `SUPER_ADMIN` autenticado. Cada curso deve estar dentro do escopo educacional previamente declarado para o tenant: Ensino Fundamental, Ensino Fundamental com EJA, Ensino Médio, Ensino Médio com EJA ou graduação. O servidor resolve e valida a instituição-alvo no lado confiável; referências e consultas não podem atravessar instituições.
Esta especificação consolida as regras confirmadas e o seam de teste aprovado. O primeiro recorte limita-se a criação e consulta do catálogo, sem antecipar dados curriculares ou ciclo de vida futuro.
## User Stories
1. Como `SUPER_ADMIN`, quero cadastrar cursos para uma instituição-alvo para organizar seus percursos acadêmicos antes de abrir ofertas.
2. Como `SUPER_ADMIN`, quero consultar o catálogo de uma instituição-alvo para conhecer os cursos disponíveis ao configurar ofertas posteriormente.
3. Como instituição que oferece Educação Básica, quero que os cursos cadastrados respeitem as etapas e modalidades declaradas no escopo educacional para manter coerência entre instituição e catálogo.
4. Como instituição que oferece Educação Superior, quero cadastrar cursos de graduação quando esse tipo estiver declarado no meu escopo.
5. Como instituição que oferece Educação Básica e Superior, quero manter cursos dos dois níveis no mesmo catálogo institucional sem misturar seus tipos.
6. Como responsável pela consistência acadêmica, quero que o sistema recuse um curso fora do escopo da instituição para não registrar percursos que ela não declarou oferecer.
7. Como responsável pela segurança, quero que a instituição-alvo seja validada no servidor para que o cliente não escolha arbitrariamente a instituição proprietária.
8. Como instituição, quero que uma pessoa de outra instituição não consiga consultar ou alterar meus cursos, mesmo conhecendo seus identificadores.
9. Como instituição, quero manter o catálogo de cursos separado das ofertas educacionais para que o mesmo percurso possa ser configurado em contextos de oferta próprios.
10. Como equipe responsável por matrículas, quero que futuras ofertas e matrículas referenciem cursos da mesma instituição para preservar o isolamento entre tenants.
11. Como responsável pelo domínio educacional, quero que o catálogo do MVP exclua Educação Infantil, pós-graduação e cursos livres até que esses escopos sejam aprovados.
12. Como responsável pela consistência institucional, quero preservar o escopo educacional definido no onboarding enquanto cadastro cursos, sem alterá-lo implicitamente durante a manutenção do catálogo.
13. Como `SUPER_ADMIN`, quero receber um erro de conflito ao repetir um código no mesmo tenant, para preservar referências históricas futuras.
14. Como `SUPER_ADMIN`, quero usar o mesmo código de curso em outra instituição, para manter os catálogos dos tenants independentes.
15. Como operador da plataforma, quero consultar somente os cursos do tenant-alvo, mesmo conhecendo um ID ou código de outra instituição, para impedir vazamento entre instituições.
16. Como configurador de futuras ofertas, quero filtrar o catálogo por item de escopo, para escolher apenas percursos compatíveis com o contexto acadêmico desejado.
17. Como usuário do MVP, quero a lista ordenada por código, para encontrar cursos de modo previsível sem configurar paginação.
## Implementation Decisions
- `academic` é o módulo dono do caso de uso público de cadastro de curso, conforme o seam aprovado `academic.createCourse`. `institution` continua dono do escopo educacional; a integração deve usar contrato público.
- O mesmo serviço público `academic` expõe a consulta do catálogo; `academic.createCourse` e `academic.listCourses` compõem um único seam de domínio. Controladores HTTP apenas autenticam o `SUPER_ADMIN`, resolvem o contexto institucional global e adaptam entrada/saída.
- Um curso pertence a um único tenant. No MVP, um `SUPER_ADMIN` autenticado escolhe explicitamente a instituição-alvo e o servidor valida essa seleção antes de criar ou consultar o curso. O cliente não pode forjar ou substituir `tenantId`.
- O catálogo é uma etapa anterior a ofertas educacionais. Curso, oferta, ciclo e matrícula representam conceitos distintos.
- Curso é um percurso concreto com nome e código próprios, vinculado a um item compatível do escopo educacional. Uma instituição pode cadastrar vários cursos para a mesma etapa/modalidade ou tipo superior autorizado.
- O cadastro inicial contém somente nome, código e item do escopo. Graduação não é dividida em bacharelado, licenciatura ou tecnólogo neste MVP; essa classificação depende de decisão futura sobre matriz curricular, duração e credenciais.
- O código do curso é único permanentemente no tenant, inclusive após futuro arquivamento; não pode ser reutilizado. Esta entrega permite apenas criar e consultar cursos. Edição, arquivamento, reativação e seus efeitos sobre ofertas, matrículas e histórico ficam fora do recorte.
- A criação de curso não produz auditoria tenant-scoped ou de plataforma neste MVP de validação. Auditoria própria do catálogo será decidida quando o ciclo de vida do curso for ampliado.
- A delegação futura do catálogo para papéis institucionais permanece aberta e será decidida junto com o modelo completo de autorização. Até lá, somente o `SUPER_ADMIN` opera o catálogo.
- O código usa `[a-z0-9][a-z0-9-]{1,99}`; o nome é obrigatório e tem no máximo 200 caracteres.
- A criação recebe o item do escopo como objeto estruturado do mesmo formato usado no onboarding. O servidor exige correspondência exata com um item já declarado para o tenant.
- Nomes podem se repetir no tenant; o código é a identidade estável. A consulta lista todo o catálogo da instituição-alvo e aceita filtro opcional por item do escopo estruturado.
- A consulta retorna todos os cursos ordenados por código crescente. Paginação fica fora do MVP até existir evidência de volume que a justifique.
- O escopo aceito é o já definido no onboarding institucional: Fundamental, Fundamental com EJA, Médio, Médio com EJA e graduação. EJA continua modalidade associada à etapa; Educação Infantil não entra no MVP.
- Durante a validação do MVP, somente o `SUPER_ADMIN` executa operações institucionais. `TENANT_ADMIN`, `ACADEMIC_SECRETARY` e outros papéis internos não recebem permissões de catálogo neste recorte.
- Testes unitários exercitam o serviço público `academic.createCourse` por store em memória isolado por teste. Integração com SQLite ou outro adaptador fica em suíte separada; os testes unitários não iniciam banco, HTTP, Docker ou rede.
- O serviço recebe `{ name, code, educationScope }`, em que `educationScope` é exatamente um item estruturado do onboarding. Ele gera o ID interno e a data no servidor, deriva o tenant e autor do contexto global confiável e não aceita `tenantId`, ator, ID ou data do cliente.
- A consulta recebe o contexto global e, opcionalmente, um item `educationScope` estruturado. Sem filtro, retorna todos os cursos do tenant; com filtro, retorna somente o item idêntico. Em ambos os casos, a ordem é código crescente.
- A porta de persistência grava o curso com unicidade por tenant.
## Testing Decisions
- Testes descrevem comportamentos observáveis pelas interfaces públicas, sem depender de métodos privados, ordem interna de chamadas ou detalhes de SQL.
- O seam unitário aprovado é o serviço público `academic.createCourse` com persistência em memória determinística.
- Os comportamentos principais a verificar são: aceitação de curso compatível com o escopo, recusa de curso fora do escopo, validação de nome/código/item de escopo, conflito de código no mesmo tenant, repetição permitida em outro tenant, validação da instituição-alvo, ausência de leitura/escrita cruzada, filtro e ordem do catálogo e separação entre curso e oferta.
- Testes de integração do adaptador escolhido verificam persistência, restrições e transações separadamente.
- Como referência de estrutura, usar os testes unitários públicos dos serviços `super_admin`, `people` e `identity`, e os testes SQLite de integração dos adaptadores.
- Aplicar TDD em fatias verticais: teste observável vermelho no seam público, implementação mínima, teste verde e então a próxima fatia. Os testes unitários não consultam banco ou detalhes internos do adaptador.
## Out of Scope
- Ofertas educacionais, calendários, organização de ciclos, requisitos de ativação, matrícula e progressão acadêmica.
- Componentes curriculares, disciplinas, carga horária, duração, matriz curricular, regras de avaliação ou documentação de conclusão.
- CNPJ, endereço, credenciamento e demais dados legais da instituição.
- Alteração do escopo institucional, importação de cursos ou preenchimento automático de catálogos.
- Cursos de Educação Infantil, pós-graduação ou cursos livres.
- Seleção ou troca do banco utilizado pela aplicação.
## Further Notes
O ID interno do curso é gerado no servidor conforme a diretriz de UUIDs do MVP. A especificação não introduz dados curriculares, duração, subtipos de graduação, edição, arquivamento, ofertas ou delegação institucional.
**Atualização de escopo pela ADR 0017:** a exclusão anterior de curso técnico foi superada para o cenário demonstrativo do MVP. Educação Profissional Técnica de nível médio terá categoria de escopo própria, detalhada em `.scratch/cursos-padrao-dados-locais/`; não deve ser representada como Ensino Médio regular. Graduação ainda não se divide em bacharelado/licenciatura/tecnólogo no escopo operacional.
Referências:
- [Glossário do domínio](../../docs/CONTEXT.md).
- [Visão e princípios do produto](../../docs/IDEIA.md), que ordena cursos antes de componentes curriculares e ofertas; a autoridade do `TENANT_ADMIN` foi adiada pela ADR 0014.
- [Escopo educacional inicial da instituição](../../docs/adr/0012-escopo-educacional-inicial-da-instituicao.md).
- [Operação institucional centralizada no MVP](../../docs/adr/0014-operacao-centralizada-pelo-super-admin-no-mvp.md).
- [Cadastro institucional e escopo inicial](../instituicao/spec.md).
- [Onboarding global de instituições](../onboarding-super-admin/spec.md).
