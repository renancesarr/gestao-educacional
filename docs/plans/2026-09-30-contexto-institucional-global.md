# Contexto institucional global para SUPER_ADMIN Implementation Plan
> Plano histórico da implementação inicial. A ADR 0016 posteriormente retirou auditoria das operações do MVP; os passos e critérios de auditoria abaixo não são requisitos vigentes. A auditoria permanece prevista para o sistema completo.
> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Permitir que o `SUPER_ADMIN` opere pessoas de uma instituição indicada por ID interno em cada chamada, mantendo isolamento por tenant e auditoria global atômica.
**Architecture:** `super_admin` autentica e resolve um contexto institucional imutável a partir do principal global e de `targetTenantId`; não há tenant guardado na sessão. `people` recebe esse contexto por um contrato público, limita todas as consultas ao tenant resolvido e usa uma porta de escrita que grava o fato do tenant e a auditoria de plataforma na mesma unidade atômica. HTTP e a tela somente adaptam esse contrato.
## Global Constraints
- O `SUPER_ADMIN` é a única autoridade para operações institucionais no MVP de validação. `TENANT_ADMIN`, `ACADEMIC_SECRETARY` e outros papéis internos não autorizam essas operações.
- Cada operação institucional global recebe `targetTenantId`; não há instituição selecionada ou persistida na sessão global.
- O ID interno identifica a instituição-alvo. O servidor valida que ela existe antes de chamar o caso de uso.
- O servidor autentica a sessão global antes de resolver o alvo. Um cliente não pode criar um contexto institucional apenas enviando um `tenantId`.
- Escritas globais sobre dados institucionais registram auditoria de plataforma com autor `SUPER_ADMIN`, instituição-alvo, ação e data. Quando o módulo já possuir auditoria tenant-scoped, ela registra também o fato institucional correspondente.
- Uma leitura de pessoa por ID ou identificador é sempre limitada ao tenant-alvo do contexto; um identificador de outro tenant se comporta como não encontrado.
- Falha ao gravar auditoria obrigatória impede a conclusão da escrita institucional.
- SQLite é somente adaptador local em memória para integração.
- Login, sessões e permissões institucionais existentes permanecem como legado isolado; esta entrega não os remove nem cria novas rotas institucionais.
- Não implementar catálogo de cursos, ofertas, matrículas ou gestão de papéis internos nesta entrega.
- O repositório não contém metadados Git utilizáveis; não inicializar Git nem tentar commits neste plano.
---
### Task 1: Resolver o contexto global e expor pessoas por esse contexto no seam unitário
**Files:**
- Create: `src/institution/operation-context.ts`
- Modify: `src/institution/index.ts`
- Modify: `src/super_admin/index.ts`
- Modify: `src/people/index.ts`
- Modify: `src/audit/index.ts`
- Modify: `src/identity/platform.ts`
- Create: `tests/support/memory-institution-target-store.ts`
- Modify: `tests/support/memory-people-store.ts`
- Create: `tests/unit/super-admin-institution-context.test.ts`
- Modify: `tests/unit/people.test.ts`
- Modify: `tests/unit/audit.test.ts`
**Interfaces:**
- Consumes: `PlatformPrincipal` autenticado por `createPlatformIdentityService(...).authenticate(token)` e o contrato atual de pessoa `Person`, `PersonIdentifier` e `PersonCreated`.
- Produces: `InstitutionTargetReader` com `exists(tenantId: string): Promise<boolean>`; `InstitutionOperationContext` somente leitura com `{ actorId: string; tenantId: string; actorRole: 'SUPER_ADMIN' }`; e `createInstitutionOperationContextService({ targets }).resolve(principal: PlatformPrincipal, targetTenantId: unknown): Promise<InstitutionOperationContext>`.
- Produces: operações globais públicas de pessoas `create(context, input)`, `get(context, personId)` e `find(context, input)`, e leitura de auditoria `forPerson(context, personId)`. Elas não aceitam `Principal`, cookie, request ou objeto de tenant fornecido pelo cliente.
- Produces: a porta `GlobalPeopleStore`, estendendo as leituras tenant-scoped e declarando `insertForGlobalOperation({ person, tenantEvent, platformEvent }): Promise<'created' | 'conflict'>`. O comando é uma única unidade: `tenantEvent` é `person.created` e `platformEvent` contém `id`, `actor`, `targetTenantId`, `action: 'person.created'` e `occurredAt`.
- [ ] **Step 1: Add the focused failing tests**
Criar `tests/unit/super-admin-institution-context.test.ts` com IDs e relógio fixos. Exercitar `resolve` com um `SUPER_ADMIN` e um tenant existente, afirmando contexto imutável com o ID do ator e do alvo. Cobrir `targetTenantId` ausente, numérico, vazio ou com espaços como `INVALID_INPUT`; ID textual desconhecido como `NOT_FOUND`; e principal cujo papel não é `SUPER_ADMIN` como `FORBIDDEN`.
Em `tests/unit/people.test.ts`, usar `MemoryInstitutionTargetStore` com dois tenants e o serviço global público. Criar uma pessoa no tenant A e provar que: o resultado e o evento tenant-scoped carregam A; o evento da plataforma contém o ator global, A, `person.created` e a data fixa; `get` e `find` no tenant B retornam `NOT_FOUND`; e conflito de CPF ou identificador institucional no mesmo tenant retorna `CONFLICT` sem evento extra. Repetir a criação com a store configurada para falhar ao registrar a auditoria de plataforma e afirmar `INTERNAL`, sem pessoa, evento tenant nem evento de plataforma persistidos.
Em `tests/unit/audit.test.ts`, consultar a auditoria da pessoa pelo contexto do tenant A e provar que o mesmo `personId` consultado com B retorna uma lista vazia, preservando o contrato atual de `forPerson`.
- [ ] **Step 2: Verify the relevant failure**
Run: `node --test --test-isolation=none tests/unit/super-admin-institution-context.test.ts tests/unit/people.test.ts tests/unit/audit.test.ts`
Expected: falha de importação ou de tipos porque não existem o resolvedor de contexto, a porta `GlobalPeopleStore` e as operações que recebem `InstitutionOperationContext`.
- [ ] **Step 3: Implement the minimum behavior**
Em `src/institution/operation-context.ts`, declarar os tipos acima e não incluir permissões institucionais, sessão ou estado mutável. Em `src/super_admin/index.ts`, criar e exportar `createInstitutionOperationContextService`; validar o tipo e `trim()` do alvo antes da consulta, exigir `principal.role === 'SUPER_ADMIN'`, chamar somente `targets.exists`, e devolver `Object.freeze({ actorId: principal.accountId, tenantId, actorRole: 'SUPER_ADMIN' })`.
Em `src/identity/platform.ts`, tornar `PlatformAuditEvent` uma união discriminada que mantenha os quatro eventos de ciclo de vida do administrador e acrescente o evento institucional global `{ id, actor, targetTenantId, action: 'person.created', occurredAt }`. Atualizar o armazenamento em memória para reter o novo evento sem tratar `targetTenantId` como conta-alvo.
Em `src/people/index.ts`, extrair a criação e a validação de pessoa já existentes para uma operação comum sem conhecer HTTP ou SQL. Manter `createPeopleService` e as rotas legadas inalterados no comportamento. Exportar uma fábrica global separada, `createGlobalPeopleService({ store, now, newId })`, que recebe somente `InstitutionOperationContext`; gera pessoa e os dois eventos com os IDs fornecidos; usa `insertForGlobalOperation`; traduz falhas de adaptador por `readOrWrite`; e devolve os mesmos DTOs e erros públicos de pessoa. As leituras devem chamar `store.get(context.tenantId, ...)` ou `store.find(context.tenantId, ...)` e retornar `NOT_FOUND` quando não houver resultado.
Em `src/audit/index.ts`, acrescentar `createGlobalAuditService(reader)` que recebe `InstitutionOperationContext`, chama `reader.forPerson(context.tenantId, personId)` e não invoca `requirePermission`. Não alterar `createAuditService`, que continua sendo o adaptador legado baseado em `Principal`.
Atualizar `MemoryPeopleStore` para implementar `GlobalPeopleStore` por cópia em memória: validar consistência entre pessoa e ambos os eventos, verificar conflito antes de mutar arrays e só adicionar os três registros depois que todos forem aceitos. A opção de falha de plataforma deve lançar antes de qualquer mutação. `MemoryInstitutionTargetStore` deve possuir um conjunto privado por instância e apenas expor `exists`.
- [ ] **Step 4: Verify the focused pass**
Run: `node --test --test-isolation=none tests/unit/super-admin-institution-context.test.ts tests/unit/people.test.ts tests/unit/audit.test.ts`
- [ ] **Step 5: Run the affected regression checks**
Run: `npm run test:unit && npm run typecheck`
Expected: todas as suítes unitárias existentes, inclusive o fluxo legado de pessoas e auditoria, passam; TypeScript termina sem erros.
- [ ] **Step 6: Record the independently reviewable deliverable**
Não criar commit, pois não há metadados Git utilizáveis. Registrar na revisão que o seam global é coberto por memória determinística, que o contexto não pode ser forjado por tenant e que a escrita não deixa estado parcial quando a auditoria global falha.
### Task 2: Persistir pessoa e auditorias globais de forma atômica nos adaptadores
**Files:**
- Create: `migrations/004-global-people-audit.sql`
- Modify: `src/database/people-store.ts`
- Modify: `src/database/institution-onboarding-store.ts`
- Modify: `src/database/sqlite-people-store.ts`
- Modify: `src/database/sqlite-institution-onboarding-store.ts`
- Modify: `src/database/platform-identity-store.ts`
- Modify: `src/main.ts`
- Create: `tests/sqlite/global-people.test.ts`
**Interfaces:**
- Consumes: `InstitutionTargetReader`, `GlobalPeopleStore` e o evento global `person.created` definidos na Task 1.
- [ ] **Step 1: Add the focused failing integration tests**
Em `tests/sqlite/global-people.test.ts`, inicializar somente `DatabaseSync(':memory:')`, aplicar os esquemas dos adaptadores e semear dois tenants. Construir o serviço global com datas e IDs determinísticos. Criar pessoa em A e consultar por CPF/ID em A e B, afirmando isolamento. Consultar `audit_events` e `audit_platform_events`, afirmando um evento `person.created` em cada tabela, ator global e `target_tenant_id = A`. Instalar um gatilho SQLite que rejeita o insert em `audit_platform_events`, tentar nova criação e afirmar contagem inalterada em `people_people`, `audit_events` e `audit_platform_events`.
Para rollback, criar durante o teste uma restrição ou gatilho temporário que rejeite `audit.platform_events` com `person.created`; afirmar que a transação não deixa pessoa nem evento tenant-scoped.
- [ ] **Step 2: Verify the relevant failure**
Run: `npm run test:sqlite -- --test-name-pattern="global"`
Expected: falha porque a tabela/constraint de auditoria de plataforma não aceita `person.created` ou porque os adaptadores não expõem a escrita global atômica e a consulta de existência do tenant.
- [ ] **Step 3: Implement the minimum behavior**
Criar `migrations/004-global-people-audit.sql` que amplia a `CHECK` de `audit.platform_events.action` para incluir exatamente `person.created`, preservando os valores existentes. A migração deve substituir a constraint nomeada de modo explícito e não alterar ou apagar eventos já gravados.
Em `src/database/people-store.ts`, manter `insert` para o caminho legado e adicionar `insertForGlobalOperation`. Nesta nova operação, abrir uma única `transaction(pool, ...)`, inserir em `people.people`, em `audit.events` e em `audit.platform_events`; usar `actor_admin_id = platformEvent.actor`, `target_tenant_id = person.tenantId`, `action = 'person.created'` e a data recebida. Validar na borda do adaptador que os IDs de tenant, pessoa e datas dos três comandos são coerentes; transformar somente os dois conflitos únicos de pessoas no retorno `'conflict'`; propagar demais falhas para que o serviço devolva `INTERNAL` sem expor detalhes.
Adicionar `exists(tenantId)` ao adaptador institucional que já é dono de `institution.tenants` e, em `src/main.ts`, entregar essa porta ao `createInstitutionOperationContextService`.
No SQLite, garantir que cada adaptador possa ser criado em qualquer ordem. O código que cria `audit_platform_events` deve aceitar `person.created`; `createSqlitePeopleStore` implementa `insertForGlobalOperation` dentro de `BEGIN`/`COMMIT`, executa `ROLLBACK` em qualquer exceção e mantém os dois conflitos como `'conflict'`. A consulta `exists` deve ler a mesma tabela `institution_tenants` criada pelo adaptador de onboarding, retornando falso se ela ainda não existir. Não criar banco em arquivo nem alterar o padrão em memória dos testes.
Em `src/database/platform-identity-store.ts`, ajustar somente a persistência/tipagem necessária para a união de `PlatformAuditEvent`; os eventos de identidade continuam preenchendo `target_admin_id`, enquanto `person.created` usa `target_tenant_id` e não tenta preencher uma conta-alvo.
- [ ] **Step 4: Verify the focused pass**
Run: `npm run test:sqlite -- --test-name-pattern="global"`
Expected: a integração SQLite em memória passa, demonstrando isolamento A/B e rollback das três gravações quando a auditoria de plataforma é rejeitada.
- [ ] **Step 5: Run the affected integration checks**
Run: `npm run test:sqlite && npm run typecheck`
Expected: todas as integrações SQLite e a checagem de tipos passam.
- [ ] **Step 6: Record the independently reviewable deliverable**
Não criar commit. Revisar a migração para confirmar que apenas expande a enumeração de ações e revisar as transações para confirmar que pessoa, auditoria tenant-scoped e auditoria de plataforma compartilham o mesmo rollback.
### Task 3: Expor o fluxo global de pessoas por HTTP sem aceitar contexto forjado
**Files:**
- Modify: `src/http/server.ts`
- Modify: `tests/support/fixture.ts`
- Modify: `tests/http/server.test.ts`
- Modify: `src/main.ts`
**Interfaces:**
- Consumes: `createInstitutionOperationContextService(...).resolve(platformPrincipal, targetTenantId)`, `createGlobalPeopleService(...)` e `createGlobalAuditService(...)` das Tasks 1 e 2.
- Produces: rotas globais protegidas por `platform_session`: `POST /api/platform/people`, `POST /api/platform/people/search`, `GET /api/platform/people/:personId?targetTenantId=<uuid>` e `GET /api/platform/people/:personId/audit?targetTenantId=<uuid>`.
- [ ] **Step 1: Add the focused failing HTTP tests**
Em `tests/http/server.test.ts`, provisionar e autenticar o `SUPER_ADMIN` pela fixture real de passkey já usada pela suíte; não construir um principal no request. Semear dois tenants no `MemoryInstitutionTargetStore` da fixture. Cobrir `POST /api/platform/people` com corpo `{ targetTenantId, name, cpf }`, espera 201, e busca posterior no mesmo tenant.
Cobrir as falhas: ausência de cookie `platform_session` retorna 401 `UNAUTHENTICATED` e limpa somente o cookie global quando aplicável; `targetTenantId` ausente ou numérico retorna 400 `INVALID_INPUT`; UUID textual inexistente retorna 404 `NOT_FOUND`; CPF existente somente no tenant A buscado via rota de A retorna 200 e via rota de B retorna 404 `NOT_FOUND`. Nas rotas GET, confirmar que `targetTenantId` vem da query e que query ausente retorna 400. Enviar `tenantId` adicional no corpo de criação e afirmar 400 `INVALID_INPUT`, impedindo contexto institucional forjado.
- [ ] **Step 2: Verify the relevant failure**
Run: `node --test --test-isolation=none tests/http/server.test.ts --test-name-pattern="plataforma.*pessoa|pessoa.*plataforma"`
Expected: falha 404 ou erro de serviço ausente, porque o servidor ainda encaminha pessoas somente pela sessão institucional legada.
- [ ] **Step 3: Implement the minimum behavior**
Estender o tipo `Services` de `src/http/server.ts` com `institutionOperationContext`, `globalPeople` e `globalAudit`. Para cada rota `/api/platform/people`, autenticar `platform_session` primeiro, ler a entrada, resolver `targetTenantId` uma vez e passar apenas o contexto devolvido ao serviço. Não ler `targetTenantId` de cookie, sessão, cabeçalho ou variável global.
Aplicar validação estrita dos corpos POST: criação aceita apenas `targetTenantId`, `name`, `cpf` e `institutionalId`, preservando a regra existente de exatamente um identificador; busca aceita somente `targetTenantId` e um identificador. Para GET, extrair somente `targetTenantId` da query, rejeitar chaves de query adicionais e passar o `personId` já validado pelo regex UUID. Manter as rotas `/api/people*` existentes sem mudanças, como legado.
Em `tests/support/fixture.ts`, compor serviços globais em memória e fornecer os dois tenants de demonstração ao leitor de alvo. Não adicionar uma seleção ativa de instituição, nem expor uma rota que devolva contexto persistente.
- [ ] **Step 4: Verify the focused pass**
Run: `node --test --test-isolation=none tests/http/server.test.ts --test-name-pattern="plataforma.*pessoa|pessoa.*plataforma"`
Expected: os casos globais passam com uma sessão de plataforma real e todos os acessos entre tenants retornam o erro público esperado.
- [ ] **Step 5: Run the affected regression checks**
Run: `npm run test:http && npm run test:unit && npm run typecheck`
Expected: as rotas globais novas e os endpoints de sessão/institucionais preexistentes passam; TypeScript termina sem erros.
- [ ] **Step 6: Record the independently reviewable deliverable**
Não criar commit. Revisar os handlers para confirmar a ordem obrigatória: autenticar sessão global, validar e resolver alvo, executar caso de uso; nunca aceitar um contexto pronto ou derivar o tenant da sessão global.
### Task 4: Acrescentar a superfície manual de validação sem seleção persistente
**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `tests/http/server.test.ts`
- Modify: `docs/IDEIA.md`
**Interfaces:**
- Consumes: as quatro rotas globais de pessoas da Task 3 e o cookie `platform_session` já emitido pelo login de plataforma.
- Produces: um painel de teste global que solicita o ID interno da instituição em cada criação, busca, consulta e leitura de auditoria; não armazena esse ID em `localStorage`, cookie, sessão, URL persistida ou variável de seleção entre ações.
- [ ] **Step 1: Add the focused failing browser-contract test**
Em `tests/http/server.test.ts`, acrescentar leitura estática de `GET /` e `GET /app.js`. Afirmar que a página servida contém campos explícitos de ID interno da instituição nos formulários globais de pessoa, que essas ações chamam endpoints `/api/platform/people`, e que o código não contém `localStorage`, `sessionStorage` nem escrita de cookie para `targetTenantId`.
- [ ] **Step 2: Verify the relevant failure**
Run: `node --test --test-isolation=none tests/http/server.test.ts --test-name-pattern="painel global|targetTenantId"`
Expected: falha porque a interface atual só contém o fluxo de onboarding e os controles institucionais legados, sem um alvo explícito por ação.
- [ ] **Step 3: Implement the minimum behavior**
Em `public/index.html`, adicionar uma seção visível somente após a autenticação global já existente: criar pessoa, buscar por CPF/identificador, consultar por UUID e consultar a auditoria da pessoa. Cada formulário inclui seu próprio campo obrigatório `targetTenantId`, identificado como ID interno da instituição, e não compartilha valor automaticamente com os demais formulários.
Em `public/app.js`, enviar o valor digitado dentro de cada corpo POST ou query GET conforme o contrato da Task 3; tratar 400, 401, 403, 404 e 409 exibindo somente a mensagem pública devolvida; limpar os dados da ação depois de sucesso sem preencher os campos das outras ações. Não incluir controles de papéis institucionais, seleção de tenant, lista de instituições, cadastro de usuários institucionais, cursos, ofertas ou matrículas.
Em `docs/IDEIA.md`, registrar que a tela de validação de pessoas usa o ID interno por ação e não configura autorização institucional. Não acrescentar novas regras de domínio.
- [ ] **Step 4: Verify the focused pass**
Run: `node --test --test-isolation=none tests/http/server.test.ts --test-name-pattern="painel global|targetTenantId"`
Expected: a página e o script servidos expõem os formulários globais explícitos e não persistem a instituição-alvo.
- [ ] **Step 5: Run the final relevant checks**
Run: `npm run test:unit && npm run test:http && npm run test:sqlite && npm run typecheck`
Expected: todas as suítes unitárias, HTTP e SQLite passam; TypeScript termina sem erros.
- [ ] **Step 6: Record the independently reviewable deliverable**
Não criar commit. Revisar manualmente no navegador que cada ação exige uma digitação própria do ID interno e que nenhuma ação reutiliza silenciosamente o tenant da ação anterior.
## Plan self-review
- **Cobertura:** cada requisito da especificação aprovada é atendido: alvo explícito por operação (Tasks 1, 3 e 4), autenticação global e papel (Tasks 1 e 3), isolamento (Tasks 1 a 3), auditoria atômica (Tasks 1 e 2), SQLite separado (Task 2), e ausência de seleção persistente/papéis internos/catálogo (restrições globais e Task 4).
- **Sem lacunas executáveis:** os arquivos, interfaces, erros, rotas, dados de teste e comandos de verificação estão nomeados em cada tarefa. A ação de auditoria de plataforma é `person.created`, igual ao fato tenant-scoped existente.
- **Consistência de interfaces:** `InstitutionOperationContext`, `InstitutionTargetReader`, `GlobalPeopleStore`, `createGlobalPeopleService` e `createGlobalAuditService` são definidos na Task 1 e consumidos nas Tasks 2 a 4.
