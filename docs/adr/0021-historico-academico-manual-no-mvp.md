# ADR 0021 — Histórico acadêmico manual no MVP

## Contexto

O MVP precisa permitir transferir manualmente informações de históricos mantidos em sistemas anteriores. Esses registros podem referir-se a instituições e cursos que não existem no catálogo operacional atual.

## Decisão

- Um registro de histórico é uma linha manual por componente curricular e período, vinculada a uma pessoa/aluno do tenant selecionado.
- O registro guarda instituição de origem, curso como texto livre, ano letivo, período, componente curricular, carga horária, nota/conceito opcional, faltas opcionais, resultado textual e observações opcionais.
- Não é exigido vínculo com uma matrícula atual, curso cadastrado ou matéria do PPC; isso permite transferir registros anteriores e externos ao catálogo local.
- O `SUPER_ADMIN` seleciona explicitamente o tenant para CRUD. Leituras, alterações e exclusões respeitam o tenant e validam a pessoa vinculada.
- Os campos são inseridos manualmente. Não são derivados de avaliações, notas, frequência ou conclusões; não há cálculos, importação em lote, exposição pública ou alegação de validade oficial.
- Exclusão é física no MVP. Nenhuma operação grava auditoria.

## Consequências

- Curso, matéria e período históricos preservam os rótulos recebidos do operador em vez de normalizá-los como entidades atuais.
- O registro não certifica autenticidade ou equivalência dos dados transferidos.
- O modelo pode ser ampliado quando regras de emissão oficial ou integração forem aprovadas.
