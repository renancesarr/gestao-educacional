# Operação institucional centralizada pelo SUPER_ADMIN no MVP

**Escopo atualizado pela ADR 0016:** o SUPER_ADMIN continua operando as instituições-alvo no MVP, mas sem trilha de auditoria neste recorte. A auditoria de plataforma permanece requisito futuro.

Para validar a ideia do produto sem implementar gestão de acesso interna, o `SUPER_ADMIN` executa todas as operações institucionais do MVP, escolhendo explicitamente a instituição-alvo. Papéis e permissões internos, como `TENANT_ADMIN` e `ACADEMIC_SECRETARY`, não autorizam operações acadêmicas neste recorte e ficam para uma evolução posterior. A escolha preserva o isolamento dos dados por tenant, mas adia delegação institucional, contas de operação e autorização granular. A exigência de auditoria mencionada em sua decisão original foi retirada do recorte do MVP pela ADR 0016 e permanece prevista para o sistema completo.
