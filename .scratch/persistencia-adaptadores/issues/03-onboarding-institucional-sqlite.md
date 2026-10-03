# 03: Persistir onboarding institucional e escopo em SQLite
**What to build:** a criação de uma instituição com seu escopo educacional inicial pode ser verificada em SQLite em memória, incluindo o primeiro `TENANT_ADMIN` e as evidências de auditoria, sem conexão externa de banco.
**Blocked by:** 01 — Executar integração de identidade e sessões com SQLite; 02 — Persistir pessoas e auditoria em SQLite.
**Status:** ready-for-human
- [x] O adaptador SQLite persiste tenant, escopo educacional, primeira conta `TENANT_ADMIN`, auditorias institucionais e auditoria de plataforma na mesma transação.
- [x] Auditoria de plataforma preserva autoria `SUPER_ADMIN` e instituição-alvo sem tornar o evento propriedade do tenant.
- [x] Código institucional duplicado não altera tenant, escopo, conta ou auditoria existentes.
- [x] Falha ao persistir qualquer parte do onboarding desfaz todas as gravações relacionadas.
- [x] Testes de integração usam SQLite em memória isolado por teste; o contrato do serviço público e os testes unitários existentes permanecem independentes de fornecedor.
## Comments
Implementado pelo serviço público `createInstitution` com o adaptador SQLite em memória. Os testes confirmam os cinco códigos de escopo esperados, login do `TENANT_ADMIN`, separação entre auditoria institucional e de plataforma, duplicidade sem sobrescrita e rollback integral quando a gravação da auditoria de plataforma falha. A integração revelou e corrigiu a compatibilidade do contrato SQLite de auditoria para eventos de pessoa, instituição e conta. `npm run test:sqlite`, `npm test` e `npm run typecheck` passaram.
Revisão pela ADR 0016: auditorias listadas aqui descrevem a implementação histórica, não requisito do MVP vigente. Remoção do runtime fica em ticket próprio; preserve o requisito de auditoria do sistema completo.
