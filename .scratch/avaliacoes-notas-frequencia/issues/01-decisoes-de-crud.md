# 01 — Fechar contrato dos CRUDs de avaliação, nota e frequência

**What to build:** definir campos, vínculos, granularidade da frequência, permissões e comportamento de edição/exclusão para habilitar uma implementação sem regras acadêmicas inventadas.

**Blocked by:** None — decision work can start immediately.

**Priority:** 1

**Status:** done
- [x] Definir os campos mínimos de avaliação e a relação com curso/matéria.
- [x] Definir como uma nota se vincula a aluno, avaliação e matrícula e quais valores são aceitos.
- [x] Definir a granularidade do registro de frequência (por aula, dia ou outro período) e seus estados.
- [x] Definir quais operadores têm permissão para criar, editar e excluir cada recurso.
- [x] Decidir se exclusão é física ou lógica e quais verificações de vínculo são obrigatórias.
- [x] Permitir lançamento retroativo com data acadêmica passada e sem limite temporal; manter a data técnica de gravação separada.
- [x] Manter fórmulas, médias, aprovação, recuperação e frequência mínima fora deste ticket até decisão explícita.

## Comments

A ausência dessas regras é pendência de especificação, não atraso de implementação.

Decisão registrada: operadores podem transferir manualmente, pelo CRUD normal, registros com datas acadêmicas anteriores oriundos de sistemas prévios. Não há importação em lote neste recorte. A especificação distingue a data acadêmica do evento da data técnica em que o sistema recebe o registro.

Contrato aprovado: avaliação por matéria (título, data acadêmica, pontuação máxima positiva); nota por matrícula + avaliação (de zero até o máximo da avaliação); frequência presente/ausente, única por matrícula + matéria + data. Operações apenas por `SUPER_ADMIN`; exclusão física, mas avaliação com notas é protegida contra exclusão. Sem média ou aprovação automática.

Implementação concluída com os testes do ticket 02; contrato pronto para revisão humana.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/avaliacoes-notas-frequencia/01-decisoes-de-crud/2026-10-03T11-29-58-679Z/run.txt`) e produziu o vídeo `logs/e2e/avaliacoes-notas-frequencia/01-decisoes-de-crud/2026-10-03T11-29-58-679Z/videos/01-decisoes-de-crud.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
