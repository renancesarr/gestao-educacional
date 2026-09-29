# Instruções para agentes

## Contexto e escopo

Este projeto é um sistema de gestão acadêmica brasileiro, multi-tenant e white label, para Educação Básica (incluindo EJA) e graduação. O MVP é um monólito modular voltado ao núcleo acadêmico.

Antes de propor ou implementar comportamento de produto, leia `IDEA.md`, fonte dos princípios e limites do projeto. Seu status é **em validação**: transforme ambiguidades relevantes em decisões explícitas, sem inventar regras acadêmicas ou exigências legais. Ao alterar o domínio, consulte também `CONTEXT.md` e `docs/adr/`, se existirem.

Mantenha fora do MVP: ERP financeiro, folha de pagamento, integração governamental oficial, assinatura ICP-Brasil real, aplicativo nativo e BI avançado. Expansões exigem mudança explícita de escopo.

## Invariantes de implementação

- **Isolamento:** entidades sensíveis carregam `tenantId`. Resolva o tenant a partir de contexto autenticado e autorizado; valide também vínculos entre entidades. Aplique o isolamento em leituras, escritas, relatórios e geração de documentos. Acesso global de `SUPER_ADMIN` deve ser explícito e auditado.
- **Autorização:** valide papel, permissão e alcance do recurso no servidor. Considere vínculos como professor–turma e aluno–registro; esconder controles na interface não protege a operação.
- **Verdade registral:** alterações de notas, frequência, matrículas e documentos preservam rastreabilidade, com autor, data, motivo e estado anterior quando aplicável. Garanta consistência entre a alteração crítica e seu registro de auditoria.
- **Privacidade:** minimize coleta, respostas, logs e dados públicos. Use dados fictícios em testes e demonstrações. Consentimentos e suas alterações são rastreáveis; regras de retenção e direitos do titular precisam de decisões explícitas.
- **Regras acadêmicas:** média, frequência, recuperação e transições de matrícula são configuráveis no contexto institucional e acadêmico adequado. Educação Básica e Ensino Superior podem exigir fluxos diferentes.
- **Credenciais:** preserve o conteúdo emitido; correções seguem um fluxo explícito de revogação e nova emissão. Respeite os estados `DRAFT`, `ISSUED` e revogado e suas transições autorizadas. Payload, XML, hash, token público, QR Code e assinatura demonstrativa devem permanecer coerentes.
- **Validação pública:** `/validar/:token` verifica integridade e status, retorna apenas os dados mínimos do documento e registra auditoria. O token não concede acesso aos demais dados acadêmicos do titular.
- **Demonstração:** identifique claramente diplomas, certificados e assinaturas do MVP como demonstrativos. Não declare validade oficial, integração MEC ou assinatura ICP-Brasil implementada.

## Arquitetura

Use as fronteiras `identity`, `institution`, `people`, `academic`, `credential`, `lgpd` e `audit`. Integrações entre módulos passam por serviços públicos, DTOs ou eventos; internals de outro módulo não são contratos.

- Controllers/route handlers adaptam HTTP, validam entrada e chamam casos de uso.
- Services aplicam regras, autorização e consistência, coordenando persistência, auditoria e eventos.
- Repositories/acesso Prisma concentram persistência; DTOs/schemas definem contratos e validação.
- Aplique SOLID com abstrações proporcionais ao problema. Mantenha regras de negócio independentes de detalhes de transporte e infraestrutura.
- PostgreSQL, UUIDs e datas em UTC são diretrizes do MVP. Inspecione manifests e configurações antes de assumir framework, ferramentas ou comandos já disponíveis.
- Eventos representam fatos efetivamente ocorridos. Ao usar eventos internos, trate falhas de forma que a auditoria obrigatória não dependa de entrega sem garantia.
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

### Configuração do repositório

Antes de operar tickets ou triagem, leia `docs/agents/issue-tracker.md` e `docs/agents/triage-labels.md`, se existirem. Antes de criar ou reorganizar documentação de domínio, leia `docs/agents/domain.md`, se existir. A ausência desses arquivos significa que a configuração ainda precisa ser definida; não presuma GitHub, tracker local ou labels escolhidas.

## Verificação e entrega

Descubra comandos de execução, lint, tipos e testes nos arquivos reais do projeto. Verifique a configuração e disponibilidade do devcontainer antes de depender dele. Não apresente ferramentas ou checks inexistentes como disponíveis.

Para mudanças de comportamento, teste o caso de uso e suas falhas relevantes. Priorize evidências de:

- isolamento entre dois tenants, inclusive referências cruzadas e tentativas de acesso por ID;
- negação de acesso por permissão ou vínculo insuficiente;
- limites e variações das regras acadêmicas configuradas;
- integridade e auditoria das alterações críticas;
- emissão, revogação, integridade e minimização na validação pública de credenciais.

Use migrações controladas para mudanças de dados e explicite impactos sobre registros existentes. Ao concluir, informe o comportamento alterado, as verificações executadas e as limitações restantes. Distinga checks aprovados daqueles que não puderam ser executados.