# Como revisar tickets `ready-for-human`

Este guia explica como conferir uma entrega e registrar sua decisão no tracker local. A revisão verifica se o comportamento implementado atende ao escopo aprovado; não exige que você leia todo o código.

## O que significa cada status neste projeto

O tracker é Markdown em `.scratch/<funcionalidade>/issues/`. Neste projeto, os status têm este significado:

| Status | Significado prático |
| --- | --- |
| `needs-triage` | Ainda precisa ser avaliado e direcionado. |
| `needs-info` | Falta uma decisão ou informação de produto; não é atraso de implementação. |
| `ready-for-agent` | O ticket está definido e pode ser implementado. |
| `ready-for-human` | A implementação foi entregue e aguarda sua revisão e aceitação. Os `[x]` mostram o que o implementador afirma ter concluído; não significam que você já aprovou. |
| `done` | Você revisou e aceitou o resultado. É o estado terminal de um ticket aceito neste tracker local. |
| `wontfix` | Fora do escopo aprovado; não implementar nem revisar como pendência. |

`ready-for-human` é usado assim localmente, mesmo que algumas ferramentas externas deem outro significado a esse rótulo. A definição acima prevalece para este projeto.

## Revisão passo a passo

1. **Escolha um ticket.** Na raiz do projeto, liste os tickets aguardando revisão:

   ```sh
   rg -n '^\*\*Status:\*\* ready-for-human' .scratch --glob '*.md'
   ```

   Comece por tickets de prioridade `1`. Se um ticket depende de outro, revise primeiro o ticket indicado em `Blocked by:`. Não inclua tickets `wontfix`.

2. **Leia o ticket inteiro.** Confira `What to build`, `Blocked by`, `Priority`, todos os critérios e `Comments`. Os critérios respondem “o que precisa funcionar”; os comentários devem apontar evidências, limitações e verificações feitas.

3. **Leia a especificação e as decisões citadas.** Abra o `spec.md` da mesma pasta e as ADRs vinculadas. Se um critério parecer contradizer uma decisão posterior ou exigir comportamento ainda não aprovado, interrompa esse ponto e peça esclarecimento; não aprove uma regra nova por inferência.

4. **Confira cada critério marcado.** Para cada `[x]`, procure a evidência indicada no comentário: teste, rota, tela, fixture ou log. Em funcionalidades visíveis, observe o E2E headed quando ele for executado. Para isolamento e autorização, confirme que os testes cobrem tenant incorreto, referências cruzadas e acesso sem o papel permitido, quando aplicável.

5. **Verifique a execução.** Consulte o log citado no ticket e veja se corresponde à versão revisada. Se não houver log recente ou se houve alteração desde a última execução, rode a suíte pertinente. A suíte completa é:

   ```sh
   npm ci
   npm --prefix frontend ci
   npm run test:all
   ```

   Ela executa backend unitário, HTTP, SQLite, typecheck, testes/lint/typecheck/build frontend e E2E visível no Electron; para na primeira falha e salva o resultado em `logs/log-teste-<timestamp>.txt`. Também é possível executar somente `npm run test:unit`, `npm run test:http`, `npm run test:sqlite` ou `npm --prefix frontend run test:e2e`, conforme o ticket.

6. **Tome uma decisão.** Pergunte a si mesmo: os critérios aprovados estão demonstrados, o fluxo funciona, e não há regressão visível ou exposição indevida de dados? Se sim, aceite. Se não, devolva com passos concretos para reproduzir o problema.

7. **Registre a decisão no arquivo do ticket.** Acrescente uma entrada em `## Comments` com data, resultado, critérios conferidos, comandos/logs usados e limitações observadas. Em seguida:

   - Aceito: altere `Status` para `done`.
   - Correção necessária, sem decisão de produto pendente: altere para `ready-for-agent` e descreva critério, resultado esperado, resultado observado e reprodução.
   - Falta decisão de produto: altere para `needs-info` e escreva a pergunta específica que bloqueia a aprovação.
   - Fora do escopo: use `wontfix` e registre o motivo e a decisão que sustenta a exclusão.

Não desmarque critérios que foram implementados só porque você está pedindo ajuste: deixe claro no comentário qual evidência falhou e o que precisa mudar. Mantenha o status em `ready-for-human` enquanto ainda estiver revisando.

## O que fazer quando não quiser examinar código

Você pode pedir ao agente uma revisão focada, por exemplo:

> Revise o ticket `.scratch/avaliacoes-notas-frequencia/issues/02-crud-avaliacoes-notas-frequencia.md` critério por critério. Compare com a especificação e ADRs vinculadas, indique os arquivos e evidências, confira o log mais recente e rode os testes pertinentes se necessário. Não altere código. Termine com uma recomendação: aceitar, pedir correção ou pedir decisão.

O agente deve separar fatos verificados de alegações do ticket. Um teste aprovado não prova sozinho que todos os critérios foram atendidos; uma observação manual também não substitui testes de autorização, isolamento e validação.

## Ordem prática para a fila atual

- Revise primeiro tickets de contrato/decisão, depois os tickets de CRUD que dependem deles: avaliações, históricos e credenciais.
- Revise em seguida as jornadas centrais de instituição, curso, PPC, matéria e matrícula individual.
- Depois confira buscas de alunos, catálogos/fixtures locais, onboarding/persistência e remoção de auditoria no runtime do MVP.
- O ticket `.scratch/matricula-e-ciclo/issues/01-cadastro-consulta-pessoas.md` ainda tem um item de commit não marcado. O commit documental não fecha esse item; confirme o commit do código correspondente antes de aceitá-lo.

## Limites para quem continuar o projeto

- A revisão é contra o MVP e as decisões atuais, não contra todas as ideias futuras em `docs/IDEIA.md` ou documentos históricos.
- Auditoria pertence ao sistema completo, mas está fora das operações do MVP.
- Matrícula em lote e integração EAD ficam para depois do MVP.
- Use a configuração SQLite durante desenvolvimento e testes, conforme as instruções do projeto.
- Não faça commit de código como parte de uma revisão documental. Separe mudanças documentais e de implementação quando preparar commits.
