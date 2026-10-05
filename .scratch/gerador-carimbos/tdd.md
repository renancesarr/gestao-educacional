# Evidência TDD — gerador de carimbos

Fronteira confirmada: interface e arquivos exportados. Branch feature/gerador-carimbos, baseada no mesmo commit de dev-ai. Alterações locais anteriores preservadas.

## Ciclo 1 — navegação e texto na prévia

- Red: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-00-56-490Z/run.txt. Falha esperada: link Gerador de carimbos ausente.
- Implementação mínima: entrada de navegação, página, campo de texto e prévia SVG com linhas.
- Green: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-02-40-037Z/run.txt — 1/1 passou.

## Ciclo 2 — aparência selecionada

- Red: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-03-41-728Z/run.txt — 1 passou, 1 falhou; seletor de formato ausente.
- Implementação mínima: formato quadrado/redondo, cor e fonte local aplicados à prévia.
- Green: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-05-04-079Z/run.txt — 2/2 passaram.

## Ciclo 3 — SVG exportado

- Red: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-06-21-950Z/run.txt — 2 passaram, 1 falhou; botão Baixar SVG ausente.
- Implementação mínima: exportação local do SVG da própria prévia, com texto serializado como conteúdo literal.
- Green: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-07-42-539Z/run.txt — 3/3 passaram.

## Ciclo 4 — PNG exportado

- Red: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-09-16-491Z/run.txt — 3 passaram, 1 falhou; botão Baixar PNG ausente.
- Implementação mínima: converter o SVG da prévia para PNG no navegador, sem servidor ou persistência.
- Green: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-13-42-282Z/run.txt — 4/4 passaram; PNG 400×400, fundo transparente e igualdade completa dos pixels com a prévia.

- Execução intermediária 2026-10-05T10-10-23-394Z interrompida: comparação profunda de arrays de pixels deixou o Cypress sem concluir. Não contabilizada como Green. Comparação ajustada para igualdade dos buffers completos, com resultado booleano, mantendo a verificação de todos os pixels.

## Ciclo 5 — limites e recuperação

- Red: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-15-30-625Z/run.txt — 4 passaram, 1 falhou; exportação ainda permitida com texto vazio.
- Implementação mínima: medição da fonte no navegador, ajuste entre 24 e 16 pixels e rejeição de texto vazio, linha muito larga ou linhas em excesso.
- Green: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-17-33-161Z/run.txt — 5/5 passaram.

## Revisão de implementação

- Navegação/página: expõem a ferramenta; nenhuma operação institucional foi adicionada.
- Componente do gerador: estado e ações da interface; prévia: renderização SVG.
- Layout: regras de espaço dependem de uma função de medição; adaptador de métricas: resolve medidas da fonte no navegador.
- Exportador: serialização, conversão e download; libera URLs temporárias. Na revisão foi extraída a operação de download comum, removendo duplicação entre SVG e PNG.
- Não há novos contratos de banco ou múltiplos adaptadores persistentes a comparar. Nenhuma classe herda invariantes incompatíveis; o contrato de medição recebe linha/tamanho e devolve a largura usada pelo layout.
- Checagem de tipos encontrou incompatibilidade entre ImageDataArray e Buffer nos tipos do Cypress; ajustado para Uint8Array, preservando a igualdade integral de bytes.
- Verificação final após revisão: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-19-57-545Z/run.txt — 5/5 passaram. Checagem de tipos e lint direcionado aprovados.
