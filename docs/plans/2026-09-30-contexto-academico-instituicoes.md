# Contexto acadêmico da instituição Implementation Plan
> Plano histórico da implementação inicial. A ADR 0016 posteriormente retirou auditoria das operações do MVP; menções a eventos de auditoria descrevem o desenho anterior e não requisitos vigentes. A auditoria permanece prevista para o sistema completo.
> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Ao cadastrar uma instituição, o `SUPER_ADMIN` informa seu escopo educacional inicial, que fica ligado ao tenant e pode orientar o futuro catálogo de cursos.
**Architecture:** O módulo `institution` será dono dos tipos e da validação do escopo; `super_admin` continuará autorizando e coordenando o onboarding; `identity` e `audit` manterão suas responsabilidades. Um adaptador relacional grava tenant, escopo, primeiro administrador e auditorias na mesma transação.
## Global Constraints
- Tratar cada tenant como uma instituição independente; `tenantId` é derivado no servidor e nunca aceito do request.
- Uma instituição pode oferecer Educação Básica, Educação Superior ou ambas.
- No MVP, Educação Básica inclui Ensino Fundamental e Ensino Médio; Educação Infantil fica fora. EJA é modalidade ligada a etapa, não um nível ou etapa. Educação Superior contempla graduação.
- O `SUPER_ADMIN` informa o escopo inicial junto ao onboarding institucional. Manutenção posterior do escopo está fora deste recorte.
- O cadastro não coleta CNPJ, endereço ou outros dados legais não especificados.
- Manter código, nome e dados iniciais do `TENANT_ADMIN` com os limites do provisionamento atual. Código duplicado não altera registros existentes.
- Tenant, escopo, conta inicial e auditorias obrigatórias são atômicos; auditoria da plataforma registra autor e instituição-alvo, sem pertencer ao tenant.
- Seguir TDD: um teste observável falha, implementação mínima, teste passa, próxima fatia.
- O repositório não contém metadados Git utilizáveis; não inicializar Git nem tentar commits neste plano.
---
## Task 1: Definir escopo educacional e validar onboarding no serviço público
**Files:**
- Create: `src/institution/index.ts` (proposto)
- Create: `tests/support/memory-institution-onboarding-store.ts` (proposto)
- Modify: `src/super_admin/index.ts`
- Modify: `tests/unit/super-admin.test.ts`
**Interfaces:**
- Consumes: serviço existente `createSuperAdminService({ store, now, newId }).createInstitution(principal, input)`.
- Produces: `InstitutionEducationScope` como união de itens `{ level: 'BASIC'; stage: 'FUNDAMENTAL' | 'MEDIO'; modality?: 'EJA' }` e `{ level: 'HIGHER'; courseType: 'GRADUACAO' }`; o contrato público de criação acrescenta `educationScope: InstitutionEducationScope[]` obrigatório.
- A validação de escopo fica exportada pelo módulo `institution` e é chamada pelo caso de uso público. O principal global continua fornecido pelo adaptador confiável, não pelo corpo.
- [x] **Step 1: Escrever um teste público que demonstra criação com escopo combinado**
Adicionar teste a `tests/unit/super-admin.test.ts`: um principal `SUPER_ADMIN` autorizado cria instituição com Fundamental regular, Fundamental EJA, Médio e graduação; afirmar que o serviço retorna código/nome/usuário e que o adaptador em memória observa os itens de escopo e o autor esperados junto aos IDs gerados.
- [x] **Step 2: Verificar a falha relevante**
Run: `node --test --test-isolation=none tests/unit/super-admin.test.ts`
Expected: falha porque `educationScope` ainda não é aceito nem enviado ao armazenamento.
- [x] **Step 3: Implementar o contrato mínimo de domínio e sua validação**
Em `src/institution/index.ts`, definir e exportar os tipos e `parseInstitutionEducationScope(input: unknown)`. Exigir uma lista não vazia; aceitar somente os dois níveis, as etapas e a combinação de graduação descritas acima; permitir EJA apenas em item BASIC; rejeitar propriedades desconhecidas, duplicatas estruturais, nível/etapa incompatível, graduação sem nível HIGHER, item HIGHER com etapa/modalidade e escopo fora do MVP. Atualizar `createSuperAdminService` para exigir o campo, chamar o parser antes de hashear a senha ou escrever no store, e incluir o resultado validado no comando de onboarding. Não aceitar `tenantId` no input.
Criar `MemoryInstitutionOnboardingStore` por instância de teste, com unicidade de código, gravação de instituição/escopo/admin/auditorias como unidade lógica e opção de falha para provar que a falha não retorna sucesso nem deixa estado parcial.
- [x] **Step 4: Completar cenários negativos no mesmo seam e verificar a aprovação**
Adicionar casos para escopo ausente/vazio, Educação Infantil, EJA ligada a Educação Superior, lista com duplicata, propriedades extras, ator sem permissão, `tenantId` malicioso, código duplicado sem sobrescrita e falha de persistência sem estado parcial. Cada teste usa o método público do serviço e a store em memória, sem inspecionar métodos privados.
Run: `node --test --test-isolation=none tests/unit/super-admin.test.ts`
Expected: todos os casos passam e apenas o primeiro onboarding válido fica no armazenamento.
- [x] **Step 5: Rodar checagem de tipos afetada**
Run: `npm run typecheck`
Expected: TypeScript termina sem erros.
## Task 2: Persistir escopo com tenant e onboarding atômico
**Files:**
- Create: `migrations/003-institution-education-scope.sql` (proposto)
- Create: `src/database/institution-onboarding-store.ts` (proposto)
- Modify: `src/main.ts`
- Modify: `src/database/platform-identity-store.ts` (remover o adaptador institucional que hoje está neste arquivo)
**Interfaces:**
- Consumes: o contrato de escopo validado da Task 1 e `InstitutionOnboardingStore.create(...)` chamado por `createSuperAdminService`.
- [x] **Step 2: Verificar a falha relevante**
Expected: antes do adaptador ser criado, o caso falha no import de `src/database/institution-onboarding-store.ts`, demonstrando a dependência ausente.
- [x] **Step 3: Implementar migração e transação mínima**
Criar tabela `institution.education_scope_items`, com FK para `institution.tenants`, chave primária `(tenant_id, scope_code)` e `CHECK` limitado aos códigos canônicos `BASIC_FUNDAMENTAL`, `BASIC_FUNDAMENTAL_EJA`, `BASIC_MEDIO`, `BASIC_MEDIO_EJA` e `HIGHER_GRADUATION`. Não preencher escopo de tenants existentes: eles permanecem sem itens e exigirão um fluxo explícito posterior. Código duplicado retorna `duplicate`, sem substituir dados; falhas fora de unicidade propagam erro normalizado pelo serviço.
Extrair o store para `src/database/institution-onboarding-store.ts`, atualizar `src/main.ts` e garantir que o evento `audit.platform_events` use `actor_admin_id` e `target_tenant_id`; eventos tenant continuam tenant-scoped.
Expected: os testes de instituição e os existentes de pessoas passam; se o banco não estiver disponível, relatar o bloqueio sem alegar atomicidade verificada dinamicamente.
- [x] **Step 5: Rodar testes unitários e tipos**
Run: `npm test && npm run typecheck`
Expected: todos os testes unitários e a checagem TypeScript passam.
## Task 3: Expor o escopo no cadastro global e documentar o onboarding
**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `src/http/server.ts`
- Modify: `tests/support/fixture.ts`
- Create: `tests/http/institution-onboarding.test.ts`
- Modify: `docs/EXECUCAO.md`
- Modify: `docs/CONTEXT.md`
- Create: `docs/adr/0012-escopo-educacional-inicial-da-instituicao.md` (proposto)
- Modify: `.scratch/onboarding-super-admin/spec.md`
- Modify: `docs/specs/2026-09-29-contexto-academico-instituicoes-design.md`
**Interfaces:**
- Consumes: rota existente `POST /api/platform/institutions`, protegida pelo cookie `platform_session`, e contrato validado da Task 1.
- Produces: formulário de escopo enviado junto a código, nome e primeiro administrador; as respostas HTTP permanecem sem dados de `tenantId` controlados pelo cliente.
- [x] **Step 1: Escrever teste HTTP do contrato de onboarding com principal global autenticado**
Adicionar um teste que usa fixture de servidor existente e prova que usuário global autorizado cria instituição com escopo selecionado; conferir que request sem escopo/escopo inválido responde 400, request sem sessão global responde 401/403, e request com `tenantId` é rejeitado. Confirmar resposta bem-sucedida sem expor hash da senha nem IDs de outros tenants.
- [ ] **Step 2: Verificar a falha relevante**
Run: `npm run test:http`
Expected: com sockets permitidos no ambiente, falha porque a página ainda não oferece as opções de escopo. Se o ambiente bloquear bind local, registrar `listen EPERM`; isso não substitui a evidência HTTP.
- [x] **Step 3: Implementar controles do formulário e contrato**
Adicionar checkboxes para Fundamental, EJA-Fundamental, Médio, EJA-Médio e Graduação; permitir Basic e Superior simultaneamente. Enviar o conjunto como itens canônicos `educationScope`. Preservar escopo como obrigatório no servidor independentemente da validação HTML. Mostrar erros da validação existente sem exibir detalhes internos. Atualizar `fixtureServices()` para expor `MemoryPlatformIdentityStore` e fake WebAuthn fixo; sua configuração passa pelos métodos públicos `provisionInitial`, `beginActivation` e `completeActivation`, deixando o teste HTTP usar a sessão opaca resultante.
- [x] **Step 4: Atualizar documentação de domínio e operação**
Atualizar a especificação de onboarding com o novo campo e a matriz de escopo; adicionar ao glossário “Escopo educacional da instituição”; registrar a decisão de seleção inicial pelo `SUPER_ADMIN` em ADR sequencial; atualizar `docs/EXECUCAO.md` com os valores aceitos e os limites atuais do provisionamento. Documentar que tenants existentes sem escopo não recebem valores inferidos e não ficam prontos para o catálogo acadêmico até haver um fluxo autorizado posterior. Manter o desenho marcado como aprovado e não alterar decisões futuras de edição de escopo.
- [x] **Step 5: Verificar HTTP, testes unitários, tipos e migrações**
Run: `npm run test:http && npm test && npm run typecheck`
Expected: os testes HTTP, os testes unitários e TypeScript passam.
O HTTP, os 36 testes unitários e TypeScript passaram em 2026-09-30.
## Decisões externamente observáveis ainda abertas
- O destino do comando legado `npm run db:provision`: retirá-lo para novas instituições, mantê-lo como bootstrap com escopo obrigatório ou permitir tenants novos sem escopo. O onboarding pela aplicação sempre exige escopo. Até essa escolha, a recomendação de implementação é deixar o CLI existente sem alteração e identificar seus tenants sem escopo como legados; isso não os habilita automaticamente para o futuro catálogo acadêmico.
- Quem pode editar escopo depois da criação e como preencher escopo de instituições existentes continuam fora deste recorte.
- A estrutura do catálogo de cursos e suas relações detalhadas com níveis, etapas e modalidades pertence à próxima etapa.
