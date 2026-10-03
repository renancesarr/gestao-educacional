# Históricos acadêmicos
Status: ready-for-human
## Problem Statement
O MVP permite criar, consultar, editar e excluir registros manuais de histórico acadêmico. O contrato adotado para transferência manual está definido na ADR 0021 e não calcula resultados nem declara o registro oficial.
## Solution
Oferecer operações CRUD para lançamentos manuais de histórico vinculados a aluno e tenant. Cada registro representa um componente curricular em um período acadêmico e pode preservar curso/instituição de origem que não existam no catálogo atual. Nenhum documento é declarado oficial por existir no sistema.
## User Stories
1. Como operador autorizado, quero criar um registro de histórico para um aluno, para manter seus fatos acadêmicos consultáveis.
2. Como operador, quero consultar o histórico do aluno, para revisar seus registros acadêmicos.
3. Como operador, quero editar um registro de histórico, para corrigir seus dados conforme as regras aprovadas.
4. Como operador, quero excluir um registro de histórico, para corrigir uma inclusão indevida conforme as regras aprovadas.
5. Como responsável acadêmico, quero vincular o histórico apenas a aluno e curso do tenant correto, para impedir mistura de registros.
6. Como responsável pela privacidade, quero que toda consulta respeite a autorização do operador, para proteger dados acadêmicos pessoais.
7. Como instituição, quero que documentos e históricos demonstrativos indiquem claramente seu caráter de demonstração, para não alegar validade oficial não implementada.
## Implementation Decisions
- `academic` mantém os fatos de matrícula, avaliações, notas, frequência e históricos; `credential` permanece dono das credenciais emitidas.
- CRUD manual foi confirmado no MVP. O contrato de campos e granularidade segue a ADR 0021: uma linha por componente/período, preenchida manualmente e ligada à pessoa do tenant.
- Não assumir geração automática, fechamento de curso, cálculo de conclusão ou equivalência de estudos.
- As operações devem validar titular, curso, tenant e autorização no servidor. Exposição pública do histórico não foi aprovada.
- Não registrar auditoria no MVP. Auditoria continua requisito do sistema completo.
- Integração externa EAD e integração governamental oficial permanecem fora do MVP.
## Testing Decisions
- Cobrir CRUD pela fronteira pública do serviço, incluindo vínculos entre tenants, autorizações, edição/exclusão e campos opcionais.
- Não testar cálculos ou automações não decididos nem depender de fonte externa durante a suíte padrão.
## Out of Scope
- Afirmar validade oficial de históricos ou emissão documental governamental.
- Gerar histórico automaticamente a partir de regras ainda não definidas.
- Integração EAD, integração MEC e auditoria.
## Further Notes
- O CRUD está confirmado pelo usuário. O modelo mínimo foi escolhido para suportar transferência manual sem depender da matrícula atual; essa decisão está documentada na ADR 0021.
- Não deduzir o histórico do CRUD de credenciais nem criar cálculo/geração automática.
