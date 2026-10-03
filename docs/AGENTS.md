# Instruções para agentes
Estas instruções se aplicam a todo o projeto. Os caminhos mencionados são relativos à raiz do repositório, salvo indicação explícita.
## Contexto e escopo
Este projeto é um sistema de gestão acadêmica brasileiro, multi-tenant e white label, para Ensino Fundamental, Ensino Médio, EJA e graduação. O MVP é um monólito modular voltado ao núcleo acadêmico; Educação Infantil fica para uma possível expansão futura. O recorte atual inclui catálogo importado e consultável de instituições e cursos, matrícula individual pelo site, busca de alunos e CRUD de avaliações, notas, frequência, históricos e credenciais. Consulte a ADR 0016 para limites e pendências desse recorte.
Antes de propor ou implementar comportamento de produto, leia `docs/IDEIA.md`, fonte dos princípios e limites do projeto. Seu status é **em validação**: transforme ambiguidades relevantes em decisões explícitas, sem inventar regras acadêmicas ou exigências legais. Ao alterar o domínio, consulte também `docs/CONTEXT.md` e `docs/adr/`, se existirem.
Mantenha fora do MVP: ERP financeiro, folha de pagamento, integração governamental oficial, assinatura ICP-Brasil real, aplicativo nativo e BI avançado. Expansões exigem mudança explícita de escopo.
## Invariantes de implementação
- **Isolamento:** entidades sensíveis carregam `tenantId`. Resolva o tenant a partir de contexto autenticado e autorizado; valide também vínculos entre entidades. Aplique o isolamento em leituras, escritas, relatórios e geração de documentos. Acesso global de `SUPER_ADMIN` deve ser explícito; sua auditoria pertence ao sistema completo e está fora do MVP atual.
- **Autorização:** valide papel, permissão e alcance do recurso no servidor. Considere vínculos como professor–turma e aluno–registro; esconder controles na interface não protege a operação.
- **Verdade registral:** no sistema completo, alterações de notas, frequência, matrículas e documentos preservam rastreabilidade. A trilha de auditoria está fora do MVP atual; não a exija nem a acrescente ao recorte sem nova decisão. Preserve esse requisito para a evolução do produto.
- **Privacidade:** minimize coleta, respostas, logs e dados públicos. Use dados fictícios em testes e demonstrações. Consentimentos e suas alterações são rastreáveis; regras de retenção e direitos do titular precisam de decisões explícitas.
- **Regras acadêmicas:** média, frequência, recuperação e transições de matrícula são configuráveis no contexto institucional e acadêmico adequado. Educação Básica e Ensino Superior podem exigir fluxos diferentes.
- **Histórico acadêmico:** no MVP, cada componente/período é digitado manualmente e vinculado a uma pessoa do tenant. Não exija matrícula/curso atual nem calcule ou gere conteúdo; siga o modelo da ADR 0021.
- **Credenciais:** no sistema completo, preserve o conteúdo emitido e corrija por revogação e nova emissão. No MVP, a ADR 0016 permite editar e excluir credenciais já emitidas; esta exceção temporária não remove o princípio do sistema completo. A ADR 0020 define os campos editáveis, hash, rotação do token e comportamento da validação pública.
- **Validação pública:** `/validar/:token` verifica integridade e status e retorna apenas os dados mínimos do documento. A auditoria dessa consulta pertence ao sistema completo, mas fica fora do MVP atual. O token não concede acesso aos demais dados acadêmicos do titular.
- **Demonstração:** identifique claramente diplomas, certificados e assinaturas do MVP como demonstrativos. Não declare validade oficial, integração MEC ou assinatura ICP-Brasil implementada.
## Arquitetura
Use as fronteiras `identity`, `institution`, `people`, `academic`, `credential` e `lgpd`. A fronteira `audit` pertence à arquitetura do sistema completo, mas sua implementação está fora do MVP atual. Integrações entre módulos passam por serviços públicos, DTOs ou eventos; internals de outro módulo não são contratos.
- Controllers/route handlers adaptam HTTP, validam entrada e chamam casos de uso.
- Services aplicam regras, autorização e consistência, coordenando persistência e eventos. Auditoria não é requisito de implementação neste MVP.
- Repositories/acesso Prisma concentram persistência; DTOs/schemas definem contratos e validação.
- Aplique SOLID com abstrações proporcionais ao problema. Mantenha regras de negócio independentes de detalhes de transporte e infraestrutura.
- Mantenha domínio e casos de uso independentes do mecanismo de persistência por contratos/portas; adapte consultas, transações, restrições e migrações dentro de cada adaptador. Durante o desenvolvimento do MVP e em todos os testes, use SQLite; não implemente, execute nem exija verificações PostgreSQL nesse período. Na passagem do MVP para homologação, migrar de SQLite para PostgreSQL. UUIDs e datas UTC são diretrizes do MVP. Inspecione manifests e configurações antes de assumir framework, ferramentas ou comandos já disponíveis.
- Eventos representam fatos efetivamente ocorridos. Auditoria permanece requisito futuro do sistema completo, não um requisito transacional do MVP atual.
- Normalize erros sem expor dados pessoais ou detalhes internos. Collector, Chain of Responsibility e Full-Chain Walk são opções a avaliar, não decisões já aprovadas.
Preserve um único backend modular. Filas externas, microserviços e infraestrutura adicional precisam de uma necessidade demonstrada.
## Agent skills
### Localização e uso
Procure a skill em `.agents/skills/<nome>/SKILL.md` no projeto; se ausente, consulte `~/.agents/skills/<nome>/SKILL.md` ou o caminho informado pelo catálogo da sessão. Leia apenas as skills relevantes e seus arquivos de apoio necessários. Se uma skill solicitada estiver indisponível, informe a limitação.
Use os gatilhos abaixo para selecionar o fluxo; a presença de uma skill não exige executá-la em toda tarefa:
| Situação | Skill |
| --- | --- |
| Configurar tracker, labels e localização dos documentos | `setup-matt-pocock-skills` |
| Definir termos do domínio ou registrar decisões arquiteturais | `domain-modeling` |
| Projetar interfaces e fronteiras de módulos | `codebase-design` |
| Investigar falha ou regressão | `diagnosing-bugs` |
| Desenvolver com testes primeiro | `tdd` |
| Pesquisar documentação ou fatos técnicos | `research` |
| Revisar alterações contra requisitos e padrões | `code-review` |
| Criar ou alterar instruções para agentes | `writing-for-agents` |
Quando solicitadas, use `to-spec` para consolidar especificações, `to-tickets` para decompor trabalho, `implement` para executar especificações/tickets e `triage` para tratar a fila de solicitações. Consulte o catálogo para outros fluxos especializados.
### Issue tracker
Tarefas e especificações usam Markdown local em `.scratch/<feature>/`. Antes de criar, consultar ou atualizar tickets, leia `docs/agents/issue-tracker.md`.
### Triage labels
A triagem usa `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` e `wontfix`. Antes de triar, leia `docs/agents/triage-labels.md`.
### Domain docs
Domínio único, com glossário em `docs/CONTEXT.md` e decisões em `docs/adr/`. Antes de explorar o domínio ou alterar seus documentos, leia `docs/agents/domain.md`.
## Verificação e entrega
Descubra comandos de execução, lint, tipos e testes nos arquivos reais do projeto. Verifique a configuração e disponibilidade do devcontainer antes de depender dele. Não apresente ferramentas ou checks inexistentes como disponíveis.
Para mudanças de comportamento, teste o caso de uso e suas falhas relevantes. Priorize evidências de:
- isolamento entre dois tenants, inclusive referências cruzadas e tentativas de acesso por ID;
- negação de acesso por permissão ou vínculo insuficiente;
- limites e variações das regras acadêmicas configuradas;
- integridade das alterações críticas; auditoria permanece fora do MVP atual, conforme ADR 0016;
- emissão, revogação, integridade e minimização na validação pública de credenciais.
Use migrações controladas para mudanças de dados e explicite impactos sobre registros existentes. Ao concluir, informe o comportamento alterado, as verificações executadas e as limitações restantes. Distinga checks aprovados daqueles que não puderam ser executados.
