# PPC, colaboradores e matrícula direta no curso
O escopo geral vigente foi atualizado pela ADR 0016: avaliações, notas, frequência, históricos e credenciais também pertencem ao MVP, embora não a esta especificação de PPC/matrícula. Auditoria está fora de todo o MVP, sem deixar de ser requisito do sistema completo.
Status: ready-for-human
## Problem Statement
Depois de criar o catálogo institucional de cursos, o `SUPER_ADMIN` ainda não consegue montar o percurso que cada curso oferece, definir seus professores ou registrar alunos. A instituição precisa de um fluxo mínimo e completo para criar colaboradores a partir de pessoas já cadastradas, compor o PPC do curso por matérias e carga horária e matricular diretamente uma pessoa no curso.
O fluxo deve permanecer simples para validar o MVP: não há ofertas, turmas, calendário coletivo, progressão individual, conta de aluno ou permissões institucionais. Ainda assim, os dados devem respeitar a instituição-alvo explícita, preservar vínculos existentes e impedir novos registros em um percurso desativado ou incompleto.
## Solution
Estender o módulo `academic` para que o `SUPER_ADMIN`, atuando com instituição-alvo explícita, possa criar, consultar, editar e ativar/desativar cursos, colaboradores e matérias; e criar, consultar e mudar o estado de matrículas diretas no curso.
Cada curso possui um único PPC implícito. As matérias pertencem diretamente a esse PPC e reúnem código, nome, carga horária e um ou mais colaboradores-professores. A matrícula associa uma pessoa existente ao curso, cria ou reutiliza seu perfil acadêmico e inicia no estado `ativa`. Não há exclusão física: curso, colaborador e matéria usam `ativo`; matrícula preserva seu histórico pelo ciclo de estados aprovado.
## User Stories
1. Como `SUPER_ADMIN`, quero operar recursos acadêmicos com uma instituição-alvo explícita, para administrar várias instituições sem misturar seus dados.
2. Como `SUPER_ADMIN`, quero alterar o nome de um curso, para corrigir sua denominação administrativa sem trocar sua identidade estável.
3. Como `SUPER_ADMIN`, quero ativar ou desativar um curso, para controlar novas operações sem apagar seu histórico.
4. Como `SUPER_ADMIN`, quero consultar todo o catálogo institucional, inclusive cursos inativos, para localizar e reativar percursos existentes.
5. Como `SUPER_ADMIN`, quero manter o código e o item de escopo educacional de um curso estáveis, para não quebrar referências acadêmicas e integrações futuras.
6. Como `SUPER_ADMIN`, quero criar um colaborador a partir de uma pessoa existente da instituição-alvo, para poder atribuí-la como professora sem duplicar seu cadastro pessoal.
7. Como `SUPER_ADMIN`, quero que a mesma pessoa tenha somente um vínculo de colaborador por instituição, para reutilizá-la em várias matérias e cursos.
8. Como `SUPER_ADMIN`, quero listar colaboradores pelo nome da pessoa, para localizar professores ao compor um PPC.
9. Como `SUPER_ADMIN`, quero ativar ou desativar um colaborador, para refletir sua disponibilidade sem apagar vínculos já usados em matérias.
10. Como `SUPER_ADMIN`, quero criar uma matéria de um curso com nome, código, carga horária e professores em uma única operação, para não criar componentes curriculares incompletos.
11. Como `SUPER_ADMIN`, quero atribuir um ou mais colaboradores ativos a uma matéria ativa, para suportar co-docência.
12. Como `SUPER_ADMIN`, quero reutilizar o mesmo código de matéria em cursos diferentes, para organizar PPCs independentes.
13. Como `SUPER_ADMIN`, quero impedir código repetido de matéria dentro do mesmo PPC, para manter uma referência estável por curso.
14. Como `SUPER_ADMIN`, quero editar nome, carga horária e professores de uma matéria, para manter o PPC atualizado.
15. Como `SUPER_ADMIN`, quero manter o código da matéria imutável, para preservar futuras referências de frequência, notas e histórico.
16. Como `SUPER_ADMIN`, quero ativar ou desativar uma matéria, para controlar sua disponibilidade sem excluir o componente do PPC.
17. Como `SUPER_ADMIN`, quero consultar um curso junto de suas matérias, cargas horárias e professores, para verificar o PPC antes de matricular alunos.
18. Como `SUPER_ADMIN`, quero criar um curso antes de montar seu PPC, para poder cadastrar colaboradores e matérias em operações posteriores.
19. Como `SUPER_ADMIN`, quero que alterações em matérias e professores tenham efeito imediato para o curso inteiro, para operar o MVP sem versão curricular.
20. Como `SUPER_ADMIN`, quero matricular diretamente uma pessoa existente em um curso, para iniciar seu vínculo acadêmico sem configurar oferta ou turma.
21. Como `SUPER_ADMIN`, quero que uma matrícula crie automaticamente o perfil acadêmico quando ele não existir, para evitar um cadastro manual adicional.
22. Como `SUPER_ADMIN`, quero que uma matrícula reutilize o perfil acadêmico existente, para impedir duplicidade de aluno dentro da instituição.
23. Como `SUPER_ADMIN`, quero que o perfil de aluno exista sem conta, login ou permissões, para separar o vínculo acadêmico de acesso ao sistema.
24. Como `SUPER_ADMIN`, quero permitir que uma pessoa seja simultaneamente colaboradora e aluna, para não confundir vínculos acadêmicos distintos.
25. Como `SUPER_ADMIN`, quero criar matrícula apenas em curso ativo com ao menos uma matéria ativa e um professor colaborador ativo, para impedir novas entradas em percursos inválidos.
26. Como `SUPER_ADMIN`, quero que desativar curso, matéria ou colaborador preserve matrículas existentes, para não apagar fatos já registrados.
27. Como `SUPER_ADMIN`, quero continuar regularizando uma matrícula existente mesmo quando o curso se tornar inelegível para novas matrículas, para poder trancar, cancelar ou jubilar vínculos pendentes.
28. Como `SUPER_ADMIN`, quero que toda matrícula comece em `ativa`, para evitar escolha de estado inicial ambígua.
29. Como `SUPER_ADMIN`, quero trancar uma matrícula ativa e reativar uma matrícula trancada, para controlar a pausa acadêmica manualmente.
30. Como `SUPER_ADMIN`, quero cancelar ou jubilar uma matrícula ativa ou trancada, para encerrar o vínculo segundo uma decisão administrativa explícita.
31. Como `SUPER_ADMIN`, quero que matrículas canceladas e jubiladas sejam finais, para preservar o registro histórico sem reativação implícita.
32. Como `SUPER_ADMIN`, quero manter no máximo uma matrícula histórica por pessoa e curso, para não criar readmissões ambíguas antes de existir uma regra própria.
33. Como `SUPER_ADMIN`, quero listar matrículas de um curso por nome da pessoa e filtrar opcionalmente por estado, para localizar alunos sem criar uma tela separada de aluno.
34. Como instituição, quero que uma pessoa, colaborador, matéria, curso e matrícula de outro tenant sejam recusados, para preservar isolamento entre instituições.
35. Como operador do MVP, quero que curso, colaborador e matéria iniciem ativos, para mudar disponibilidade somente mediante ação administrativa explícita.
36. Como operador do MVP, quero que as mudanças de estado da matrícula sejam manuais, para não simular automação sem notas, frequência, calendário ou regras acadêmicas.
## Implementation Decisions
- O módulo `academic` continua dono de curso, PPC, matéria, colaborador institucional acadêmico, perfil de aluno e matrícula direta. `institution` continua dono do escopo educacional e do contexto da instituição-alvo. `people` continua dono de pessoas. As dependências entre esses módulos usam somente contratos públicos ou portas injetadas, sem acessar internals de outro módulo.
- O seam público de domínio é o serviço retornado por `createAcademicService`. Ele concentra os casos de uso deste recorte e recebe `InstitutionOperationContext` já autorizado em cada operação. Testes unitários isolados exercitam esse serviço com stores em memória e dependências determinísticas.
- Para validar pessoas, `academic` usa a consulta pública do módulo `people` (`get` de pessoa com `InstitutionOperationContext` e ID interno). A composição injeta essa dependência; `academic` não importa nem usa adaptadores ou persistência interna de `people`. A leitura retorna a pessoa do tenant do contexto ou o erro público `NOT_FOUND`; colaborador e matrícula só são criados quando a pessoa pertence à instituição-alvo.
- O contrato da dependência de leitura de pessoas também é coberto na fronteira pública de `createAcademicService`: testes unitários fornecem uma implementação em memória isolada por tenant. Não se cria rota pública de `people` nova para satisfazer o módulo acadêmico.
- Cada operação global exige `targetTenantId` no contrato HTTP. O servidor autentica o `SUPER_ADMIN`, resolve o contexto da instituição-alvo e impede que corpo, URL ou persistência escolham outro tenant.
- O curso existente passa a ter `ativo`, iniciado como `true`. Pode alterar somente `name` e `ativo`. `code` e `educationScope` permanecem imutáveis; o código continua único permanentemente por tenant e o nome pode repetir.
- Curso inativo não recebe novas matérias nem novas matrículas. Consultas continuam retornando seus dados para permitir gestão e reativação.
- Colaborador é o vínculo único entre uma pessoa já existente e a instituição-alvo. Sua criação recebe somente o ID interno da pessoa e falha se a pessoa não pertencer ao tenant. Inicia ativo; sua única alteração é `ativo`. Não cria conta nem permissões.
- A persistência deve impedir mais de um colaborador para a mesma combinação pessoa–tenant. A mesma pessoa pode ter, de modo independente, perfil de aluno e vínculo de colaborador no tenant.
- Cada curso tem um PPC único, implícito e sem ID, código ou versão próprios. O PPC é representado pelas matérias pertencentes diretamente ao curso e não há oferta educacional neste recorte.
- Matéria possui `id`, `tenantId`, `courseId`, `name`, `code`, `workloadHours`, `ativo`, datas técnicas e uma lista não vazia de colaboradores-professores. O nome é obrigatório e tem até 200 caracteres. O código segue `[a-z0-9][a-z0-9-]{1,99}`, é único dentro do curso e é imutável. A carga horária é um inteiro positivo em horas.
- A criação de matéria é atômica: só persiste se todos os dados forem válidos e houver ao menos um colaborador-professor do tenant. Quando a matéria estiver ativa, sua criação ou edição exige pelo menos um colaborador ativo. A edição pode alterar nome, carga horária, `ativo` e toda a lista de professores, sem alterar o código.
- Desativar um colaborador preserva os vínculos com matérias. Se uma matéria ativa ficar sem professor ativo, ela deixa de tornar o curso elegível para novas matrículas. Reativar o colaborador ou editar a matéria pode restaurar a elegibilidade.
- A consulta de detalhe do curso retorna curso, matérias, carga horária e professores, inclusive registros inativos, para permitir administração e reativação. Colaboradores são listados pelo nome da pessoa.
- Matrícula direta possui `id`, `tenantId`, `personId`, `courseId`, `studentProfileId`, `status`, `createdAt` e `updatedAt`. A criação recebe somente IDs internos de pessoa e curso; o servidor gera IDs e datas. Não há justificativas, documentos ou outros campos no MVP.
- Criar matrícula requer pessoa existente no tenant, curso ativo e pelo menos uma matéria ativa com pelo menos um colaborador ativo. Na mesma consistência de persistência, cria o perfil de aluno quando ausente ou reutiliza o existente. O perfil não recebe conta, autenticação ou autorização.
- Uma pessoa possui no máximo uma matrícula histórica por curso no mesmo tenant. Essa unicidade deve ser garantida pela persistência, não apenas por consulta anterior da aplicação.
- O ciclo de matrícula é fechado: criação → `ativa`; `ativa` → `trancada`, `cancelada` ou `jubilada`; `trancada` → `ativa`, `cancelada` ou `jubilada`; `cancelada` e `jubilada` são finais. Transições são manuais pelo `SUPER_ADMIN`. Não há readmissão no mesmo curso neste MVP.
- A inelegibilidade atual do percurso bloqueia somente a criação de matrícula. Não bloqueia transições de matrículas existentes.
- A consulta de matrículas recebe curso e filtro opcional de estado, retorna somente o tenant-alvo e ordena pelo nome da pessoa.
Ambos implementam a porta de persistência acadêmica; nenhuma regra de domínio depende de SQL ou de um banco específico. Migrações controladas devem introduzir as estruturas e restrições novas.
- O MVP não registra auditoria para nenhuma operação, conforme ADR 0016. A auditoria continua princípio do sistema completo e será retomada após este recorte.
- As rotas HTTP adaptam somente autenticação, contrato de entrada e respostas. Devem expor operações de criação, consulta, atualização/ativação de curso, colaborador e matéria; detalhe de curso; criação, listagem e transição de matrícula. Erros normalizados não expõem dados pessoais ou detalhes internos.
## Testing Decisions
- Testes unitários descrevem apenas comportamento observável no seam público `createAcademicService`, incluindo a dependência pública de leitura de pessoas injetada.
- Os testes unitários devem cobrir criação e atualização de curso, regra de código e escopo imutáveis, ativação/desativação e leitura do catálogo sem vazamento entre tenants.
- Devem cobrir criação idempotente por unicidade de colaborador, recusa de pessoa ausente ou de outro tenant, listagem por nome e coexistência de perfil de aluno e colaborador.
- Devem cobrir criação atômica da matéria, validação de nome, código e carga horária, unicidade do código dentro do curso, professores múltiplos, imutabilidade do código, edição dos campos permitidos e detalhe do PPC.
- Devem cobrir efeitos de desativar curso, matéria e colaborador: dados e matrículas existentes são preservados, novas matrículas ficam bloqueadas, e a reativação ou correção restaura a elegibilidade quando aplicável.
- Devem cobrir criação de matrícula com pessoa e curso válidos, criação e reutilização do perfil acadêmico, restrição de uma matrícula histórica por pessoa–curso, matrícula em cursos distintos e recusa de referência entre tenants.
- Devem cobrir todas as transições permitidas e proibidas de matrícula, inclusive a impossibilidade de reativar `cancelada` ou `jubilada`, e a possibilidade de regularizar matrículas existentes mesmo após o curso perder elegibilidade.
- Devem cobrir listagem de matrículas por curso, filtro de estado e ordem por nome da pessoa.
- Testes SQLite em memória verificam schema, chaves estrangeiras, unicidades, consultas e atomicidade de gravação.
- Testes HTTP verificam que rotas exigem sessão `SUPER_ADMIN`, recebem `targetTenantId` explícito, não aceitam operações com instituição-alvo forjada e adaptam os contratos públicos sem reproduzir regras de domínio.
- Usar TDD em fatias verticais: escrever primeiro um teste vermelho para um comportamento público, implementar o mínimo para torná-lo verde e então avançar. Usar como referência a estrutura dos testes existentes de `academic`, `people`, SQLite e HTTP.
## Fora do escopo desta especificação
- Oferta educacional, turma, calendário coletivo, ciclo individual, progressão individual, pré-requisitos e recuperação.
- Avaliações, notas, frequência, históricos e credenciais estão fora desta especificação de PPC/matrícula, mas pertencem ao MVP geral conforme ADR 0016.
- Versões de PPC, vigência curricular, preservação de percurso curricular anterior e readmissão após cancelamento ou jubilamento.
- Conta, login, passkey, permissões ou portal de colaborador e aluno; delegação para papéis institucionais.
- Criação autônoma de perfil acadêmico sem matrícula, dados adicionais de colaborador, justificativas, documentos ou anexos de matrícula.
- Exclusão física de curso, colaborador, matéria, perfil de aluno ou matrícula.
- Auditoria própria dos recursos deste recorte, eventos acadêmicos e automação de transições.
- Alteração de código ou escopo do curso, alteração do código da matéria, paginação, importação em lote e consultas analíticas.
- Educação Infantil, pós-graduação, ensino técnico, cursos livres, ERP financeiro, folha, integrações governamentais, assinatura ICP-Brasil real, aplicativo nativo e BI avançado.
## Further Notes
- Esta especificação substitui, para o MVP atual, o caminho anterior que vinculava matrícula a oferta educacional. A oferta permanece uma evolução futura quando surgirem turmas, calendários coletivos ou progressão individual.
- Ela amplia o catálogo inicial de cursos. As regras anteriores de criar e consultar cursos continuam válidas quando não forem substituídas explicitamente por este ciclo de vida.
- O vocabulário canônico está em `docs/CONTEXT.md` e a decisão estrutural está em ADR 0015. A especificação respeita o acesso global do `SUPER_ADMIN` com instituição-alvo explícita.
- O usuário decidiu que toda auditoria fica fora do MVP atual, incluindo notas, frequência, documentos e transições acadêmicas. A auditoria permanece requisito do sistema completo.
