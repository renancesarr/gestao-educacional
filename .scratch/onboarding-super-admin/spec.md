# Onboarding de instituições por SUPER_ADMIN
Status: ready-for-agent
Especificação consolidada em 2026-09-29 a partir da entrevista `grill-with-docs`, alinhada ao recorte posterior da ADR 0016. Matrículas em lote e auditoria não pertencem ao MVP atual.
## Problem Statement
O provisionamento atual de uma instituição só pode ser feito por um operador com acesso local ao banco. Ainda não existe um fluxo na aplicação para que a plataforma crie outra instituição com seu primeiro administrador. A plataforma também não possui uma identidade global `SUPER_ADMIN`, separada das contas institucionais, com autenticação por passkey.
## Solution
Adicionar a operação global coordenada pelo módulo `super_admin`: o operador local provisiona a primeira conta global e entrega à pessoa responsável um código de ativação de uso único; ela cadastra uma passkey e, a partir daí, acessa a plataforma com nome de usuário global único e passkey/WebAuthn que exige verificação local do usuário. A instituição criada pela aplicação recebe um tenant e seu escopo educacional inicial definido pelo `SUPER_ADMIN`. A implementação atual também provisiona uma conta `TENANT_ADMIN`, mas ela não autoriza operações institucionais enquanto o MVP estiver centralizado no `SUPER_ADMIN`.
Se a pessoa perder todas as passkeys, somente o operador local pode reativar a conta por novo processo controlado. Não há recuperação por e-mail nem administração autônoma de outras contas `SUPER_ADMIN` definida neste recorte.
## User Stories
1. Como operador da plataforma, quero provisionar a primeira conta `SUPER_ADMIN` fora de qualquer tenant para iniciar a operação global.
2. Como operador da plataforma, quero emitir um código de ativação de uso único para a conta inicial para que seu titular cadastre uma passkey sem depender de e-mail.
3. Como titular da conta `SUPER_ADMIN`, quero ativar minha conta com o código e cadastrar uma passkey para começar a operar a plataforma.
4. Como titular da conta `SUPER_ADMIN`, quero entrar com meu nome de usuário global e passkey com verificação local obrigatória para acessar a plataforma sem código de instituição.
5. Como responsável pela segurança, quero impedir operações globais antes que a conta tenha uma passkey cadastrada para que o código inicial sozinho não conceda acesso administrativo.
6. Como operador da plataforma, quero reativar localmente uma conta cujo titular perdeu todas as passkeys para recuperar o acesso sem um fluxo de recuperação por e-mail.
7. Como `SUPER_ADMIN`, quero cadastrar uma instituição com código, nome e escopo educacional para prepará-la para uso.
8. Como `SUPER_ADMIN`, quero selecionar explicitamente a instituição-alvo das operações para preservar o isolamento dos dados sem configurar acesso institucional no MVP.
9. Como responsável pela plataforma, quero que a instituição e os registros obrigatórios sejam criados de forma consistente para evitar instituições parcialmente provisionadas.
10. Como responsável pela plataforma, quero manter conta global e contas institucionais em escopos distintos para que identidades de tenant não ganhem autoridade global.
## Implementation Decisions
- Criar o módulo `super_admin` para coordenar casos de uso globais. `identity` continua responsável por contas, autenticação e autorização; `institution`, pelo contexto institucional.
- Manter regras de domínio e serviços independentes do mecanismo de persistência por contratos/adaptadores.
- A conta `SUPER_ADMIN` não pertence a tenant. O nome de usuário é único na plataforma e serve como identificador; a autenticação exige passkey/WebAuthn com verificação local do usuário. A decisão não declara adoção de nível NIST nem conformidade formal.
- Provisionar a conta inicial por operação local controlada. Entregar um código de ativação de uso único; o código só permite vincular a primeira passkey, não acessar funções globais. Não solicitar e-mail.
- Recuperar perda de todas as passkeys apenas por reativação do operador local, até decisão futura sobre criação e gestão de outras contas globais.
- O cadastro pela aplicação cria a instituição/tenant e seu escopo educacional inicial. O escopo pode combinar Educação Básica (Ensino Fundamental e/ou Ensino Médio, com EJA vinculada a uma etapa) e Educação Superior (graduação). Educação Infantil permanece fora do MVP. Enquanto a validação estiver centralizada, o `SUPER_ADMIN` é a única autoridade para operações institucionais; contas institucionais não recebem esse poder.
- CNPJ, endereço e demais dados legais não entram neste onboarding acadêmico enquanto não forem definidos como requisito.
- Reutilizar os limites de entrada existentes: código em minúsculas com letras, números e hífens (2–100 caracteres); nome não vazio (máximo 200); nome de usuário não vazio (máximo 100); senha inicial entre 12 e 256 caracteres. Código de instituição duplicado não substitui registros existentes.
- Gravar instituição, escopo e conta inicial de forma atômica, sem criar auditoria no MVP. A auditoria continua requisito do sistema completo.
- Não criar fluxo público de criação de tenant. O login institucional existente é legado da implementação atual e não faz parte das operações institucionais da validação centralizada.
- Para testes unitários, exercitar os serviços públicos com armazenamento em memória e tempo/identificadores determinísticos. Os testes verificam resultados observáveis, uso único do código, exigência de passkey, autorização e consistência.
## Testing Decisions
- Seguir TDD em fatias verticais: um teste observável que falha, implementação mínima, execução verde e próxima regra.
- Usar por teste um adaptador de persistência em memória e dependências determinísticas de relógio e identificadores. Testar o protocolo criptográfico WebAuthn separadamente do comportamento do serviço; a suíte unitária não substitui verificações específicas do adaptador, cerimonial HTTP ou dependências criptográficas.
- Cobrir: uso único e rejeição do código de ativação; ausência de acesso antes da passkey; requisito de verificação local; sessão e autorização global; reativação local; validação e duplicidade de código institucional; validação de escopo educacional; criação atômica de instituição, escopo e administrador.
- Priorizar como referência os testes unitários atuais de `identity` e `institution`, que usam contratos públicos e armazenamento em memória.
## Out of Scope
- Matrículas pendentes, ativação de matrícula e seus requisitos ou exceções; essa fase vem depois do onboarding.
- Gestão de múltiplas contas `SUPER_ADMIN`, concessão de papéis globais e recuperação autônoma por outra conta global.
- Delegação de operações para `TENANT_ADMIN`, `ACADEMIC_SECRETARY` ou qualquer outro papel interno da instituição.
- E-mail, entrega eletrônica de código, recuperação por e-mail, credenciamentos e identidade visual institucional.
- Definir requisitos legais ou regulatórios não documentados no projeto.
- Alterar o login institucional existente, credenciais acadêmicas, MFA de contas institucionais, nem afirmar conformidade NIST ou adoção de um AAL.
- Infraestrutura de microserviços, filas externas, publicação ou implantação.
- A auditoria das operações de `SUPER_ADMIN` está fora desta versão do MVP; permanece prevista para o sistema completo.
## Further Notes
- Vocabulário: [glossário](../../docs/CONTEXT.md).
- Decisão arquitetural e de domínio: [ADR 0011](../../docs/adr/0011-operacao-super-admin-e-auditoria-de-plataforma.md).
- Fontes de limites e provisionamento existentes: [execução](../../docs/EXECUCAO.md), [princípios](../../docs/IDEIA.md) e [instruções do projeto](../../docs/AGENTS.md).
