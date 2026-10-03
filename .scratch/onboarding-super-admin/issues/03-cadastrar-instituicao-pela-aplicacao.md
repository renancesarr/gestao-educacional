# 03: Cadastrar instituição pela aplicação
**What to build:** um SUPER_ADMIN autenticado pode criar uma instituição, declarar seu escopo educacional inicial e cadastrar sua primeira conta TENANT_ADMIN dentro de uma operação funcionalmente atômica.
**Blocked by:** 01 — Ativar e acessar a conta inicial SUPER_ADMIN.
**Status:** ready-for-human
- [x] O fluxo autenticado recebe código, nome, nome de usuário e senha inicial do TENANT_ADMIN.
- [x] O fluxo exige ao menos um escopo válido: Fundamental/Médio com EJA associada à etapa e/ou graduação; não inclui Educação Infantil.
- [x] Código, nome, nome de usuário e senha respeitam os limites e formatos atuais do provisionamento institucional.
- [x] Código institucional duplicado não substitui nem altera registros existentes.
- [x] Instituição, tenant, escopo e conta TENANT_ADMIN são gravados atomicamente, sem inserir eventos de auditoria no MVP.
- [x] A operação exige autorização SUPER_ADMIN autenticada e não confia em tenant recebido do cliente.
- [x] Testes unitários isolados verificam resultados e falhas através das interfaces públicas dos serviços, usando armazenamento em memória e dependências determinísticas.
## Comments
Implementado com tipos/validação no módulo `institution`, coordenação pelo `super_admin`, formulário e rota autenticada. `npm test` (36 testes unitários), `npm run typecheck` e `npm run test:http` passaram.
Revisão pela ADR 0016: os critérios de auditoria descrevem comportamento legado já implementado, não requisito do MVP vigente. A remoção do runtime fica em ticket próprio; preserve a auditoria do sistema completo.
Atualização 2026-10-03: a implementação removeu os inserts de auditoria do onboarding, manteve a transação de tenant/escopo/conta e preservou as tabelas existentes. A suíte integral com E2E visível passou após essa alteração.
