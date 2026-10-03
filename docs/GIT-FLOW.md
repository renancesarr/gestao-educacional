# Fluxo de branches

## Branches permanentes

- `master`: versão publicada/produção.
- `dev`: linha de integração geral para trabalho de desenvolvimento.
- `dev-ai`: linha de integração exclusiva das alterações feitas por agentes de IA.

O trabalho deste agente parte sempre de `dev-ai`. `dev` e `master` recebem mudanças por promoção explícita; não são bases para branches de tarefa deste agente.

## Branches de tarefa

Crie uma branch nova para cada tarefa, baseada no `dev-ai` atualizado. Use prefixos que expressem a natureza da mudança:

- `feature/<nome>` para comportamento novo.
- `fix/<nome>` para correção de defeito.
- `docs/<nome>` para documentação e instruções.
- `refactor/<nome>` para reorganização sem mudança observável de comportamento.
- `test/<nome>` para cobertura de testes sem mudança de produto.
- `chore/<nome>` para manutenção de ferramentas e configuração.

Exemplo: `git switch dev-ai && git pull --ff-only origin dev-ai && git switch -c feature/registro-frequencia`.

## Integração em `dev-ai`

1. Implemente e verifique a tarefa na branch própria, seguindo TDD quando houver comportamento de produto.
2. Revise o diff e os resultados das verificações.
3. Solicite ao subagente `dev-ai-reviewer` uma revisão independente usando `docs/agents/dev-ai-reviewer.md`.
4. Integre a branch em `dev-ai` apenas com decisão `ACCEPT` e sem achados bloqueadores. Corrija os achados e peça nova revisão após qualquer alteração relevante.
5. Mantenha `dev-ai` atualizada e informe o resultado da revisão e a verificação realizada.

A revisão é uma barreira de qualidade, não uma substituição de testes nem uma autorização para alterar escopo. O revisor não implementa nem integra a própria mudança: ele retorna `ACCEPT` ou `REJECT` com evidências e achados priorizados. Nenhuma branch de tarefa entra em `dev-ai` sem aprovação explícita.

## Promoção

Promover `dev-ai` para `dev`, ou `dev` para `master`, é uma decisão separada de release e depende de instrução explícita do responsável pelo projeto. Não faça push forçado para branches compartilhadas.
