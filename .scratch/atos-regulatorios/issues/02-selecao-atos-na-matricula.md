# Selecionar atos regulatórios na matrícula

**Status:** ready-for-human

## Problema

A matrícula direta não consulta os atos regulatórios da instituição nem do curso. O operador não consegue escolher quais atos sustentam a operação, embora ambos sejam relevantes.

## Resultado esperado

Na etapa Matrículas, o SUPER_ADMIN escolhe explicitamente uma versão de ato da instituição-alvo e uma versão de ato do curso escolhido antes de concluir a matrícula. O registro da matrícula preserva o texto e o status selecionados mesmo que o ato seja posteriormente editado sem manter a versão anterior.

## Critérios de aceitação

- [x] A tela de matrícula lista atos vinculados à instituição e ao curso selecionado, incluindo versões preservadas.
- [x] O operador seleciona uma versão para cada alvo; nenhum ato é escolhido implicitamente.
- [x] A matrícula persiste e apresenta os textos/status usados; a consulta posterior mostra a mesma evidência.
- [x] A ausência ou inatividade de um ato avisa o operador; pode bloquear ou permitir a matrícula com justificativa, guardando responsável autenticado e data/hora no registro.
- [x] As leituras e gravações usam o tenant autenticado/alvo e rejeitam ato de outro tenant, curso diferente ou versão inexistente.
- [x] O teste E2E é isolado por ticket, executado no navegador visível e grava vídeo.
- Diploma, histórico e comprovante ficam fora deste ticket.

## Fora de escopo

- Integração de atos com diploma, histórico ou comprovante.
- Mudança no CRUD manual dos atos.
- Qualquer integração PostgreSQL.

## Comments

- Escopo confirmado pelo usuário: teste E2E e componente de matrícula; seleção de atos regulatórios da instituição e do curso na matrícula, sem diploma.
