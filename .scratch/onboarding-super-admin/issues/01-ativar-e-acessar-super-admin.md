# 01: Ativar e acessar a conta inicial SUPER_ADMIN
**What to build:** o operador provisiona a primeira conta global e entrega um código de uso único ao titular, que ativa a conta cadastrando uma passkey com verificação local obrigatória e passa a acessar a plataforma sem código institucional.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] O provisionamento local cria uma conta SUPER_ADMIN com nome de usuário único na plataforma, sem vinculá-la a um tenant.
- [x] O operador recebe um código de ativação de uso único; o código não concede acesso a operações globais antes do cadastro da passkey.
- [x] O titular ativa a conta e cadastra uma passkey/WebAuthn com verificação local obrigatória.
- [x] O SUPER_ADMIN autentica com nome de usuário global e passkey, sem informar código de instituição.
- [x] A plataforma rejeita contas sem passkey cadastrada e cerimônias inválidas, expiradas ou repetidas.
- [x] A conta inicial é provisionada por operação local controlada; não grava auditoria no MVP.
- [x] Testes unitários isolados exercitam a interface pública do serviço com armazenamento em memória e dependências determinísticas.
## Comments
Implementado no workspace. `npm test` (36 testes unitários), `npm run typecheck` e `npm run test:http` passaram.
Revisão pela ADR 0016: o critério que registra o provisionamento em auditoria descreve comportamento legado já implementado, não requisito do MVP vigente. A remoção do runtime fica em ticket próprio; preserve a auditoria do sistema completo.
Atualização 2026-10-03: provisionamento e ativação não geram auditoria no MVP; esse critério antigo fica superado pela ADR 0016 e ticket `.scratch/remocao-auditoria-mvp/issues/02-identidade-e-onboarding.md`.
