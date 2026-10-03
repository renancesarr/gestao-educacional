# Cadastro inicial da instituição e escopo educacional
Status: ready-for-agent
Esta especificação isola as responsabilidades do módulo `institution` no onboarding global. O fluxo de identidade `SUPER_ADMIN` e a coordenação da operação permanecem especificados em [onboarding-super-admin](../onboarding-super-admin/spec.md); a criação institucional foi implementada no ticket [03](../onboarding-super-admin/issues/03-cadastrar-instituicao-pela-aplicacao.md).
## Problem Statement
Uma instituição precisa existir como fronteira independente de dados antes que a plataforma possa configurar seu catálogo acadêmico. Código e nome, sozinhos, não informam quais percursos educacionais podem ser cadastrados. Sem um escopo vinculado ao tenant, o sistema não consegue limitar o catálogo futuro ao que a instituição declarou oferecer.
## Solution
No onboarding autenticado da plataforma, criar a instituição/tenant e registrar seu escopo educacional inicial. O `SUPER_ADMIN` declara o escopo e realiza as operações institucionais da validação do MVP antes de a instituição começar a configurar cursos. A operação é atômica e a instituição criada não pode receber `tenantId` escolhido pelo cliente.
O escopo inicial aceita uma ou mais opções: Ensino Fundamental, Ensino Fundamental com EJA, Ensino Médio, Ensino Médio com EJA e graduação. Fundamental e Médio podem coexistir com graduação. Educação Infantil não faz parte do MVP.
## User Stories
1. Como `SUPER_ADMIN`, quero criar uma instituição com código e nome para estabelecer sua fronteira independente na plataforma.
2. Como `SUPER_ADMIN`, quero declarar Ensino Fundamental, Ensino Médio ou ambos para registrar as etapas de Educação Básica que a instituição oferece.
3. Como `SUPER_ADMIN`, quero declarar EJA associada ao Fundamental e/ou ao Médio para distinguir essa modalidade da etapa de ensino.
4. Como `SUPER_ADMIN`, quero declarar graduação para habilitar o escopo de Educação Superior da instituição.
5. Como `SUPER_ADMIN`, quero combinar escopos de Educação Básica e Superior quando a instituição oferecer ambos.
6. Como `SUPER_ADMIN`, quero que o cadastro recuse escopo ausente, vazio, repetido ou fora do MVP para evitar cadastros ambíguos ou não suportados.
7. Como `SUPER_ADMIN`, quero operar uma instituição-alvo depois de seu cadastro sem configurar contas ou permissões internas durante a validação do MVP.
8. Como responsável pela segurança, quero que o tenant seja derivado da operação autenticada e nunca de um `tenantId` enviado pelo cliente para preservar o isolamento.
9. Como responsável pela integridade dos dados, quero que instituição, escopo e conta inicial sejam persistidos atomicamente para impedir provisionamento parcial.
10. Como responsável pela consistência institucional, quero que a tentativa de reutilizar um código de instituição não altere os dados nem o escopo existentes.
11. Como operador da plataforma, quero que o onboarding não solicite CNPJ ou endereço enquanto esses dados não forem definidos como requisito do cadastro acadêmico.
12. Como equipe responsável pelo catálogo futuro, quero consultar o escopo vinculado à instituição para limitar os cursos aos percursos educacionais declarados.
## Implementation Decisions
- `institution` é responsável pelo cadastro institucional e pela definição/validação do escopo educacional. `super_admin` autentica, autoriza e coordena a operação global. A delegação para contas institucionais fica fora da validação do MVP.
- Regras e contratos do domínio não dependem de um mecanismo específico de persistência. Serviços dependem de portas de armazenamento; cada tecnologia implementa seu adaptador, incluindo consultas, transações, restrições e migrações próprias.
Suportar outro banco exige adaptador e verificações de integração próprios; esta decisão não promete que qualquer mecanismo satisfaça automaticamente os requisitos de transação, unicidade e isolamento.
- Um tenant corresponde a uma instituição/unidade individual. Todo dado institucional futuro deve respeitar `tenantId` resolvido no servidor.
- O escopo educacional é composto por itens canônicos de Educação Básica (etapa Fundamental ou Médio, com modalidade EJA opcional) ou Educação Superior (tipo graduação). EJA é modalidade ligada a uma etapa e Educação Infantil está excluída.
- Código e nome mantêm os limites vigentes do provisionamento: código em minúsculas com letras, números e hífens, de 2 a 100 caracteres; nome não vazio, até 200 caracteres.
- O escopo é obrigatório no cadastro pela aplicação e gravado com o tenant na mesma transação. A implementação atual ainda provisiona uma conta `TENANT_ADMIN`; ela não representa autoridade institucional durante a validação centralizada e sua remoção ou reaproveitamento é uma mudança de implementação posterior.
- Código duplicado resulta em conflito sem sobrescrita de instituição, escopo ou conta existentes.
- O escopo não é inferido nem preenchido retroativamente para tenants preexistentes. Edição posterior de escopo requer fluxo e autorização próprios.
- O catálogo de cursos deve respeitar o escopo declarado, mas seus campos e relacionamentos não são definidos por esta especificação.
## Testing Decisions
- Bons testes descrevem comportamento observável pelas interfaces públicas e não dependem de métodos privados, ordem interna de chamadas ou detalhes de persistência.
- A suíte HTTP verifica sessão global, autorização, validação do contrato e que o cliente não controla o tenant.
- Testes do adaptador de persistência escolhido devem provar persistência do escopo, não sobrescrita por código duplicado e rollback da transação.
- Os seams usados são os já existentes e exercitados: caso de uso público `createInstitution` para regras de aplicação e `POST /api/platform/institutions` para o contrato HTTP autenticado.
## Out of Scope
- Catálogo e manutenção de cursos, currículos ou componentes curriculares.
- Ofertas educacionais, calendários, ciclos, requisitos de ativação e matrículas.
- Alteração posterior do escopo ou preenchimento de tenants existentes sem escopo.
- CNPJ, endereço, credenciamento, identidade visual ou dados legais não especificados.
- Educação Infantil, pós-graduação, ensino técnico e cursos livres.
- Definir a política do comando legado `npm run db:provision`; até decisão explícita, ele permanece uma via legada que pode criar tenant sem escopo e não habilita automaticamente o catálogo futuro.
- Auditoria das operações institucionais está fora do MVP; permanece requisito do sistema completo, conforme ADR 0016.
- Remover ou reaproveitar a conta `TENANT_ADMIN` hoje provisionada e implementar o acesso centralizado do `SUPER_ADMIN` nas operações institucionais.
## Further Notes
- Glossário: [Gestão acadêmica](../../docs/CONTEXT.md).
- Decisão de escopo inicial: [ADR 0012](../../docs/adr/0012-escopo-educacional-inicial-da-instituicao.md).
- Diretriz de persistência desacoplada: [ADR 0013](../../docs/adr/0013-persistencia-por-adaptadores.md).
- Operação institucional centralizada: [ADR 0014](../../docs/adr/0014-operacao-centralizada-pelo-super-admin-no-mvp.md).
- Especificação global dependente: [Onboarding de instituições por SUPER_ADMIN](../onboarding-super-admin/spec.md).
- Implementação concluída e evidências atuais: [ticket 03](../onboarding-super-admin/issues/03-cadastrar-instituicao-pela-aplicacao.md).
