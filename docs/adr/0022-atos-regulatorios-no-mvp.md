# ADR 0022 — CRUD manual de atos regulatórios no MVP

## Contexto

Instituições e cursos precisam manter os atos regulatórios que serão consultados em operações acadêmicas e documentos. O MVP permite esse cadastro sem importar atos de órgãos externos nem exigir anexos. A matrícula direta e o comprovante de matrícula selecionam atos da instituição e do curso. A integração com histórico e diploma será definida nos fluxos de emissão desses documentos.

## Decisão

- O ato é texto simples associado a uma instituição ou a um curso pertencente ao tenant. O CRUD inicial não possui campo de tipo, autoridade, número separado ou evidência em arquivo/link.
- O status é editado manualmente e admite `ativo`, `vencido`, `suspenso` e `revogado`; o sistema não calcula vencimento.
- Vários atos podem estar vinculados à instituição ou ao mesmo curso. Os fluxos consumidores devem exigir escolha explícita do operador, sem inferir o mais recente.
- Cada edição exige a decisão de preservar a versão anterior ou sobrescrever sem manter aquela versão. Versões preservadas mantêm texto e status independentes, ficam disponíveis para consulta e podem ser escolhidas em novas operações.
- A matrícula direta exige seleção explícita de uma versão do ato da instituição e do curso. Ela grava no próprio registro o texto e status exatos selecionados, mesmo se o ato for depois sobrescrito.
- O comprovante de matrícula ativo exige seleção explícita do ato da instituição e do curso e preserva os textos/status efetivamente usados na emissão. Quando o operador permite emitir com ato vencido, suspenso ou revogado, deve registrar justificativa e responsável no registro da emissão. O comprovante permanece com frente e verso únicos; o limite legível dos textos é validado conforme o layout aprovado.
- Se um dos atos estiver ausente ou tiver status vencido/suspenso/revogado, o operador pode bloquear a matrícula ou permitir a continuidade com justificativa. A operação guarda responsável autenticado, data/hora e motivo junto da matrícula.
- Atos utilizados por matrícula ou documento não podem ser apagados. Uma referência mínima ao ato/versão e à operação é mantida somente para proteger essa restrição de exclusão; isso não cria trilha geral de auditoria.
- O recorte atual entrega CRUD web/API e persistência SQLite, e conecta a seleção/validação de atos à matrícula direta. Comprovante de matrícula consome as seleções conforme especificação de emissão. Histórico e diploma não consomem atos até que seus fluxos sejam especificados.

## Consequências

- O operador consegue transcrever e manter textos regulatórios sem depender de e-MEC ou de outra integração.
- O versionamento opcional conserva versões apenas quando o operador escolhe fazê-lo; correções sem preservação não produzem histórico daquela edição.
- A rastreabilidade da exceção pertence ao registro da matrícula/documento que a autorizou, não a uma tabela genérica de auditoria.
- A integração de atos com histórico e diploma permanece necessária antes de declarar esses fluxos documentais completos.
