# Históricos acadêmicos
Status: needs-info
## Problem Statement
O MVP precisa permitir criar, consultar, editar e excluir registros de histórico acadêmico. As informações que compõem o histórico e sua relação com notas, frequência e conclusão ainda não foram definidas com detalhe suficiente para implementar sem inventar regra acadêmica.
## Solution
Oferecer operações CRUD para históricos vinculados a alunos e à instituição-alvo, com isolamento por tenant e consulta para o operador autorizado. Os dados e as regras de geração/atualização serão fechados antes da implementação detalhada. Nenhum documento é declarado oficial por existir no sistema.
## User Stories
1. Como operador autorizado, quero criar um registro de histórico para um aluno, para manter seus fatos acadêmicos consultáveis.
2. Como operador, quero consultar o histórico do aluno, para revisar seus registros acadêmicos.
3. Como operador, quero editar um registro de histórico, para corrigir seus dados conforme as regras aprovadas.
4. Como operador, quero excluir um registro de histórico, para corrigir uma inclusão indevida conforme as regras aprovadas.
5. Como responsável acadêmico, quero vincular o histórico apenas a aluno e curso do tenant correto, para impedir mistura de registros.
6. Como responsável pela privacidade, quero que toda consulta respeite a autorização do operador, para proteger dados acadêmicos pessoais.
7. Como instituição, quero que documentos e históricos demonstrativos indiquem claramente seu caráter de demonstração, para não alegar validade oficial não implementada.
## Implementation Decisions
- `academic` mantém os fatos de matrícula, avaliações, notas e frequência; `credential` permanece dono das credenciais emitidas. A fronteira de ownership do histórico precisa ser decidida junto com seu modelo.
- CRUD foi explicitamente incluído no MVP. O modelo de histórico — campos, granularidade, origem manual ou composição a partir de dados acadêmicos, versionamento e regras de edição/exclusão — permanece pendente.
- Não assumir geração automática, fechamento de curso, cálculo de conclusão ou equivalência de estudos.
- As operações devem validar titular, curso, tenant e autorização no servidor. Exposição pública do histórico não foi aprovada.
- Não registrar auditoria no MVP. Auditoria continua requisito do sistema completo.
- Integração externa EAD e integração governamental oficial permanecem fora do MVP.
## Testing Decisions
- Após fechar o modelo, cobrir CRUD pela fronteira pública do serviço, incluindo vínculos entre tenants, autorizações, edição/exclusão e dados mínimos.
- Não testar cálculos ou automações não decididos nem depender de fonte externa durante a suíte padrão.
## Out of Scope
- Afirmar validade oficial de históricos ou emissão documental governamental.
- Gerar histórico automaticamente a partir de regras ainda não definidas.
- Integração EAD, integração MEC e auditoria.
## Further Notes
- O CRUD está confirmado pelo usuário. A falta de campos e regras é uma pendência de especificação, não trabalho atrasado.
- A decisão seguinte deve definir conteúdo/formatos do histórico e se ele é manual, composto ou gerado; não se deve deduzir isso do CRUD de credenciais.
