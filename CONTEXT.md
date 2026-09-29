# Gestão acadêmica

Vocabulário do domínio para instituições brasileiras de Educação Básica e Ensino Superior.

## Organização e escopo

**Tenant**:
Fronteira independente de dados, contas e configuração pertencente a uma única instituição/unidade atendida pelo sistema. Um tenant pode oferecer Educação Básica e graduação.
_Avoid_: Mantenedora como tenant, rede como tenant

**Instituição/unidade**:
Organização educacional individual que usa o sistema e corresponde a um tenant. Cada unidade mantém seus próprios dados e configurações.
_Avoid_: Rede como sinônimo de tenant

**MVP**:
Primeira entrega do produto que atende Educação Básica e graduação desde o lançamento.
_Avoid_: MVP de um único nível de ensino

**Regra acadêmica**:
Configuração de avaliação, frequência e situação acadêmica definida pelo tenant para um nível de ensino. Um tenant que oferece Educação Básica e graduação mantém configurações separadas por nível.
_Avoid_: Regra global da plataforma

**Versão de regra acadêmica**:
Edição imutável das regras de um nível de ensino, com vigência definida pelo tenant; cada ciclo iniciado permanece ligado à sua versão original, salvo transferência excepcional motivada e auditada.
_Avoid_: Alteração retroativa silenciosa da regra

**Ciclo acadêmico**:
Intervalo em que uma matrícula aplica uma versão de regra acadêmica. Pode seguir um período comum da turma ou ter ritmo individual, como no EAD acelerado.
_Avoid_: Calendário único para todos os alunos

**Conta**:
Identidade de autenticação administrada por um tenant, com login próprio e permissões próprias. A conta de aluno é separada da conta profissional, mesmo quando ambas pertencem à mesma pessoa e usam o mesmo CPF cadastrado.
_Avoid_: Conta global da plataforma, conta única para aluno e profissional

**Pessoa**:
Indivíduo real identificado no contexto do tenant, que pode manter ao mesmo tempo um vínculo profissional e um vínculo de aluno/cliente. Seus perfis de aluno e profissional são separados e podem ter contas independentes. CPF identifica a pessoa, não concede acesso nem determina permissões.
_Avoid_: Um cadastro por papel

**Conta de aluno**:
Conta de acesso usada pela pessoa no papel de aluno/cliente, com login e permissões independentes da conta profissional.
_Avoid_: Conta profissional

**Conta profissional**:
Conta de acesso usada pela pessoa em funções de trabalho no tenant, como professor ou equipe administrativa. Seus papéis autorizam operações profissionais e não concedem acesso à conta de aluno da mesma pessoa.
_Avoid_: Conta de aluno

**Credencial demonstrativa**:
Documento acadêmico emitido pelo MVP para Educação Básica ou graduação, identificado como demonstração e validável publicamente com tipo e critérios próprios do nível de ensino.
_Avoid_: Documento oficial, assinatura oficial

## Segurança e rastreabilidade

**Autenticação multifator (MFA)**:
Verificação adicional obrigatória para contas profissionais `TENANT_ADMIN` e `SUPER_ADMIN`.
_Avoid_: MFA opcional para administradores
