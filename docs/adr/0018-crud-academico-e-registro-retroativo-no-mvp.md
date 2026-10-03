# ADR 0018 — CRUD acadêmico e registro retroativo no MVP
## Contexto
O MVP inclui avaliação, nota e frequência, mas os campos e vínculos ainda não estavam definidos. Também é necessário transferir manualmente registros históricos de sistemas anteriores. Esta decisão fecha apenas o contrato mínimo de lançamento e manutenção; critérios acadêmicos de média, aprovação e progressão continuam fora do recorte.
## Decisão
- O `SUPER_ADMIN` opera os CRUDs escolhendo explicitamente o tenant, conforme o modelo centralizado e isolado do MVP.
- Uma avaliação pertence a uma matéria e possui título, data acadêmica e pontuação máxima positiva.
- Uma nota pertence a uma matrícula e a uma avaliação da matéria do curso dessa matrícula. Seu valor fica entre zero e a pontuação máxima da avaliação.
- Uma frequência pertence a uma matrícula, matéria e data acadêmica, com um único estado por dia: `presente` ou `ausente`.
- Os três fluxos aceitam lançamento manual de datas acadêmicas passadas pelo CRUD normal, para transferência de registros de sistemas anteriores. Não há importação em lote neste recorte. A data acadêmica não altera a data técnica em que o registro foi criado ou atualizado.
- A exclusão é física. Avaliações que tenham notas vinculadas não podem ser excluídas; notas e frequências podem ser excluídas individualmente.
- Não há cálculo de média, aprovação, reprovação, recuperação ou frequência mínima neste contrato. Integrações EAD ficam pós-MVP.
- A implementação e seus testes desta etapa usam SQLite.
- Auditoria não é implementada no MVP. O requisito permanece no sistema completo, conforme ADR 0016.
## Consequências
- O serviço acadêmico valida tenant, curso, matéria, matrícula e avaliação antes de gravar.
- O SQLite reforça unicidade da nota por matrícula/avaliação e da frequência por matrícula/matéria/data.
- O ticket `.scratch/avaliacoes-notas-frequencia/` detalha os casos de uso e a cobertura nos seams de serviço, SQLite, HTTP e Cypress visível.
