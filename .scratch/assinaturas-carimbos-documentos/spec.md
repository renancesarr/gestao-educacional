> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# Assinaturas e carimbos nos modelos de documentos

**Status:** ready-for-agent

## Problem Statement

O fluxo atual não demonstra a tarefa que a pessoa usuária precisa validar: entrar no sistema, navegar ao cadastro do colaborador e administrar ali a assinatura e os carimbos dele. O vídeo E2E anterior preparava parte dos registros pela API antes de abrir a interface, então não mostrava esse trabalho sendo feito pelo usuário.

Também falta administrar carimbos da instituição e carimbos de outros usos, enviar imagens existentes ou gerá-las no sistema e escolher forma e cor. Cada modelo de documento — Histórico, Declaração de Matrícula e outros — deve definir a área onde cada tipo de carimbo será adicionado.

## Solution

Adicionar gerenciamento visual de assinatura e carimbos ao perfil individual do colaborador. A assinatura manuscrita aceita PNG enviado. Cada carimbo pode ser enviado como PNG ou gerado na aplicação, inicialmente com formato quadrado ou redondo e cor escolhida pelo operador. Os carimbos têm uma categoria: colaborador, instituição ou outro; carimbos “outro” recebem uma identificação.

Os modelos padrão de Histórico, Declaração de Matrícula e outros documentos definem áreas nomeadas para os tipos de carimbos aceitos. O operador associa carimbos existentes a essas áreas e vê uma prévia do documento antes de salvar. A área e a localização visual são definidas pelo modelo; não se cadastram coordenadas X/Y.

O E2E funcional começa no login e percorre a interface até o colaborador. Ele cadastra uma assinatura PNG, cria ou envia um carimbo, associa carimbos às áreas dos modelos disponíveis e verifica a prévia. Uma fixture local fornece instituição e colaborador-base já validados; ela não executa por API as ações que o teste deve demonstrar.

## User Stories

1. Como `SUPER_ADMIN`, quero entrar no sistema e navegar até o perfil de um colaborador para administrar seus ativos pela interface normal.
2. Como operador, quero enviar uma assinatura manuscrita PNG no perfil do colaborador.
3. Como operador, quero consultar, substituir e remover a assinatura associada àquele colaborador.
4. Como operador, quero enviar um carimbo PNG existente para o perfil do colaborador, para a instituição ou para outro uso.
5. Como operador, quero classificar cada carimbo como pertencente ao colaborador, à instituição ou a outro uso.
6. Como operador, quero nomear carimbos da categoria “outro” para distingui-los na consulta e seleção.
7. Como operador, quero abrir uma ferramenta interna para gerar um carimbo PNG sem usar um editor externo.
8. Como operador, quero escolher formato quadrado ou redondo ao gerar um carimbo.
9. Como operador, quero escolher a cor do carimbo antes de gerá-lo.
10. Como operador, quero ver uma prévia do carimbo e seu texto antes de salvá-lo.
11. Como operador, quero cancelar uma geração ou edição sem substituir o carimbo já salvo.
12. Como operador, quero substituir ou remover cada carimbo sem afetar os demais carimbos do colaborador ou da instituição.
13. Como operador, quero consultar assinaturas e carimbos somente dentro da instituição selecionada.
14. Como operador, quero ver quais áreas para carimbo cada modelo de documento disponibiliza.
15. Como operador, quero associar carimbos cadastrados às áreas do modelo de Histórico.
16. Como operador, quero associar carimbos cadastrados às áreas do modelo de Declaração de Matrícula e dos demais documentos.
17. Como operador, quero visualizar o Histórico, a Declaração de Matrícula e outros documentos com os carimbos associados antes de salvar a configuração.
18. Como emissor de documento, quero que a emissão adicione o carimbo na área prevista pelo modelo selecionado.
19. Como responsável pela instituição, quero que a prontidão documental considere a assinatura e o carimbo do colaborador atualmente designado como responsável pelos registros acadêmicos.
20. Como mantenedor, quero que o E2E grave em vídeo o fluxo real, desde o login e a navegação até a gravação dos ativos e a prévia documental.
21. Como mantenedor, quero que o E2E use estado-base fixture para instituição e colaborador, sem repetir provisionamento já coberto nem antecipar as operações da interface por chamadas API.

## Implementation Decisions

- A assinatura manuscrita é PNG e pertence ao perfil individual do colaborador.
- Carimbos são ativos tenant-scoped e podem pertencer a um colaborador, à instituição ou à categoria “outro”. “Outro” exige um nome curto informado pelo operador.
- Cada carimbo aceita upload PNG ou geração interna. A primeira versão do gerador oferece formatos quadrado e redondo, seleção de cor, texto configurável, prévia e confirmação antes de substituir qualquer ativo já salvo.
- O carimbo do colaborador identifica a pessoa e a instituição. O carimbo institucional identifica a instituição. O texto de um carimbo “outro” é informado pelo operador.
- Os ativos individuais são acessados e mantidos no cadastro do colaborador; o ativo institucional é mantido no perfil da instituição. Os dados não são copiados entre cadastros.
- A prontidão da instituição usa os ativos da pessoa atualmente designada como responsável pelos registros acadêmicos. Trocar o responsável altera quais ativos satisfazem esse requisito, sem mover os arquivos anteriores.
- Cada modelo padrão define áreas nomeadas, categorias compatíveis e as regras de layout dos carimbos. A configuração seleciona o carimbo que preenche uma área; a posição não é digitada pelo operador.
- O mecanismo comum de áreas de carimbo atende aos modelos de Histórico, Declaração de Matrícula e demais documentos incluídos no MVP. A prévia e a emissão usam o mesmo layout do modelo.
- A configuração e emissão de cada documento usam contratos públicos das fronteiras `academic` e `institution`; os ativos permanecem propriedade dos perfis da fronteira `institution`. A composição valida que o ativo e o documento pertencem ao mesmo tenant.
- A emissão não declara assinatura criptográfica, ICP-Brasil ou validade oficial. O modelo visual já aprovado do comprovante de matrícula é preservado e recebe as áreas de carimbo definidas para ele.
- Persistência e testes do MVP usam SQLite. Nenhuma integração externa ou verificação PostgreSQL é introduzida.
- A fixture E2E fornece instituição, colaborador e sessão inicial de teste. As ações de envio, geração, associação às áreas e prévia são realizadas pela interface e aparecem no vídeo.

## Testing Decisions

- O seam principal de aceitação é a interface autenticada do sistema com backend e SQLite de fixture: o teste percorre o fluxo visível e verifica estado persistido e prévias documentais.
- Testes unitários verificam que forma, cor e texto escolhidos alteram o PNG gerado e que cancelar não substitui o ativo salvo.
- Testes HTTP e SQLite verificam upload, validação de conteúdo PNG, categorias e titulares, autorização, substituição/exclusão independente, isolamento por tenant e associação de carimbos a áreas nomeadas de modelos.
- Testes de interface verificam criação, prévia, edição e cancelamento do gerador, compatibilidade entre categoria do carimbo e área do modelo e renderização na área correspondente.
- O E2E funcional usa Cypress/Electron com vídeo, login e navegação pela UI até o cadastro do colaborador e modelos de Histórico e Declaração de Matrícula. A fixture fornece só o estado-base; o cenário não chama endpoints para executar upload, gerar carimbo, associar áreas ou abrir prévias.
- Bons testes observam resultados visíveis, bytes/atributos persistidos e o layout produzido; não verificam funções privadas ou detalhes internos do canvas.
- Fluxos-base de criação de `SUPER_ADMIN`, instituição e curso permanecem cobertos separadamente e só voltam à jornada E2E quando alterados ou quando houver falha indicativa na fixture.

## Out of Scope

- Assinatura criptográfica, ICP-Brasil, certificado, chave privada ou autoridade certificadora.
- Importação em lote de assinatura ou carimbos.
- Editor gráfico genérico, modelos HTML livres ou editor arbitrário de páginas.
- Busca automática, fornecimento ou aplicação automática de brasões e marcas oficiais.
- Formatos de imagem diferentes de PNG para assinatura e carimbos.
- Carimbos dinâmicos baseados em dados acadêmicos que mudam a cada aluno ou emissão.
- Editor de coordenadas X/Y ou posicionamento livre fora das áreas oferecidas pelos modelos padrão.

## Further Notes

- “Colaborador” neste fluxo é o perfil individual de pessoa vinculada à instituição exibido na área de colaboradores; a função de responsável pelos registros acadêmicos continua sendo uma designação institucional sobre uma pessoa ativa.
- A especificação cobre ativos de colaborador, institucionais e de outros usos, e sua associação às áreas definidas nos modelos de Histórico, Declaração de Matrícula e outros documentos. A geração do comprovante mantém as decisões visuais já aprovadas.
