# Contexto acadêmico da instituição
Status: aprovado pelo usuário em 2026-09-30
Data: 2026-09-29
**Alinhamento posterior:** este design é histórico. Os trechos que acoplam onboarding a eventos de auditoria foram superados pela ADR 0016; o MVP cria instituição, escopo e conta de forma consistente sem gravar auditoria. O requisito de auditoria permanece para o sistema completo.
## Objetivo
Completar a criação de uma instituição para que ela declare o escopo educacional que oferece antes do cadastro de cursos, ofertas e matrículas. O registro atual contém apenas código e nome, insuficientes para validar o catálogo acadêmico futuro.
## Recorte aprovado
O `SUPER_ADMIN` seleciona o escopo educacional no momento em que cria a instituição pela aplicação. A operação cria, de forma atômica, o tenant, o cadastro institucional, o escopo, a primeira conta `TENANT_ADMIN` e as evidências de auditoria. O cliente não escolhe nem envia `tenantId`.
O cadastro acadêmico da instituição mantém código e nome e acrescenta os níveis, etapas e modalidades que ela oferece:
- A instituição pode oferecer Educação Básica, Educação Superior ou ambas.
- Para Educação Básica, seleciona Ensino Fundamental, Ensino Médio ou ambos. Educação Infantil não está no MVP.
- EJA é registrada como modalidade vinculada a Ensino Fundamental e/ou Ensino Médio, nunca como nível ou etapa.
- Para Educação Superior, o escopo desta versão registra graduação, o tipo de curso superior incluído no MVP.
- Uma instituição pode combinar Fundamental, Médio/EJA e graduação conforme seu escopo.
CNPJ, endereço e outros dados de identificação legal não entram neste recorte: não estão definidos como requisito para o onboarding acadêmico e não devem ser coletados por suposição.
## Responsabilidades
- `super_admin` autentica e autoriza a operação global e coordena o onboarding.
- `institution` é dona do cadastro institucional e de seu escopo educacional.
- `identity` cria a primeira conta `TENANT_ADMIN` e protege sua senha.
- `audit` registra a autoria `SUPER_ADMIN`, a instituição-alvo e os eventos do onboarding; a auditoria de plataforma não pertence ao tenant.
- A gravação usa uma fronteira transacional comum para impedir instituições sem o escopo ou sem o primeiro administrador.
O contrato de criação recebe código, nome, escopo educacional e os dados iniciais do `TENANT_ADMIN`. Seguem válidas as regras atuais para código (minúsculas, letras, números e hífens, 2–100 caracteres), nome (não vazio, até 200), usuário (não vazio, até 100) e senha (12–256 caracteres). Código duplicado não altera a instituição existente.
## Evolução planejada
O catálogo de cursos será o próximo recorte e deverá respeitar o escopo declarado pela instituição. Depois dele vêm ofertas educacionais, organização de ciclos e requisitos de ativação; só então o fluxo de matrícula depende dessas estruturas. Este documento não define os campos de curso, regras acadêmicas, calendário, matrículas ou contratos de importação.
O `SUPER_ADMIN` define o escopo inicial na criação. Edição posterior do escopo e preenchimento de instituições preexistentes sem escopo exigem um fluxo próprio e ficam fora deste recorte.
## Fronteira TDD
Os testes unitários exercitam o serviço público de onboarding institucional, com persistência em memória e relógio/IDs determinísticos. Cobrem:
- criação de instituição com Educação Básica, Superior ou ambas e escopo coerente;
- etapas e modalidade EJA válidas, incluindo sua associação à etapa;
- rejeição de escopo vazio, inválido ou fora do MVP;
- autorização exclusiva de `SUPER_ADMIN` para a criação global;
- duplicidade sem sobrescrita e ausência de `tenantId` controlado pelo cliente;
- consistência observável do cadastro, escopo, conta inicial e auditoria, sem sucesso parcial.
## Decisões pendentes fora do recorte
- Quem pode alterar o escopo depois da criação e quais alterações exigem auditoria ou migração.
- Como completar o escopo das instituições existentes antes da adoção do novo cadastro.
- A estrutura detalhada do catálogo de cursos, seus níveis/etapas/modalidades e currículos.
- Regras de calendário, ciclos e ativação por oferta.
## Auto-revisão
- **Placeholders:** não há TODO/TBD no comportamento incluído; os itens pendentes estão explicitamente fora do recorte.
- **Consistência:** EJA aparece somente como modalidade ligada a etapa; Educação Básica e Superior podem coexistir.
- **Escopo:** este é o primeiro subprojeto, limitado ao cadastro institucional e escopo inicial; curso, oferta e matrícula são sequenciados depois.
- **Ambiguidade:** edição posterior e instituições preexistentes foram deliberadamente excluídas, em vez de inferir permissões ou migração.
## Referências
- [Glossário acadêmico](../CONTEXT.md)
- [Especificação de matrícula e ciclo](../../.scratch/matricula-e-ciclo/spec.md)
- [ADR 0006 — Matrícula pendente e ativação explícita](../adr/0006-matricula-pendente-e-ativacao-explicita.md)
- [ADR 0007 — Calendário e progressão por oferta](../adr/0007-calendario-e-progressao-por-oferta.md)
- [ADR 0011 — Operação SUPER_ADMIN e auditoria de plataforma](../adr/0011-operacao-super-admin-e-auditoria-de-plataforma.md)
