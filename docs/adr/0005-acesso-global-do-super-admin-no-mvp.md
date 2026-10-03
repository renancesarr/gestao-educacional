# Acesso global do SUPER_ADMIN no MVP

**Escopo atualizado pela ADR 0016:** a exigência de auditar ações do SUPER_ADMIN não se aplica ao MVP atual; auditoria permanece requisito do sistema completo.

Status: superseded by ADR 0014

No MVP, o papel `SUPER_ADMIN` tem acesso global contínuo para operar a plataforma, com MFA obrigatório e auditoria das ações críticas. Um modelo de acesso temporário por necessidade reduziria privilégios permanentes, mas acrescentaria um fluxo operacional que foi adiado para depois do MVP. O acesso global não altera a fronteira de dados entre tenants para os demais papéis.

O administrador institucional atua somente no próprio tenant; a atuação global do `SUPER_ADMIN` é identificada e auditada. Correções realizadas por ambos preservam o histórico: o poder administrativo não autoriza alterações silenciosas.

Na entrevista de matrícula, o usuário esclareceu que ADMIN designa o administrador global (`SUPER_ADMIN`), com poder de alteração em todas as instituições. Isso não amplia o alcance do administrador institucional nem revoga as decisões anteriores de identificação, auditoria e preservação do histórico.
