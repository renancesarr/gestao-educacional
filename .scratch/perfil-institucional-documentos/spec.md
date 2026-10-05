# Perfil institucional e responsáveis por documentos acadêmicos

## Problem Statement

O sistema ainda não mantém as informações visuais e os responsáveis necessários para emitir documentos acadêmicos em nome de uma instituição. O cadastro atual cria o tenant e uma conta, mas não oferece um CRUD de perfil documental nem permite vincular pessoas a funções administrativas de direção e de registros acadêmicos. Também não armazena logo, assinatura manuscrita ou carimbo institucional.

## Solution

Adicionar ao CRUD institucional uma configuração de perfil documental e um CRUD de funcionários administrativos. Cada instituição pode enviar sua própria marca em PNG ou SVG; o cabeçalho padrão mantém o Selo Nacional à esquerda, os dados institucionais ao centro e a marca enviada à direita. Cada instituição designa um diretor e um responsável pelos registros acadêmicos; podem ser a mesma pessoa. Assinatura manuscrita PNG e carimbo PNG gerado ficam no perfil individual do funcionário. A prontidão da instituição considera os ativos da pessoa atualmente designada como responsável pelos registros acadêmicos.

A instituição pode existir e ser editada enquanto incompleta, mas não fica pronta para emissão de documentos até cumprir os requisitos de perfil e responsáveis. A assinatura digital do MVP é apenas uma representação visual demonstrativa, sem chave, certificado ou validação criptográfica. Os dois QR codes previamente definidos continuam separados: matrícula e representação da assinatura. Esta entrega cria e administra os dados consumidos pelos documentos; cada tipo de documento será integrado no respectivo fluxo de emissão.

## User Stories

1. Como `SUPER_ADMIN`, quero consultar o perfil documental da instituição-alvo para saber quais dados e imagens já estão configurados.
2. Como `SUPER_ADMIN`, quero cadastrar e atualizar a marca de uma instituição para que seus documentos usem a identidade visual correta.
3. Como responsável pela instituição, quero enviar a marca em PNG ou SVG para usar arquivos comuns de identidade visual.
4. Como responsável pela instituição, quero substituir a marca antiga e ver a marca atualmente cadastrada.
5. Como responsável pela instituição, quero remover uma marca cadastrada e retornar o perfil ao estado incompleto.
6. Como operador, quero que o cabeçalho coloque o Selo Nacional à esquerda e a marca da instituição à direita, conforme o modelo aprovado.
7. Como operador, quero que o sistema mantenha a marca por instituição sem inferir o tipo da rede a partir do arquivo.
8. Como `SUPER_ADMIN`, quero vincular uma pessoa já cadastrada ao quadro administrativo da instituição como funcionário.
9. Como `SUPER_ADMIN`, quero consultar e atualizar funcionários administrativos da instituição-alvo.
10. Como `SUPER_ADMIN`, quero designar um funcionário ativo e administrativo como diretor da instituição.
11. Como `SUPER_ADMIN`, quero designar um funcionário ativo e administrativo como responsável pelos registros acadêmicos.
12. Como instituição, quero que diretor e responsável pelos registros sejam pessoas distintas ou a mesma pessoa, conforme minha organização.
13. Como operador, quero impedir que pessoa de outro tenant, pessoa sem vínculo administrativo ou funcionário inativo seja designado a uma função documental.
14. Como operador que gerencia os funcionários, quero cadastrar, substituir ou remover a assinatura manuscrita PNG no perfil individual de cada funcionário.
15. Como operador que gerencia os funcionários, quero gerar, substituir ou remover um carimbo PNG personalizado com a identificação da instituição e daquele funcionário.
16. Como operador, quero consultar se a configuração institucional está pronta e receber os requisitos ainda ausentes.
17. Como emissor de documentos, quero que a prontidão exija marca, diretor, responsável pelos registros, assinatura e carimbo válidos.
18. Como estudante ou instituição que consulta um documento, quero que a assinatura demonstrativa seja identificada como simulação, sem alegação de assinatura ICP-Brasil ou validade criptográfica.
19. Como mantenedor, quero que imagens de uma instituição não possam ser lidas ou sobrescritas usando o identificador de outra instituição.
20. Como mantenedor, quero que falha ao salvar um arquivo inválido não substitua o arquivo válido já cadastrado.
21. Como usuário do MVP, quero que os dados cadastrais de documentos permaneçam locais em SQLite, sem dependências externas.

## Implementation Decisions

- Usar as fronteiras existentes `institution` e `people`; funcionário é um vínculo administrativo da instituição para uma pessoa já cadastrada no mesmo tenant, não um novo tipo de pessoa nem um colaborador acadêmico.
- No MVP, operações institucionais são chamadas pelo `SUPER_ADMIN` autenticado e incluem `targetTenantId` explícito.
- Separar perfil institucional, vínculo de funcionário e imagens em contratos pequenos, com adaptadores SQLite. Não acrescentar adaptador ou verificação PostgreSQL durante desenvolvimento/testes.
- A instituição pode ser criada antes de completar seu perfil. A prontidão documental é derivada; documentos não podem ser emitidos quando qualquer requisito está ausente.
- Cada instituição tem no máximo um diretor atual e um responsável atual por registros acadêmicos. Ambos os vínculos devem apontar para funcionário ativo com escopo administrativo. Uma mesma pessoa pode ocupar ambos. Ativos documentais pertencem aos funcionários, não ao perfil institucional.
- Funcionários são escolhidos de `people` já cadastradas no tenant; duplicidade de vínculo é rejeitada. Desativar o responsável atual torna a instituição incompleta até uma nova designação.
- A marca aceita PNG ou SVG; cada funcionário pode manter sua assinatura manuscrita e seu carimbo em PNG. Respostas de leitura nunca incluem conteúdo binário salvo quando o endpoint da imagem daquele funcionário é solicitado.
- O carimbo individual é uma composição raster PNG gerada no navegador e enviada ao servidor; imagem armazenada é validada como PNG. A assinatura manuscrita é enviada como PNG.
- Somente funcionários ativos podem receber novos ativos. A prontidão documental verifica se o funcionário atualmente responsável pelos registros acadêmicos tem ambos os ativos; trocar a designação pode deixar a instituição incompleta até configurar os ativos do novo responsável.
- Uploads são limitados em tamanho e validados pelo conteúdo real do arquivo, não apenas pelo nome ou cabeçalho declarado. Dados antigos permanecem intactos quando upload/substituição falha.
- O cabeçalho padrão posiciona o Selo Nacional à esquerda, dados institucionais no centro e marca enviada pela instituição à direita. A marca d'água usa o símbolo da marca institucional no canto inferior direito a 10% de opacidade.
- A “assinatura digital” é somente demonstração interna; não produz assinatura criptográfica, certificado, chave privada ou declaração de validade oficial.
- Os QR codes de matrícula e da representação de assinatura têm caminhos internos distintos. A integração ao renderizador de cada documento ocorre nos tickets específicos de emissão; esta feature fornece o perfil e os ativos necessários.
- Não se acrescentam dados cadastrais além dos necessários ao cabeçalho, das funções administrativas e dos ativos de documento definidos aqui.

## Testing Decisions

- Testar comportamento público dos serviços, rotas HTTP autenticadas e persistência SQLite em memória.
- Cobrir autorização e alvo obrigatório, isolamento de tenant, papel administrativo, duplicidade, restrições de designação, prontidão parcial/completa, validação/substituição de imagem e falhas sem estado parcial.
- Incluir um E2E por ticket funcional, navegando a interface de configuração institucional e produzindo vídeo com o runner seletivo existente.
- Os testes devem detectar os defeitos de design correspondentes: aceitar funcionário de outro tenant; permitir funcionário inativo/não administrativo em cargo; exceder tamanho ou falsificar MIME; substituir ativo válido por upload inválido; declarar prontidão antes de todos os ativos/cargos.
- Executar apenas E2E do ticket alterado e testes unitários/HTTP/SQLite relacionados; não repetir jornada-base exceto se houver falha indicativa nela.
- Não executar nem exigir testes PostgreSQL durante desenvolvimento.

## Out of Scope

- Geração de comprovante, histórico, diploma ou certificado em PDF/HTML; cada documento consumirá estes dados no seu ticket de emissão.
- Assinatura ICP-Brasil, certificado digital, chave privada, assinatura criptográfica ou validação legal.
- Integração com serviços externos de assinatura, armazenamento de arquivos em nuvem, órgãos educacionais ou catálogos externos.
- Escolha/identificação automática de logos de rede, município, estado ou União; a instituição envia sua própria marca.
- CRUD de pessoas já existente, contratação, folha, remuneração, cargos não administrativos ou autenticação própria dos funcionários.
- Auditoria geral do MVP.

## Further Notes

- Termos do domínio: `Instituição`, `Pessoa`, `Funcionário`, `Diretor`, `Responsável pelos registros acadêmicos`, `Perfil documental`, `Prontidão documental` e `Assinatura demonstrativa`.
- A decisão de inserir os atos regulatórios completos no verso do comprovante já aprovada deve ser aplicada pelo futuro fluxo de emissão. A ADR 0022 foi alinhada para não manter a regra anterior de que documentos não consomem atos.
- Esta feature não torna documentos automaticamente oficiais; deve preservar os avisos demonstrativos já definidos para o MVP.
