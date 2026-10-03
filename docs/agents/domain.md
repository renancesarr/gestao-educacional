# Documentação de domínio

Este projeto usa domínio único. Todos os caminhos abaixo são relativos à raiz do projeto.

## Leitura e localização

- Antes de propor ou implementar comportamento de produto, leia `docs/IDEIA.md`, cuja visão permanece em validação.
- Antes de explorar o domínio, leia o glossário `docs/CONTEXT.md` e as decisões de `docs/adr/` relevantes à área em discussão.
- O local canônico do glossário é `docs/CONTEXT.md`, inclusive quando uma skill sugerir `CONTEXT.md` na raiz. Preserve a organização escolhida pelo usuário.
- Não há `CONTEXT-MAP.md` nem divisão em múltiplos contextos. As fronteiras modulares do backend não exigem glossários separados.
- Se um documento opcional estiver ausente, prossiga sem criá-lo antecipadamente. Registre termos e decisões conforme forem efetivamente resolvidos.

## Vocabulário e decisões

Use os termos do glossário em tickets, propostas e testes; respeite os sinônimos a evitar. Sinalize lacunas reais para `domain-modeling`. Mantenha o glossário restrito a conceitos do domínio.

Explicite conflitos com ADRs existentes antes de mudar uma decisão. Novas ADRs usam numeração sequencial em `docs/adr/`, título e explicação curta do contexto, escolha e motivo. Registre uma ADR quando a escolha for difícil de reverter, surpreendente sem contexto e envolver alternativas reais.

## Entrevistas com documentação

No fluxo `grill-with-docs`, aplique `grilling` e `domain-modeling`: faça rodadas de perguntas cujos pré-requisitos estejam resolvidos, espere as respostas e registre termos e decisões confirmados durante a conversa. Recomendações ainda não aceitas não são decisões do projeto.
