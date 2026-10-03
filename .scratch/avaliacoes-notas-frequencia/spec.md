# Avaliações, notas e frequência
Status: ready-for-human
## Problem Statement
O MVP precisa permitir a gestão acadêmica de avaliações, notas e frequência associadas às pessoas matriculadas em cursos. Hoje o fluxo central termina na matrícula direta e não existe um recorte implementável para registrar estes dados de forma vinculada e consultável.
## Solution
Adicionar os fluxos de criar, consultar, editar e excluir avaliações, notas e registros de frequência no tenant selecionado. As operações devem validar as referências acadêmicas e manter os registros acessíveis para compor históricos posteriormente. O operador deve poder lançar manualmente, pelo fluxo normal do sistema, registros com datas acadêmicas anteriores para transferir dados vindos de sistemas anteriores. Não haverá importação em lote nesta etapa. A data acadêmica do evento é distinta da data técnica em que o sistema recebe o registro. Campos, granularidade de frequência e regras de avaliação ainda não foram decididos; esta especificação preserva essas lacunas sem convertê-las em atraso de implementação.
## User Stories
1. Como operador acadêmico autorizado, quero criar uma avaliação no contexto de um curso e matéria, para registrar o instrumento de avaliação utilizado.
2. Como operador, quero consultar avaliações e seus vínculos, para entender quais registros de nota pertencem ao percurso.
3. Como operador, quero editar uma avaliação, para corrigir ou atualizar sua definição.
4. Como operador, quero excluir uma avaliação, para remover um registro criado por engano conforme as regras que forem decididas.
5. Como operador, quero registrar nota para um aluno matriculado, para documentar um resultado de avaliação.
6. Como operador, quero consultar notas de um aluno, avaliação ou matéria, para acompanhar seus resultados.
7. Como operador, quero editar e excluir notas, para corrigir registros de acordo com o CRUD aprovado.
8. Como operador, quero registrar frequência para alunos vinculados ao curso, para manter sua participação consultável.
9. Como operador, quero consultar, editar e excluir frequência, para corrigir e manter os registros acadêmicos.
10. Como responsável pela instituição, quero que todas as operações respeitem o tenant, matrícula, curso e matéria, para impedir vínculos cruzados.
11. Como responsável acadêmico, quero que os registros CRUD não calculem aprovação automaticamente até que as regras sejam definidas, para não inventar critérios.
## Implementation Decisions
- Responsabilidade de domínio pertence a `academic`; consultas e gravações passam por serviços públicos e portas dos adaptadores.
- Pré-condição de segurança: tenant e permissão são resolvidos no servidor; referências a aluno, matrícula, curso, matéria e avaliação são validadas no mesmo contexto.
- O usuário pediu CRUD completo para avaliação, nota e frequência. Campos, distinção entre exclusão física/lógica e eventuais limites de edição continuam pendentes quando puderem afetar comportamento acadêmico.
- Avaliações, notas e frequência podem ser lançadas manualmente com data acadêmica passada para transferir registros de sistemas anteriores pelo fluxo normal do CRUD. Não haverá importação em lote neste recorte. A data técnica de criação/atualização não deve ser retrodatada para simular quando o lançamento ocorreu; são fatos distintos.
- Contrato mínimo aprovado pelo usuário: avaliação pertence a uma matéria e contém título, data acadêmica e pontuação máxima positiva; nota liga matrícula e avaliação e aceita valor entre zero e a pontuação máxima; frequência é um estado presente/ausente por matrícula, matéria e data acadêmica.
- O MVP executa esses CRUDs para `SUPER_ADMIN`, com exclusão física; avaliação que já tenha notas não pode ser excluída. Não se calculam média nem aprovação.
- A frequência requer decisão de granularidade (por aula, dia, componente ou outro período) e representação de presença/ausência. Não presumir turma ou oferta, que permanecem fora do recorte atual.
- Regras de cálculo de nota, pesos, recuperação, média, frequência mínima, aprovação/reprovação e transição de matrícula não estão decididas por esta especificação.
- Integração com ambiente EAD externo fica depois do MVP. O registro é feito pelo CRUD do sistema.
- Nenhuma operação grava trilha de auditoria neste MVP; o requisito segue no sistema completo.
## Testing Decisions
- Seams confirmados pelo usuário: serviço público do módulo `academic`, adaptador SQLite, endpoints HTTP e fluxo ponta a ponta no Cypress em navegador visível.
- Testar comportamento externo pelo serviço público do módulo acadêmico, cobrindo criação, consulta, edição, exclusão, validação de vínculos e erros normalizados.
- O adaptador SQLite deve provar persistência, unicidade e atomicidade aplicáveis ao contrato decidido.
- HTTP verifica autorização, tenant-alvo explícito no modelo operacional atual e formato de entrada/saída. Cypress percorre as telas CRUD em navegador visível.
- Usar dados fictícios, não chamar integrações EAD e não testar regras acadêmicas ainda não aprovadas.
- Política de regressão E2E: jornadas de funcionalidades novas partem de um estado-base de teste preparado e validado. Não repetem interativamente provisionamento de `SUPER_ADMIN`, criação de instituições ou criação de cursos que já foram cobertos. Os cenários E2E devem concentrar-se no fluxo novo ou alterado.
- A cobertura dos fluxos-base permanece disponível em testes direcionados; ela volta a ser executada quando esses cadastros/provisionamentos forem alterados ou quando uma falha no fluxo novo indicar que o estado-base ou seus dados estão incorretos. Nesse caso, verificar também que a fixture contém os registros esperados antes de atribuir a falha ao novo fluxo.
- Essa decisão limita a repetição das jornadas visíveis, não remove as verificações automatizadas existentes de regressão das suítes unitária, HTTP e persistência, nem altera o comando completo de testes. O Cypress deve continuar abrindo o navegador visível.
## Out of Scope
- Integração/importação automática de resultados de EAD.
- Cálculos, critérios de aprovação ou progressão automáticos sem decisões acadêmicas explícitas.
- Turmas, ofertas, calendário coletivo, avaliações externas oficiais e auditoria.
- Reexecutar o onboarding de `SUPER_ADMIN`, criação de instituições e criação de cursos como pré-condição interativa de cada nova jornada E2E.
## Further Notes
- A ADR 0015 mantém matrícula direta no curso e PPC com matérias; a ADR 0016 acrescenta estas operações ao MVP.
- Decisão aprovada: campos mínimos, vínculos, escala limitada pela pontuação máxima da avaliação, granularidade diária de frequência, estados presente/ausente, execução por `SUPER_ADMIN` e exclusão física conforme as regras acima. Fórmulas de avaliação seguem fora do MVP.
- A política de preparação e escopo das jornadas E2E está registrada na ADR 0019 e em `docs/TESTES.md`.
