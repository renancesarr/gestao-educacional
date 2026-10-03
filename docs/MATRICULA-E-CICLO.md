# Matrícula e ciclo acadêmico — entrevista em andamento

Este documento registra decisões de domínio e pendências da evolução acadêmica. Não é uma especificação fechada nem autorização para implementar decisões pendentes. O recorte atual do MVP foi atualizado pela ADR 0016.

## Recorte vigente do MVP

- Matrículas são registradas individualmente pelo site; não haverá registro de matrículas em lote neste MVP.
- Integração com ambiente EAD externo fica para depois do MVP. Os dados mencionados nas decisões anteriores são registros por disciplina e resultados finais externos; a origem e o contrato de integração ainda não foram especificados.
- O MVP inclui CRUD manual de avaliações, notas, frequência, históricos e credenciais, com datas acadêmicas passadas aceitas; os contratos estão nas ADRs 0018, 0020 e 0021 e nas especificações focadas.
- O catálogo de referência usa os dados INEP locais fornecidos para escolas. Os registros de IES/ofertas e-MEC já selecionados ficam em fixture SQLite read-only de teste/demonstração; não há importação ou atualização operacional e-MEC no MVP. Não se criam tenants ou matrículas a partir das referências.
- Alunos podem ser consultados por operadores autenticados e pelo público. Os critérios incluem CPF, nome, município/UF de nascimento e curso; o público recebe apenas nome, curso e instituição.
- Auditoria está fora do MVP, mas permanece requisito do sistema completo.

As decisões confirmadas abaixo sobre ofertas, ciclos, integração, lotes e auditoria descrevem a evolução futura quando não forem explicitamente incluídas neste recorte. Em caso de conflito, ADRs posteriores 0015–0021 e especificações focadas prevalecem sobre esta entrevista histórica.

## Contexto informado

- Escala de referência informada pelo usuário: aproximadamente 1.000 instituições e 2,6 milhões de alunos. Simultaneidade, distribuição por tenant e volume de operações ainda não foram definidos.
- EAD é o principal cenário dos clientes. O domínio deve acomodar vários percursos, sem impor um fluxo único.

## Decisões confirmadas para o domínio futuro

- Calendário de turma ou início e progressão individuais são definidos por oferta; ambos podem coexistir na instituição (ADR 0007).
- **Superada para este MVP:** a proposta anterior de usar importação em lote para registrar matrículas. O canal atual é somente o fluxo individual pelo site.
- Matrícula pendente não habilita participação acadêmica; a ativação é explícita (ADR 0006).
- A secretaria autorizada pode ativar em lote, com validação e resultado por matrícula.
- Importação e ativação em lote processam as matrículas válidas e apresentam pendências por matrícula; correções e reenvios não devem duplicar registros.
- Requisitos de ativação são configurados por oferta, distinguindo os obrigatórios daqueles que admitem exceção autorizada.
- No ciclo individual, a data de início é explícita, definida na ativação e registrada com a versão das regras aplicável. O primeiro acesso pode ocorrer depois.
- A gestão acadêmica é responsável pelos registros e resultados. Construir um ambiente EAD está fora do escopo. A integração para receber registros por disciplina e resultados finais externos está adiada para depois do MVP; nenhum ambiente ou contrato de origem foi definido.
- Exceções exigem autorização própria, motivo e auditoria.
- Administrador institucional atua no próprio tenant; `SUPER_ADMIN` tem atuação global identificada e auditada. Ambos preservam o histórico nas correções (ADR 0005).

- Na importação de um aluno já identificado, os dados novos prevalecem sobre os existentes, preservando a rastreabilidade. Campos preenchidos substituem os anteriores, vazios preservam o existente e exclusões são explícitas. Dados com data de origem anterior são sinalizados; a identificação usa CPF quando disponível e um identificador institucional estável nos demais casos. Nome sozinho não une cadastros. Dados antigos conflitantes passam por revisão manual, cuja decisão prevalece.
- O aluno pode ter matrículas em escolas diferentes, mas não simultâneas na mesma escola, mesmo em ofertas diferentes. **Esta regra pertence à evolução com ofertas e ciclos e não altera o recorte atual de matrícula direta.**
- A secretaria pode registrar início retroativo com permissão específica e justificativa, usando a versão vigente na data informada. Se essa versão não estiver cadastrada, a operação fica pendente de regularização.
- Para a integração futura, os registros externos mencionados são registros por disciplina e resultados finais que passariam por validação antes de fundamentar históricos e certificados. Integração e validação automática estão fora do MVP atual.

- Conclusão de disciplina, conclusão de ciclo e conclusão de curso são fatos distintos, que podem ocorrer em momentos diferentes. Cada oferta pode organizar ciclos em módulos, semestres, anos ou um único ciclo para o curso inteiro.
- A validação de resultados externos é automática como regra geral; mudanças específicas precisam ser aceitas pelo administrador. Os critérios da automação, o conjunto dessas mudanças ainda precisam ser detalhados. O ADMIN mencionado pelo usuário é o administrador global, correspondente ao SUPER_ADMIN, com poder de alteração em todas as instituições.

- A decisão humana prevalece sobre a importação: dados decididos manualmente não podem ser substituídos automaticamente. A forma de tratar divergências posteriores ainda precisa ser definida.
- O CPF é tratado de forma independente em cada escola: o mesmo CPF em outra instituição não vincula cadastros nem propaga alterações. O ADMIN pode sobrescrever os dados do cadastro identificado pelo CPF na escola selecionada, preservando a auditoria. A proposta de união de cadastros foi retirada.
- No retorno do trancamento, usa-se o cadastro atualizado e mantêm-se as regras originais do ciclo, salvo alteração explícita pelo ADMIN (SUPER_ADMIN). A troca de versão preserva motivo e auditoria, conforme a ADR 0003.
- A pergunta sobre progressão automática foi rejeitada pelo usuário; nenhuma automação de conclusão ou início de ciclo foi aprovada.

- A decisão explícita do ADMIN é final: a proposta de prévia de recálculo com confirmação adicional foi rejeitada. O alcance de eventual recálculo sobre resultados anteriores não foi definido por essa resposta. Auditoria, embora mantida para o sistema completo, está fora do MVP atual.

## Decisões ainda abertas para o domínio futuro

- Fonte e contrato do catálogo de cursos.
- Campos exatos exibidos nas consultas públicas de alunos e a definição da localização pesquisável (residência do aluno ou outra localização).
- Modelos, validações e regras de negócio do CRUD de avaliações, notas, frequência, históricos e credenciais.
- Fonte e contrato da integração acadêmica externa futura, incluindo quais sistemas enviam registros por disciplina e resultados finais.
- Reconhecimento de reenvios e identificação de matrículas; tratamento do CPF posteriormente informado para cadastro com identificador institucional.
- Campos abrangidos pela sobrescrita administrativa e tratamento operacional de importações que divergem de uma decisão humana, sem substituí-la automaticamente.
- Requisitos concretos para ativação e quem pode configurar ou autorizar suas exceções.
- Datas futuras de início; fluxo de regularização de versões históricas ausentes.
- Dados por disciplina necessários ao cálculo e fluxo de validação de resultados finais externos; responsabilidade pela conclusão.
- Transições de trancamento, retorno, cancelamento e conclusão; efeito de correções após o encerramento.
- Carga operacional esperada e critérios de desempenho.

As recomendações feitas na entrevista só passam a decisões após confirmação do usuário. As decisões de escopo vigentes estão consolidadas na ADR 0016.
