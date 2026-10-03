# Design: frontend Next.js para validar o MVP institucional

Status: aprovado em conversa; aguardando revisão do documento

## Objetivo e escopo

Criar um frontend independente em `frontend/` com Next.js para o `SUPER_ADMIN` validar a jornada central do MVP no navegador: autenticar com passkey, criar ou abrir uma instituição, cadastrar pessoas, vinculá-las como colaboradores, criar curso, montar o PPC com matérias e professores e realizar/consultar matrícula direta.

A primeira entrega prioriza o percurso completo e simples. Oferta, turma, calendário, contas institucionais, papéis internos, auditoria acadêmica e novas regras de negócio permanecem fora do escopo. O backend existente e a interface estática atual continuam funcionando durante essa evolução.

## Abordagens consideradas

1. **Frontend Next.js separado com proxy para a API existente — escolhida.** Cria `frontend/` com App Router e encaminha `/api/*` para o backend. Mantém o backend modular e evita uma migração simultânea de interface e API.
2. **Substituir a interface estática pelo Next.js.** Unificaria a apresentação, mas amplia o recorte e remove a interface atual antes de validar o novo fluxo.
3. **Origens separadas sem proxy.** Exigiria coordenar CORS e cookies entre aplicações, aumentando configuração para o mesmo MVP.

## Arquitetura e navegação

- `frontend/` é um pacote Next.js independente, em TypeScript e App Router. O frontend chama somente os contratos HTTP existentes; regras de domínio continuam no backend.
- O Next.js encaminha `/api/:path*` ao backend configurado em `BACKEND_URL`. A tela chama caminhos relativos `/api/...` na mesma origem do navegador, preservando o fluxo de cookies de sessão.
- Desenvolvimento usa o Next.js em `http://localhost:3000` e o backend em outra porta local. `PUBLIC_ORIGIN` no backend aponta para a origem do frontend. O destino do proxy é configurável para outros ambientes.
- A tela inicial permite entrar com passkey, ativar a conta global com código de uso único ou abrir uma instituição existente pelo ID interno. A API não lista instituições; a interface não inventa essa capacidade.
- O onboarding cria a instituição e seu escopo e, ao receber o ID interno, abre o percurso da instituição em `/institutions/[tenantId]`.
- Cada operação institucional inclui explicitamente `targetTenantId` no corpo HTTP, usando o ID da rota atual. A seleção no frontend facilita a sequência; não altera a regra do backend de resolver e receber o alvo em cada operação.

## Jornada e dados

Um único assistente sequencial contém seis etapas:

1. **Instituição:** criar a instituição e escolher seu escopo, ou informar o ID interno de uma existente.
2. **Pessoas:** cadastrar e buscar pessoas por CPF ou identificador institucional. IDs retornados ficam disponíveis para as etapas seguintes durante a jornada.
3. **Colaboradores:** vincular uma pessoa existente, consultar colaboradores e ativar/desativar seus vínculos preservando dados.
4. **Curso:** criar um curso dentro do escopo da instituição, consultar o catálogo e alterar nome ou disponibilidade.
5. **PPC:** criar matérias com código, carga horária e um ou mais colaboradores; consultar o detalhe do curso e suas matérias; editar nome, carga horária, professores ou disponibilidade sem alterar o código.
6. **Matrícula:** matricular uma pessoa existente diretamente no curso, consultar e filtrar matrículas, e alterar sua situação pelos estados permitidos no backend.

Os identificadores gerados são apresentados para conferência e selecionados automaticamente quando disponíveis. O estado temporário de seleção existe apenas no frontend durante a jornada; as entidades persistidas e suas regras pertencem ao backend. O MVP não guarda dados pessoais em armazenamento local do navegador. Uma atualização da página mantém o ID da instituição pela rota; IDs de pessoa podem ser recuperados pela busca disponível ou informados novamente. A interface não oferece listagem de pessoas porque esse endpoint não existe.

## Direção visual

**Público:** operador `SUPER_ADMIN`, realizando operações administrativas em várias instituições.

**Paleta:** reutilizar os tokens já presentes em `public/styles.css`: fundo `#f4f6f8`, superfície `#ffffff`, texto principal `#182a38`, texto secundário `#4f606e`, ação primária `#175b55`, borda `#6e808b` e foco `#9c3d10`. Sobre branco, as razões medidas são 14,71:1 para texto principal, 6,50:1 para texto secundário, 7,88:1 para o acento, 4,10:1 para borda e 6,80:1 para foco. Sobre o fundo `#f4f6f8`, são 13,58:1, 6,00:1, 7,28:1, 3,78:1 e 6,28:1, respectivamente. Manter contraste de texto acima de 4,5:1 e foco/bordas relevantes acima de 3:1.

**Tipografia:** `system-ui, sans-serif` para títulos e corpo; títulos de página 30–32 px/40 px em peso 650; títulos de seção 20–22 px/30 px; corpo 16 px/24 px; ajuda e rótulos 14 px/20 px. IDs são apresentados com fonte de largura fixa do sistema, 13 px/20 px, para facilitar cópia e conferência. Não carregar fontes remotas.

**Layout:** assistente de operação. Em desktop (a partir de 900 px), cabeçalho e navegação ocupam a largura; um trilho vertical de aproximadamente 250 px mostra as etapas e o formulário ocupa a coluna restante dentro de uma largura máxima de 1200 px. Em telas menores, o trilho se torna uma faixa horizontal que informa etapa atual e total, seguida pelo formulário em coluna única, com pelo menos 16 px de margem lateral. Não ocultar etapa nem ação essencial.

**Espaçamento e forma:** escala de 4, 8, 12, 16, 24, 32 e 48 px; 4/8 px pertencem a ícone-rótulo e controle-ajuda; 12/16 px a campos e grupos próximos; 24 px a blocos; 32/48 px a etapas e regiões. Raio de 6 px, sem sombras externas; bordas definem formulários e superfícies.

**Elemento de identidade:** trilho de progresso com seis etapas conectadas, usando o acento para a etapa atual, marca discreta para etapas concluídas e texto acessível com `aria-current="step"`. No celular, mantém a ordem e comunica “Etapa n de 6”. O progresso é derivado de respostas efetivamente concluídas, não de conteúdo de demonstração.

### Wireframe desktop (1280 px)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Gestão acadêmica                                      SUPER_ADMIN · Sair    │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ Instituição     │ Etapa 3 de 6 · Colaboradores                              │
│ Pessoas         │ Vincule uma pessoa da instituição como colaboradora.       │
│ Colaboradores ● │ [ formulário da etapa atual                 ]             │
│ Curso           │ [ ação principal                              ]             │
│ PPC             │ [ resultado/erro/estado vazio                  ]             │
│ Matrícula       │                                                           │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### Wireframe mobile (375 px)

```text
┌───────────────────────────────┐
│ Gestão acadêmica      Sair    │
│ Etapa 3 de 6 · Colaboradores  │
│ [progresso  ━━━━━●━━━━━━━]    │
├───────────────────────────────┤
│ Vincular colaborador          │
│ [rótulo e campo de pessoa]     │
│ [ação principal]              │
│ [resultado/erro/estado vazio] │
└───────────────────────────────┘
```

## Estados e mensagens

- Ações mantêm o mesmo verbo entre controle, progresso e confirmação: criar, vincular, consultar, matricular e atualizar.
- Formulários mostram validação junto ao campo e preservam os valores quando a API recusa a solicitação.
- Durante chamadas, o controle acionado fica desabilitado e anuncia uma mensagem de progresso; falhas explicam o problema em linguagem direta e a próxima ação possível.
- Estados vazios explicam qual registro aparecerá e apontam para a ação de criação correspondente.
- Sucesso anuncia o resultado e mostra IDs internos em campo selecionável/copíavel. Não apresentar contagens, métricas, instituições ou pessoas fictícias como dados reais.
- Mensagens de API nunca expõem erros internos, segredos ou dados pessoais além do necessário para a operação.

## Acessibilidade e interação

- Todos os campos têm rótulos persistentes; grupos de escopo e professores têm `fieldset`/`legend`.
- Navegação por teclado, foco visível, ordem de tabulação previsível e região `aria-live` para sucesso, progresso e erro.
- Etapas têm estado e ordem expressos em texto, além da cor; botões indicam quando estão desabilitados.
- A experiência não depende de animações; respeitar `prefers-reduced-motion` se uma transição for adicionada.

## Testes e verificação

- Testes unitários do frontend verificam o mapeamento dos formulários aos DTOs e o envio de `targetTenantId` em cada operação.
- Testes de interface exercitam navegação entre etapas, estados de carregamento/erro/sucesso e seleção de IDs retornados.
- A jornada de integração deve usar os contratos HTTP reais e o adaptador SQLite em memória, aproveitando o teste já existente para backend; autenticação global permanece no fixture disponível enquanto não houver adaptador SQLite de identidade global.
- Verificação visual em 375×812 e 1280×800, com teclado e estados de erro/vazio, separando evidência visual de evidência funcional.

## Limites e dependências

- O backend não possui listagem/busca de instituições nem listagem geral de pessoas. Instituições existentes são abertas por ID; pessoas são localizadas pelos identificadores já aceitos.
- A jornada começa após a conta `SUPER_ADMIN` existir. Provisionamento continua no operador local, como definido anteriormente.
- Next.js e App Router serão configurados segundo a documentação oficial de instalação: <https://nextjs.org/docs/app/getting-started/installation>.

## Revisão da proposta

- **Substituição do tema:** considerados portal de cadastro hospitalar e cadastro genérico de RH. Um trilho simples serviria a ambos, então a primeira justificativa era genérica. Reparação: o trilho mantém a dependência acadêmica explícita curso → PPC/matérias → matrícula e conecta professores colaboradores à composição curricular; ele não é uma sequência de cadastro intercambiável. Teste adversarial: no portal hospitalar, a matrícula não dependeria de PPC nem de colaborador-professor; a etapa central e sua ligação mudariam, portanto o agrupamento acadêmico deixa de representar o fluxo. A geometria sequencial permanece utilitária e não é tratada como identidade visual por si só.
- **Padrões genéricos:** rejeitados dashboard com cartões métricos, gradiente decorativo e tabela sem fonte de dados. Não há métricas no recorte e a jornada é sequencial.
- **Eixos livres:** paleta é herdada da interface existente; tipografia sistêmica evita download; layout acompanha dependências; raio e borda mantêm consistência; movimento é omitido. Não há imagem decorativa.
- **Concentração visual:** o trilho é o único elemento distintivo; removê-lo elimina a leitura imediata de sequência. Controles, superfícies e divisórias permanecem utilitários.
- **Aritmética:** razões calculadas pelas fórmulas WCAG para as duas superfícies acima. Desktop reserva 250 px ao trilho e 32 px de intervalo; o limite de 1200 px deixa 918 px ao formulário. Em 375 px, margens de 16 px deixam 343 px de conteúdo, uma coluna e campos com largura disponível; rótulos compridos como “ID interno da instituição” quebram linha sem comprimir controles. Não há valores `clamp()` nem texto ilustrativo com métricas.
- **Ambiguidades:** a ordem da jornada e as operações de edição seguem o comportamento atual do backend. Não haverá gerenciamento de instituição existente além de abrir pelo ID, pois não existe operação HTTP de edição/listagem institucional.

## Próximo passo

Após revisão deste documento, criar o pacote Next.js em `frontend/`, configurar o proxy e implementar a jornada por fatias verticais com testes primeiro. O backend permanece como autoridade de validação e persistência.
