# Gestão acadêmica

Vocabulário do sistema que atende instituições brasileiras de Educação Básica, Educação Profissional Técnica de nível médio e Ensino Superior. O MVP abrange Ensino Fundamental, Ensino Médio, EJA, um curso técnico demonstrativo e graduação; Educação Infantil fica como possibilidade futura.

## Linguagem

### Organização e ensino

**Tenant**:
Fronteira independente de dados, contas e configurações pertencente a uma única instituição/unidade. Um tenant pode oferecer mais de um nível de ensino.
_Avoid_: Mantenedora como tenant, rede como tenant

**Conta de SUPER_ADMIN**:
Conta de operação da plataforma, fora dos tenants institucionais, identificada por nome de usuário único na plataforma e com autoridade global para administrar instituições. É distinta das contas administradas por cada tenant.
_Avoid_: Conta institucional global, conta de tenant

**Operação institucional centralizada no MVP**:
Modelo temporário em que o `SUPER_ADMIN` realiza as operações institucionais, selecionando explicitamente a instituição-alvo. Não elimina o isolamento por tenant; apenas adia contas, papéis e permissões internos. A auditoria dessa atuação pertence ao sistema completo e está fora do MVP atual.
_Avoid_: Acesso global sem instituição-alvo, confundir centralização operacional com mistura de dados entre tenants

**Auditoria de plataforma**:
Evidência das ações de operação global da plataforma, atribuída ao SUPER_ADMIN ou operador local responsável. Pode identificar uma instituição afetada como alvo, sem tornar o registro propriedade dela.
_Avoid_: Auditoria pertencente a um tenant, ação global sem autoria

**Instituição/unidade**:
Organização educacional individual atendida pelo sistema e correspondente a um tenant.
_Avoid_: Rede como sinônimo de tenant

**Registro de instituição no catálogo**:
Referência importada de uma instituição educacional, consultável sem representar uma instituição operacional do sistema. Não cria tenant, conta ou matrícula.
_Avoid_: Tenant, confundir instituição catalogada com instituição atendida

**Curso no catálogo**:
Referência importada de um curso associada a uma instituição catalogada, disponível para pesquisa sem criar curso operacional ou matrícula.
_Avoid_: Curso operacional do tenant, matrícula implícita

**Escopo educacional da instituição**:
Conjunto de níveis, etapas, modalidades e tipos de curso que a instituição oferece no MVP, incluindo Educação Profissional Técnica de nível médio como categoria própria. É declarado pelo SUPER_ADMIN no onboarding e delimita o catálogo de cursos que a instituição poderá cadastrar.
_Avoid_: Perfil legal da instituição, escopo acadêmico sem vínculo com tenant

**Nível de ensino**:
Categoria da educação escolar: Educação Básica ou Educação Superior. Um tenant pode oferecer ambos; dentro da Educação Básica, suas regras podem variar por etapa e modalidade.
_Avoid_: Regra acadêmica única para todos os níveis

**Etapa da Educação Básica**:
Divisão da Educação Básica em Educação Infantil, Ensino Fundamental ou Ensino Médio.
_Avoid_: Tratar cada etapa como nível de ensino

**Modalidade de ensino**:
Forma de oferta educacional que atravessa ou especifica uma etapa, como a Educação de Jovens e Adultos (EJA) no Ensino Fundamental ou Médio.
_Avoid_: Tratar EJA como etapa ou nível de ensino

**Graduação**:
Tipo de curso da Educação Superior incluído no MVP.
_Avoid_: Tratar graduação como nível de ensino

**Curso técnico de nível médio**:
Curso de Educação Profissional Técnica articulado ou subsequente ao Ensino Médio. Para o cenário do MVP, há um exemplo demonstrativo de Técnico em Administração; curso técnico não é sinônimo de Ensino Médio regular nem de graduação.
_Avoid_: Tratar técnico como disciplina, confundir técnico com graduação tecnológica

**Curso**:
Percurso acadêmico concreto pertencente a um tenant, identificado por nome não vazio de até 200 caracteres e código próprio de 2 a 100 caracteres no padrão `[a-z0-9][a-z0-9-]{1,99}`, vinculado por objeto estruturado a um item idêntico do escopo educacional da instituição. Seu código é único permanentemente dentro da instituição, inclusive depois de futuro arquivamento; nomes podem repetir. No MVP, contém um PPC com matérias, carga horária e professores, recebe matrícula direta de aluno e possui `ativo`, iniciado como verdadeiro, para controlar novas operações. O nome pode ser alterado; código e item do escopo são imutáveis. Para graduação, o MVP não diferencia bacharelado, licenciatura ou tecnólogo no escopo do tenant; o cenário de teste usa Administração — Bacharelado. Curso técnico de nível médio possui categoria própria, distinta da etapa de Ensino Médio regular.
_Avoid_: Tratar uma etapa do escopo como curso único obrigatório, reutilizar código arquivado, usar curso como sinônimo de oferta, inferir subtipo de graduação

**PPC**:
Estrutura curricular única e implícita do curso no MVP, composta pelas matérias que o formam. Um curso pode ser criado sem matérias e receber seu PPC posteriormente. No MVP, não possui código, versão ou cadastro separado; alterações de matérias e professores valem imediatamente para todas as matrículas do curso.
_Avoid_: Oferta educacional, calendário de turma

**Matéria**:
Componente do PPC de um curso, identificada por nome obrigatório de até 200 caracteres e código no padrão `[a-z0-9][a-z0-9-]{1,99}`, único dentro daquele PPC, com carga horária positiva em horas inteiras e um ou mais professores colaboradores vinculados. É criada atomicamente com todos esses dados e possui `ativo`, iniciado como verdadeiro; quando ativa, sua criação ou edição exige pelo menos um colaborador ativo. Seu código é imutável; nome, carga horária e professores podem ser alterados. O mesmo código pode existir em outro curso. Créditos e ementa ficam fora do MVP.
_Avoid_: Curso inteiro, código global de matéria, professor sem vínculo com a matéria

**Avaliação**:
Instrumento de avaliação vinculado a uma matéria do curso, com título, data acadêmica e pontuação máxima positiva. No MVP, seu CRUD é operado pelo `SUPER_ADMIN`; uma avaliação com notas vinculadas não pode ser excluída.
_Avoid_: Regra de aprovação, nota automática

**Nota**:
Resultado de uma matrícula em uma avaliação da matéria do curso. No MVP, o valor deve ser igual ou maior que zero e não pode superar a pontuação máxima da avaliação. O CRUD não calcula média ou aprovação.
_Avoid_: Média final implícita, nota fora da avaliação

**Frequência**:
Registro diário por matrícula e matéria com estado `presente` ou `ausente`. A data acadêmica pode ser anterior para transferência manual de registros; a data técnica de criação permanece a do lançamento.
_Avoid_: Frequência por turma ou oferta, importação em lote no MVP

**Colaborador da instituição**:
Vínculo profissional único de uma pessoa já cadastrada no tenant, reutilizável para lecionar matérias de vários cursos da instituição. É criado apenas com o ID interno da pessoa e falha se ela não existir no tenant. Possui `ativo`, iniciado como verdadeiro; sua desativação preserva vínculos, mas pode deixar matéria sem professor ativo e bloquear novas matrículas no curso até correção. Por enquanto não possui outros dados, conta de acesso ou permissões próprias. Um professor vinculado a uma matéria deve ser colaborador do mesmo tenant. Colaboradores são listados pelo nome da pessoa.
_Avoid_: Nome livre de professor, colaborador de outro tenant, conta de acesso implícita

**Funcionário administrativo**:
Vínculo de uma pessoa existente ao quadro administrativo de uma instituição. No MVP é distinto de `Colaborador da instituição`, que representa vínculo acadêmico de docência. Deve pertencer ao tenant e pode ser ativado ou desativado; cargos de diretor e responsável pelos registros acadêmicos só podem ser atribuídos a funcionário ativo. Sua assinatura manuscrita e seu carimbo são ativos do seu perfil individual; a prontidão usa os ativos do funcionário atualmente responsável pelos registros.
_Avoid_: Colaborador acadêmico, funcionário de outro tenant, pessoa com conta implícita

**Diretor**:
Funcionário administrativo designado como diretor atual da instituição para identificação em operações e documentos. Cada instituição tem no máximo um diretor atual no perfil documental.
_Avoid_: Diretor cadastrado como texto livre sem vínculo de pessoa

**Responsável pelos registros acadêmicos**:
Funcionário administrativo designado pela instituição para responder pelos registros e documentos acadêmicos. Pode ser a mesma pessoa que o diretor. No MVP é a pessoa cujos ativos de assinatura e carimbo acompanham a configuração documental.
_Avoid_: Assinante sem vínculo institucional, responsável de outro tenant


### Vida acadêmica

**Histórico acadêmico manual**:
Registro textual estruturado por componente curricular e período, ligado a uma pessoa dentro do tenant. Preserva instituição/curso de origem, ano, período, matéria, carga horária, nota/conceito, faltas, resultado e observações informados manualmente; não depende de matrícula ou catálogo atual e não calcula nem certifica resultados. Ver ADR 0021.
_Avoid_: Histórico gerado automaticamente, histórico oficial, curso anterior como curso operacional atual

**Oferta educacional**:
Contexto de oferta de um percurso acadêmico pela instituição, que define se o início e a progressão seguem calendário de turma ou são individuais. Uma instituição pode manter ofertas com ambos os funcionamentos.
_Avoid_: Calendário único por instituição

**Matrícula**:
Vínculo direto de um aluno com um curso operacional, pelo qual a instituição acompanha sua situação e seu progresso acadêmico. É única permanentemente por pessoa e curso; exige curso ativo e PPC com ao menos uma matéria ativa e professor colaborador ativo, cria ou reutiliza o perfil de aluno e inicia `ativa`; pode ser `trancada`, `cancelada` ou `jubilada`, com cancelamento e jubilamento finais neste MVP.
_Avoid_: Conta de aluno, duplicar matrícula no mesmo curso

**Consulta pública de aluno**:
Busca pública de alunos por CPF, nome, município e UF de nascimento e curso. O resultado público contém apenas nome, curso e instituição; não expõe CPF, data de nascimento nem contatos.
_Avoid_: Acesso público irrestrito ao cadastro acadêmico

**Matrícula pendente**:
Vínculo ainda não ativado, sem participação acadêmica, que aguarda o atendimento dos requisitos definidos pela instituição ou uma exceção autorizada.
_Avoid_: Matrícula ativa, participação acadêmica automática pelo cadastro

**Ativação de matrícula**:
Transição explícita que habilita a participação acadêmica, realizada pela secretaria com permissão específica quando os requisitos institucionais são atendidos. Pode ser executada em lote, com validação e resultado por matrícula; exceções exigem autorização própria, motivo e auditoria.
_Avoid_: Ativação implícita, liberação sem permissão

**Regra acadêmica**:
Critérios de avaliação, frequência e situação acadêmica definidos pelo tenant para a oferta correspondente. Na Educação Básica, são distintos por etapa e modalidade quando aplicável; na Educação Superior, cobrem a graduação do MVP.
_Avoid_: Regra global da plataforma, regra única para toda a Educação Básica

**Requisito de ativação**:
Condição configurada por oferta para ativar uma matrícula, distinguindo requisitos obrigatórios daqueles que admitem exceção autorizada.
_Avoid_: Dispensa implícita, requisito único para todas as ofertas

**Data de início do ciclo individual**:
Data explícita definida na ativação da matrícula e registrada com a versão das regras aplicável ao ciclo individual, podendo ser retroativa. Independe do momento do primeiro acesso do aluno.
_Avoid_: Primeiro acesso como início automático do ciclo

**Versão de regra acadêmica**:
Edição identificável de uma regra acadêmica, definida pelo tenant e válida durante uma vigência. Cada ciclo acadêmico referencia a versão aplicada e mantém essa versão depois de iniciado, salvo transferência excepcional com motivo e auditoria.
_Avoid_: Regra sem versão, alteração retroativa silenciosa

**Ciclo acadêmico**:
Intervalo de uma matrícula ao qual se aplica uma versão de regra acadêmica. Pode acompanhar o período comum de uma turma ou ser individual e acelerado, como no EAD. A oferta pode organizar os ciclos em módulos, semestres, anos ou um único ciclo para o curso inteiro.
_Avoid_: Calendário único para todos os alunos

**Conclusão de ciclo**:
Fato acadêmico registrado quando o aluno satisfaz as atividades, avaliações e demais requisitos definidos para a oferta. Em ciclos individuais de EAD, a conclusão de um aluno não encerra o ciclo dos demais.
_Avoid_: Conclusão automática pelo tempo decorrido, conclusão coletiva obrigatória

**Conclusão de disciplina**:
Fato acadêmico relativo ao término de uma disciplina, distinto da conclusão do ciclo e do curso, que podem ocorrer em outros momentos.
_Avoid_: Conclusão automática do curso por concluir uma disciplina

**Conclusão de curso**:
Fato acadêmico relativo ao término do percurso do curso, distinto da conclusão de uma disciplina ou de um ciclo isolado.
_Avoid_: Conclusão de ciclo como sinônimo de conclusão de curso

### Pessoas e acesso

**Administrador institucional**:
Administrador com atuação limitada ao próprio tenant. Suas correções preservam o histórico.
_Avoid_: Acesso global à plataforma

**Pessoa**:
Indivíduo identificado no contexto de um tenant que pode ter perfis distintos, como aluno e profissional, simultaneamente. O CPF identifica a pessoa quando disponível; nos demais casos, usa-se um identificador institucional estável. Nome sozinho não une cadastros, e nenhum desses identificadores concede acesso ou define permissões. O mesmo CPF em outra instituição corresponde a um cadastro independente; alterações não se propagam entre instituições.
_Avoid_: Um cadastro acadêmico por papel

**Conta**:
Identidade de acesso administrada pelo tenant. Contas de aluno, profissional e responsável têm logins e permissões independentes, mesmo quando pertencem à mesma pessoa.
_Avoid_: Conta global da plataforma, conta única para aluno e profissional

**Conta de aluno**:
Conta usada pela pessoa em seu perfil de aluno, separada de suas contas profissional e de responsável.
_Avoid_: Conta profissional

**Perfil de aluno**:
Perfil acadêmico da pessoa dentro de um tenant, criado ou reutilizado exclusivamente pela matrícula. Pode coexistir com o vínculo de colaborador da mesma pessoa. No MVP, não cria conta, autenticação ou permissões de aluno.
_Avoid_: Pessoa sem vínculo acadêmico, conta de aluno obrigatória

**Conta profissional**:
Conta usada pela pessoa em suas funções de trabalho no tenant. Um profissional pode ter diferentes papéis profissionais sob sua conta, como professor e administrador.
_Avoid_: Conta de aluno

**Conta de responsável**:
Conta própria do responsável legal, com acesso limitado aos alunos cujo vínculo foi aprovado.
_Avoid_: Uso da conta do aluno pelo responsável

**Vínculo de responsável**:
Relação que associa uma conta de responsável a um aluno e delimita o acesso daquele responsável aos dados acadêmicos do aluno.
_Avoid_: Acesso sem vínculo, acesso a outros alunos

**Acesso de responsável**:
Consulta aos dados acadêmicos e documentos disponíveis dos alunos vinculados. Não inclui notas internas da equipe, dados de outros alunos ou dados profissionais.
_Avoid_: Acesso irrestrito ao cadastro do aluno

### Registros e documentos

**Gerador de carimbos**:
Ferramenta local que compõe uma imagem a partir de texto, cor, fonte e formato quadrado/redondo. Oferece prévia e download PNG/SVG, sem persistir cadastro ou associar o carimbo a pessoa, instituição ou documento nesta etapa.
_Avoid_: Gerador de assinatura, assinatura digital, emissão documental.

**Perfil documental da instituição**:
Configuração tenant-scoped com a marca institucional enviada em PNG ou SVG e as designações de diretor e responsável pelos registros acadêmicos. O cabeçalho padrão posiciona o Selo Nacional à esquerda e a marca enviada pela instituição à direita. A marca d'água usa a marca da instituição no canto inferior direito com opacidade de 10%.
_Avoid_: Logo inferida automaticamente pela rede, template HTML editável no MVP

**Prontidão documental**:
Estado derivado que indica se a instituição tem marca, diretor ativo, responsável ativo, assinatura PNG e carimbo PNG configurados. Instituição pode existir incompleta, mas só fica pronta para emitir documentos quando todos os requisitos estão atendidos.
_Avoid_: Instituição inválida para todos os usos, emissão com responsável ausente

**Assinatura demonstrativa**:
Representação interna da assinatura manuscrita PNG e do carimbo PNG do funcionário. A prontidão da instituição usa os ativos do funcionário designado como responsável pelos registros acadêmicos. O QR correspondente, quando integrado ao documento, segue rota distinta do QR de matrícula e não comprova assinatura criptográfica, ICP-Brasil ou autenticidade oficial.
_Avoid_: Assinatura digital real, assinatura criptográfica

**Ato regulatório**:
Texto manual associado a uma instituição ou a um curso operacional desse tenant, independente de qualquer aluno. Pode haver vários atos por alvo e cada ato tem status manual `ativo`, `vencido`, `suspenso` ou `revogado`. O CRUD do MVP não armazena anexos nem tipos separados. Fluxos consumidores selecionam explicitamente o ato e sua versão; atos já referenciados por matrícula ou documento não podem ser excluídos.
_Avoid_: Ato como documento anexado obrigatório, ato associado a aluno, status calculado automaticamente

**Versão de ato regulatório**:
Texto e status de uma edição do ato. A cada edição, o operador escolhe preservar a versão vigente ou sobrescrevê-la sem histórico. Versões preservadas permanecem independentes, podem ser escolhidas em operações futuras e têm o texto selecionado copiado para o registro da operação que as utiliza.
_Avoid_: Versão atualizada por vencimento automático, histórico obrigatório de toda edição

**Uso de ato regulatório**:
Referência da matrícula ou emissão de documento ao ato e à versão selecionados. Na matrícula, são escolhidos separadamente um ato da instituição e um do curso; o registro preserva texto/status selecionados. O comprovante de matrícula também seleciona e preserva os dois atos usados na emissão, inclusive se inativos, exigindo justificativa para permitir essa emissão. O vínculo protege o ato contra exclusão e não é uma trilha geral de auditoria. Exceções na matrícula guardam responsável autenticado, data/hora e justificativa na própria matrícula. Histórico e diploma ainda precisam definir como consomem atos nos respectivos fluxos de emissão.
_Avoid_: Auditoria transversal, uso implícito do ato mais recente

**Registro de auditoria**:
Evidência de uma ação relevante, com seu autor, momento, motivo e estado anterior quando aplicável; é requisito do sistema completo e está fora do MVP atual.
_Avoid_: Histórico sem autoria

**Credencial demonstrativa**:
Documento acadêmico de conclusão emitido pelo MVP para Educação Básica ou graduação, vinculado a aluno e curso, com tipo e data de emissão. Neste MVP pode ser editado ou excluído mesmo após a emissão; a edição recalcula o hash e troca o token público, conforme ADR 0020. No sistema completo, a emissão será imutável e correções usarão revogação e nova emissão.
_Avoid_: Documento oficial, assinatura oficial

**Validação pública**:
Consulta de credencial emitida que informa seu status, tipo, instituição, curso, data de emissão, nome completo do titular e caráter demonstrativo. Não expõe CPF, data de nascimento, endereço, notas, histórico ou IDs internos; token inexistente, excluído ou anterior a uma edição retorna não encontrado.
_Avoid_: Consulta pública de rascunho, exposição do histórico acadêmico
