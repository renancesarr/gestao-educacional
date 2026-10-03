# 01 — Definir efeitos de edição e exclusão de credencial emitida

**What to build:** especificar como edição e exclusão de uma credencial já emitida afetam seu payload, hash, QR Code, token e resultado da validação pública.

**Blocked by:** None — decision work can start immediately.

**Priority:** 1

**Status:** ready-for-human

- [x] Tipo e data de emissão são editáveis; aluno e curso permanecem vinculados. A edição recalcula o hash do conteúdo público.
- [x] Edição gera novo token; o token anterior deixa de validar. O QR Code atual deve apontar para a URL nova.
- [x] Token de credencial excluída retorna `404` genérico, igual a token inexistente ou anterior.
- [x] A projeção pública é situação, tipo, nome, curso, instituição, data de emissão e indicação demonstrativa; nenhum identificador acadêmico é retornado.
- [x] Assinatura ICP-Brasil e validade oficial permanecem fora do MVP.

## Comments

Edição e exclusão após emissão estão confirmadas para o MVP; esta decisão define apenas suas consequências verificáveis.

Decisão tomada para destravar implementação a pedido do usuário e registrada na ADR 0020.
