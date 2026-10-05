# Gerador de carimbos na aplicação

**Status:** ready-for-agent

## Problem Statement

O operador precisa criar a imagem de um carimbo diretamente na aplicação usando texto próprio, cor e fonte selecionada. A proposta anterior ampliou indevidamente esta etapa para assinaturas, catálogo e modelos documentais.

## Solution

Uma ferramenta visual dentro da aplicação recebe o texto, permite selecionar fonte, cor e formato quadrado ou redondo, mostra a prévia e permite baixar o carimbo em PNG ou SVG. O resultado é uma imagem de carimbo reutilizável. Esta etapa termina na geração e exportação da imagem.

## User Stories

1. Como operador, quero abrir a ferramenta dentro da aplicação para criar um carimbo sem editor externo.
2. Como operador, quero informar o texto que aparecerá no carimbo.
3. Como operador, quero usar quebras de linha para organizar o texto.
4. Como operador, quero selecionar a fonte para definir o aspecto do texto.
5. Como operador, quero escolher a cor do texto e do contorno.
6. Como operador, quero escolher formato quadrado ou redondo.
7. Como operador, quero visualizar o resultado antes de baixar.
8. Como operador, quero alterar texto, fonte, cor ou formato e ver a prévia atualizada.
9. Como operador, quero baixar o resultado em PNG para usar em sistemas que aceitam imagem raster.
10. Como operador, quero baixar o resultado em SVG para usar a versão vetorial.
11. Como operador, quero que a imagem exportada corresponda à prévia.
12. Como operador, quero receber orientação quando texto vazio ou extenso demais não produzir um carimbo legível.
13. Como operador, quero que caracteres especiais sejam tratados como texto, sem serem interpretados como marcação SVG.
14. Como mantenedor, quero um E2E específico com vídeo que mostre preenchimento, escolhas, prévia e exportação pela interface.

## Implementation Decisions

- Gerador visual disponível dentro da aplicação; não vinculado a cadastro ou emissão de documentos.
- Entradas: texto com quebras de linha, cor, fonte selecionada e formato quadrado/redondo.
- Saídas: PNG e SVG, selecionadas pelo operador no momento da exportação.
- Fontes oferecidas em lista local de famílias disponíveis, sem serviço externo de fontes ou upload de fontes nesta etapa.
- Texto informado é conteúdo literal; escapar marcação e atributos ao gerar SVG.
- Prévia e exportações usam a mesma composição, mantendo formato, texto, fonte e cor escolhidos.
- Geração e download locais no navegador; este requisito não necessita API nova, tabela, persistência ou integração com catálogo.
- Não truncar silenciosamente texto nem exportar conteúdo cortado; validar o espaço legível e indicar ajuste.
- Não alterar assinaturas, ativos ou bases existentes para disponibilizar a ferramenta.

## Testing Decisions

- Fronteira proposta para confirmação: ferramenta pela interface da aplicação, observando prévia e arquivos efetivamente exportados.
- O E2E usa o estado-base já validado, navega pela UI, informa texto, escolhe fonte/cor/formato e baixa PNG e SVG. Nenhuma chamada API executa as ações demonstradas.
- Verificar formatos válidos e correspondência entre prévia e arquivos exportados, incluindo caracteres especiais e texto inválido, sem testar métodos privados do canvas.
- TDD: um comportamento por ciclo, falha esperada registrada antes da implementação mínima. E2E direcionado com navegador oculto e vídeo, conforme decisão vigente.
- Não executar novamente cadastro de instituição, cursos ou SUPER_ADMIN para esta entrega.

## Out of Scope

- Assinaturas manuscritas ou digitais.
- Upload de assinatura ou carimbo existente.
- CRUD/catálogo de carimbos e associações com colaborador ou instituição.
- Configuração de áreas, coordenadas ou posicionamento em documentos.
- Histórico, declaração, diploma, emissão documental ou QR codes.
- Fontes externas, upload de fontes, editor gráfico genérico e SVG fornecido pelo usuário.
- Alterações de banco, auditoria ou verificações PostgreSQL.

## Further Notes

A correção do usuário substitui a proposta anterior de seis tickets para esta etapa. O escopo agora é uma ferramenta de geração de imagem. Requisitos de assinatura e integração documental anteriormente discutidos não são executados neste trabalho.
