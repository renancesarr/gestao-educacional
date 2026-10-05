# ADR 0023 — Perfil institucional e responsáveis documentais no MVP

## Contexto

A emissão de documentos acadêmicos depende de identidade visual e de funcionários designados pela instituição. O modelo atual guarda nome e código institucional, mas não representa marca, funcionário administrativo, diretor, responsável pelos registros acadêmicos ou seus ativos de assinatura.

## Decisão

- Cada instituição pode existir enquanto incompleta, mas só fica pronta para emissão quando possuir marca, diretor ativo, responsável ativo pelos registros acadêmicos, assinatura PNG e carimbo PNG válidos.
- Funcionário é um vínculo de uma pessoa existente do tenant à instituição, com indicação de vínculo ativo e escopo administrativo. Não se mistura com o vínculo de colaborador acadêmico usado em matérias.
- Há no máximo um diretor e um responsável atual por instituição. Ambos devem ser funcionários ativos do escopo administrativo. Podem ser a mesma pessoa.
- A identidade visual é enviada pela instituição em PNG ou SVG. O sistema não infere rede administrativa pelo arquivo nem escolhe brasões automaticamente.
- O cabeçalho padrão posiciona o Selo Nacional à esquerda, dados institucionais ao centro e marca institucional enviada à direita. A marca d'água usa a marca institucional no canto inferior direito com opacidade de 10%.
- Assinatura manuscrita e carimbo PNG são ativos do perfil individual de cada funcionário administrativo; o carimbo identifica a instituição e o funcionário.
- A prontidão verifica os ativos do funcionário ativo atualmente designado como responsável pelos registros acadêmicos. Alterar o responsável altera quais ativos contam para a prontidão, sem mover ou copiar os ativos pessoais dos funcionários.
- A assinatura digital do MVP é demonstrativa; não há criptografia, certificado, chave privada, validação de assinatura ou alegação de autenticidade oficial.
- Cada documento consome os dados e ativos do perfil na sua própria operação de emissão. O perfil não substitui o registro imutável do conteúdo e atos usados em uma emissão.
- O MVP implementa esse fluxo por `SUPER_ADMIN` autenticado com instituição-alvo explícita e persistência SQLite. Auditoria continua fora do MVP.

## Consequências

- A configuração institucional pode ser preparada antes de haver um fluxo de emissão; consultas de prontidão tornam as lacunas visíveis.
- Desativar um funcionário designado torna o perfil incompleto e exige nova designação antes de emitir novos documentos.
- O futuro fluxo do comprovante usa o Selo à esquerda e a marca institucional à direita, além dos dois QR codes internos previamente decididos; o QR de assinatura apenas representa a simulação.
- A marca, assinatura e carimbo são ativos tenant-scoped e devem ser entregues somente após autorização adequada.
- A emissão de comprovante deve selecionar e preservar os atos da instituição e do curso usados, em alinhamento com o modelo aprovado.
