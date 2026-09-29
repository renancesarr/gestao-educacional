# Gestão acadêmica

Vocabulário do sistema que atende instituições brasileiras de Educação Básica e Ensino Superior. O MVP inclui os dois níveis.

## Linguagem

### Organização e ensino

**Tenant**:
Fronteira independente de dados, contas e configurações pertencente a uma única instituição/unidade. Um tenant pode oferecer mais de um nível de ensino.
_Avoid_: Mantenedora como tenant, rede como tenant

**Instituição/unidade**:
Organização educacional individual atendida pelo sistema e correspondente a um tenant.
_Avoid_: Rede como sinônimo de tenant

**Nível de ensino**:
Categoria da oferta educacional, como Educação Básica ou graduação. Cada tenant administra regras acadêmicas próprias para cada nível que oferece.
_Avoid_: Regra acadêmica única para todos os níveis

### Vida acadêmica

**Matrícula**:
Vínculo de um aluno com um curso ou oferta educacional, pelo qual a instituição acompanha sua situação e seu progresso acadêmico.
_Avoid_: Conta de aluno

**Regra acadêmica**:
Critérios de avaliação, frequência e situação acadêmica definidos pelo tenant para um nível de ensino.
_Avoid_: Regra global da plataforma

**Versão de regra acadêmica**:
Edição identificável das regras acadêmicas, definida pelo tenant para um nível de ensino e válida durante uma vigência. Cada ciclo acadêmico referencia a versão aplicada e mantém essa versão depois de iniciado, salvo transferência excepcional com motivo e auditoria.
_Avoid_: Regra sem versão, alteração retroativa silenciosa

**Ciclo acadêmico**:
Intervalo de uma matrícula ao qual se aplica uma versão de regra acadêmica. Pode acompanhar o período comum de uma turma ou ser individual e acelerado, como no EAD.
_Avoid_: Calendário único para todos os alunos

### Pessoas e acesso

**Pessoa**:
Indivíduo identificado no contexto de um tenant que pode ter perfis distintos, como aluno e profissional, simultaneamente. O CPF identifica a pessoa; não concede acesso nem define permissões.
_Avoid_: Um cadastro acadêmico por papel

**Conta**:
Identidade de acesso administrada pelo tenant. Contas de aluno, profissional e responsável têm logins e permissões independentes, mesmo quando pertencem à mesma pessoa.
_Avoid_: Conta global da plataforma, conta única para aluno e profissional

**Conta de aluno**:
Conta usada pela pessoa em seu perfil de aluno, separada de suas contas profissional e de responsável.
_Avoid_: Conta profissional

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

**Registro de auditoria**:
Evidência de uma ação relevante, com seu autor, momento, motivo e estado anterior quando aplicável.
_Avoid_: Histórico sem autoria

**Credencial demonstrativa**:
Documento acadêmico de conclusão emitido pelo MVP para Educação Básica ou graduação, identificado como demonstrativo e regido pelos critérios do respectivo nível.
_Avoid_: Documento oficial, assinatura oficial

**Validação pública**:
Consulta de credencial emitida que informa seu status atual, instituição, curso ou tipo de credencial, datas e nome completo do titular. Não expõe CPF, data de nascimento, endereço, notas ou histórico; rascunhos não são consultáveis.
_Avoid_: Consulta pública de rascunho, exposição do histórico acadêmico
