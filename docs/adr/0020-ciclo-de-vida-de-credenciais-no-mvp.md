# ADR 0020 — Ciclo de vida de credenciais no MVP

## Contexto

O MVP permite editar e excluir credenciais já emitidas. A URL de validação pública não pode continuar apresentando conteúdo anterior depois de uma edição.

## Decisão

- A credencial demonstrativa contém aluno, curso, tipo (`certificado` ou `diploma`) e data de emissão. O nome do titular, curso e instituição são capturados para a projeção pública mínima.
- O hash é SHA-256 do conteúdo público normalizado. A validação pública retorna somente situação, tipo, nome completo, curso, instituição, data de emissão e a indicação de que o documento é demonstrativo.
- Toda edição recalcula o hash e gera novo token de validação; a URL anterior deixa de existir. Um QR Code, se gerado, deve apontar para a URL atual. A interface do MVP apresenta a URL de validação, mas não renderiza a imagem QR.
- Exclusão é física neste MVP. Um token excluído ou antigo retorna `404` com a mesma resposta genérica.
- Credenciais podem ser criadas, consultadas, editadas e excluídas pelo `SUPER_ADMIN` após selecionar explicitamente o tenant. Não há validade oficial, assinatura digital real, cálculo de conclusão nem auditoria.

## Consequências

- O adaptador guarda o token público atual para localizar a credencial; a URL é pública por projeto e não concede acesso a outros dados acadêmicos.
- O fluxo não mantém versões anteriores do conteúdo nem permite recuperar um token invalidado.
- A interface apresenta o link público atual; a geração visual do QR Code fica fora da entrega e não envia tokens a serviços externos.
- A regra geral do sistema completo continua sendo imutabilidade e correção por revogação/nova emissão; esta decisão limita a exceção ao MVP conforme ADR 0016.
