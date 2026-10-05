# Executar o baseline local com SQLite
Esta página descreve o código executável disponível: acesso `SUPER_ADMIN`, onboarding institucional, pessoas, colaboradores, cursos, PPC/matérias, matrícula individual, buscas de alunos e catálogo, CRUD de avaliações/notas/frequência/históricos/credenciais e CRUD manual de atos regulatórios. Na matrícula, o operador seleciona atos da instituição e do curso; atos vencidos, suspensos ou revogados exigem justificativa para permitir a operação, e os textos selecionados ficam registrados como snapshot. A operação do MVP usa dados INEP locais para referências escolares; o fixture `catalog-listing.sqlite` é mantido read-only. Não há interface nem rotas operacionais para importar ou consultar e-MEC: integração permanece pós-MVP conforme a [ADR 0017](adr/0017-dados-locais-e-cursos-demonstrativos-no-mvp.md). O fixture independente `academic-scenario.sqlite`, preparado por `npm run fixture:academic:prepare`, contém dois tenants demonstrativos, cursos de Fundamental, Médio, Técnico em Administração e Bacharelado em Administração, matérias de exemplo e zero matrículas. Nenhum fixture é banco operacional nem converte automaticamente referência em instituição ou matrícula. A categoria técnica é distinta de Ensino Médio regular e graduação. As matérias são exemplos editáveis, não matrizes curriculares nacionais. Matrículas em lote e integração EAD não pertencem ao MVP; a auditoria permanece fora do MVP e como requisito do sistema completo.
## Inicialização rápida
- Node.js 24.12 ou superior e npm.
- SQLite é o único banco necessário para iniciar e testar o fluxo local do MVP. O arquivo padrão fica em `data/gestao-educacional.sqlite`.
- Para produção, use HTTPS com `PUBLIC_ORIGIN` igual à origem visível no navegador. HTTP é aceito apenas em localhost.
```sh
npm ci
cp .env.example .env
```
O exemplo já seleciona SQLite. A inicialização cria o arquivo e as tabelas necessárias; não é preciso executar migração para o banco local.
```sh
npm start
```
Abra `http://localhost:3000` no frontend Next.js. O backend usa a porta `3001` no `.env.example` e o frontend encaminha `/api/*` para ele.
## Provisionamento de `SUPER_ADMIN`
Defina `PLATFORM_ADMIN_USERNAME` no `.env` e execute `npm run db:provision-super-admin`. O comando prepara o SQLite local e imprime um código de uso único, válido por 30 minutos; entregue-o ao titular por um canal seguro.
O provisionamento não registra autoria em trilha de auditoria no MVP. A auditoria de plataforma permanece requisito do sistema completo.
O titular abre “Acesso da plataforma”, informa usuário e código e registra uma passkey com verificação local obrigatória. O código não cria uma sessão administrativa.
O acesso seguinte usa o nome de usuário global e “Entrar com passkey”. Com a sessão global autenticada, a tela permite cadastrar uma instituição e sua conta `TENANT_ADMIN`. Informe um ou mais itens: Ensino Fundamental, EJA no Ensino Fundamental, Ensino Médio, EJA no Ensino Médio, Educação Profissional Técnica de nível médio e/ou graduação. A instituição pode combinar esses escopos; Educação Infantil está fora do MVP. Curso técnico é categoria explícita, diferente do Ensino Médio regular. Código duplicado é rejeitado. O onboarding não grava eventos de auditoria no MVP; o requisito de auditoria permanece para o sistema completo. A conta institucional usa o login institucional existente, mas a operação do MVP é centralizada no `SUPER_ADMIN`. O fluxo não coleta CNPJ nem endereço.
Se todas as passkeys forem perdidas, o operador local pode emitir uma nova ativação com `PLATFORM_ADMIN_USERNAME` e `npm run db:recover-super-admin`. A operação invalida as passkeys e sessões anteriores. O novo código deve ser entregue ao titular por canal seguro.
SQLite é o único banco que inicia a aplicação ponta a ponta hoje.
## Acesso e dados do código atual
- O login é exclusivo do contexto profissional. O código institucional localiza a conta; somente a sessão validada define o tenant dos demais comandos.
- O frontend atual opera com `SUPER_ADMIN`; rotas legadas de sessão institucional continuam disponíveis no backend. A autoridade é verificada no servidor e a tela não concede permissões.
- Sessões opacas expiram em oito horas e são revogadas no logout; somente o hash do token fica no banco. A conta ativa e seu papel são relidos em cada autenticação de sessão.
- Cookies usam `HttpOnly`, `SameSite=Strict` e `Secure` em HTTPS. Requisições de alteração exigem a origem configurada; não há CORS aberto.
- Senhas usam scrypt com sal aleatório. São limitadas cinco tentativas por instituição/usuário por minuto e vinte requisições de login por endereço de conexão por minuto. Esses limites são locais ao processo do monólito e reiniciam com ele; atrás de proxy, o endereço observado será o do proxy. Ajustes para implantação precisam considerar esse comportamento.
- Contas de aluno/responsável não entram neste portal. A operação global do `SUPER_ADMIN` é separada do tenant e requer passkey com verificação local.
- O backend atual grava e consulta pessoas sem eventos de auditoria; as rotas de auditoria não fazem parte do MVP. O módulo e os registros históricos permanecem preservados para a evolução do sistema completo. Unicidade de CPF/identificador é delimitada pelo tenant.
- CPF é validado quanto ao formato, sem consulta externa nem cálculo dos dígitos verificadores. Cadastros duplicados não são unidos nem atualizados automaticamente.
- Sessões expiradas deixam de autenticar, mas sua limpeza física ainda não está automatizada; retenção de dados e políticas de identidade mais amplas continuam pendentes.
- O catálogo INEP local combina nome, código e município/UF. A aplicação não expõe endpoints nem interface operacional e-MEC; as rotas antigas respondem 404. A fixture de catálogo permanece read-only para consulta de testes. O cenário de cursos operacionais fica em outro SQLite também consultado em modo read-only pelas suítes; sua preparação explícita não toca no banco operacional nem no catálogo de origem.
- A busca autenticada e a busca pública de alunos estão implementadas; município/UF refere-se ao nascimento. A resposta pública limita-se a nome, curso e instituição.
## Contrato HTTP
Requisições com corpo usam JSON. A busca é POST para não colocar CPF em URLs. Dados desconhecidos no cadastro e na busca são rejeitados. Erros têm `code` e `message`, sem detalhes da infraestrutura.
| Operação | Método e rota | Entrada |
| --- | --- | --- |
| Entrar institucional | `POST /api/session` | `institution`, `username`, `password` |
| Consultar sessão | `GET /api/session` | Cookie de sessão |
| Sair | `DELETE /api/session` | Cookie e origem válida |
| Cadastrar pessoa | `POST /api/people` | `name`, `cpf` e/ou `institutionalId` |
| Buscar pessoa | `POST /api/people/search` | Somente `cpf` ou somente `institutionalId` |
| Consultar por ID | `GET /api/people/:id` | UUID |
| Verificar processo | `GET /health` | Nenhuma; não comprova disponibilidade do banco |
| Iniciar ativação global | `POST /api/platform/activation/options` | `username`, `activationCode` |
| Concluir ativação global | `POST /api/platform/activation/verify` | `username`, resposta WebAuthn e cookie de cerimônia |
| Iniciar login global | `POST /api/platform/login/options` | `username` |
| Concluir login global | `POST /api/platform/login/verify` | `username`, resposta WebAuthn e cookie de cerimônia |
| Consultar/sair da sessão global | `GET`/`DELETE /api/platform/session` | Cookie global |
| Cadastrar instituição | `POST /api/platform/institutions` | Sessão global e `code`, `name`, `username`, `password` |
| Cadastrar ato institucional/curso | `POST /api/platform/regulatory-acts` | Sessão global, `targetTenantId`, `target`, `text`, `status` e `courseId` quando aplicável |
| Buscar atos institucionais/de curso | `POST /api/platform/regulatory-acts/search` | Sessão global, `targetTenantId`, filtros opcionais `target` e `courseId` |
| Editar/excluir ato | `PATCH`/`DELETE /api/platform/regulatory-acts/:id` | Sessão global e `targetTenantId`; edição exige texto/status e escolha `preservePreviousVersion` |
## Verificação e limites
Veja [TESTES.md](TESTES.md) para as suítes separadas. Testes unitários não usam banco nem rede. A suíte HTTP usa o servidor real com persistência fictícia em memória.
Os resultados antigos anotados ali não substituem uma execução no ambiente atual.
Para inspecionar somente a interface legada com dados fictícios, execute `node scripts/preview-fixture.ts` e abra `http://127.0.0.1:4317`. As credenciais da prévia são descartáveis e seus dados desaparecem ao encerrá-la.
