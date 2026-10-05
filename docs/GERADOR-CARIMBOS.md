# Gerador de carimbos

## Uso

1. Entre na plataforma e abra **Gerador de carimbos** na página inicial.
2. Informe o texto; use quebras de linha para organizá-lo.
3. Escolha formato **Quadrado** ou **Redondo**, cor e fonte **Sem serifa**, **Com serifa** ou **Monoespaçada**.
4. Confira a prévia. Se o conteúdo não couber legivelmente, reduza o texto ou reorganize as linhas.
5. Clique em **Baixar PNG** ou **Baixar SVG**.

O PNG tem 400 × 400 pixels e fundo transparente. O SVG é vetorial; suas famílias genéricas de fonte são resolvidas pelo programa que o abrir. As duas exportações usam a composição da própria prévia. A ferramenta ajusta o texto entre 24 e 16 pixels e impede a exportação quando não há espaço legível.

A geração e o download acontecem no navegador. Esta entrega não salva um catálogo de carimbos nem vincula imagens a colaborador, instituição ou documento. O texto permanece apenas na página enquanto ela estiver aberta.

## E2E direcionado

Na raiz do projeto, com as dependências instaladas:

```bash
npm run test:e2e:ticket -- gerador-carimbos/01-gerador-carimbos
```

O runner inicia backend de fixture e frontend, usa Electron em display oculto no Linux via Xvfb e grava vídeo. Não é necessário abrir servidores manualmente. A fixture prepara o estado-base; as ações do gerador são realizadas pela interface.

Logs e vídeos de cada execução ficam em `logs/e2e/gerador-carimbos/01-gerador-carimbos/<timestamp>/`, com log `run.txt` e vídeo em `videos/`. O teste cobre navegação, texto, aparência, SVG literal sem execução de marcação, PNG correspondente à prévia e rejeição de conteúdo sem espaço legível.

Os downloads e screenshots do Cypress são artefatos locais ignorados pelo Git. Nenhum banco operacional é modificado pelo gerador.
