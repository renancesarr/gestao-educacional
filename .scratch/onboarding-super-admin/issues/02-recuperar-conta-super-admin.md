# 02: Recuperar uma conta SUPER_ADMIN sem passkeys
**What to build:** quando o titular perder todas as passkeys, o operador local pode reativar a conta e emitir um novo código de uso único para cadastrar outra passkey, sem liberar acesso por e-mail ou por uma sessão não autenticada.
**Blocked by:** 01 — Ativar e acessar a conta inicial SUPER_ADMIN.
**Status:** done
- [x] O operador local pode emitir um novo código de ativação para uma conta SUPER_ADMIN existente.
- [x] O novo código permite cadastrar uma passkey, mas não concede acesso a operações globais por si só.
- [x] Passkeys anteriores ficam invalidadas após a reativação controlada.
- [x] A recuperação exige operação local controlada; não grava auditoria no MVP.
- [x] Testes unitários isolados verificam a interface pública do serviço, uso único do código, invalidação de credenciais e rejeição de acesso anterior à nova passkey.
## Comments
Atualização 2026-10-03: recuperação local não gera auditoria no MVP; o critério antigo fica superado pela ADR 0016 e ticket `.scratch/remocao-auditoria-mvp/issues/02-identidade-e-onboarding.md`.
Implementado pelo comando local `npm run db:recover-super-admin`. `npm test` (36 testes unitários), `npm run typecheck` e `npm run test:http` passaram.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/onboarding-super-admin/02-recuperar-conta-super-admin/2026-10-03T11-41-17-722Z/run.txt`) e produziu o vídeo `logs/e2e/onboarding-super-admin/02-recuperar-conta-super-admin/2026-10-03T11-41-17-722Z/videos/02-recuperar-conta-super-admin.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
