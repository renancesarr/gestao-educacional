# 03 — Configurar assinatura, carimbo e prontidão documental

**What to build:** Cada funcionário mantém sua assinatura manuscrita PNG e seu carimbo individual PNG no próprio perfil. A prontidão institucional verifica os ativos do funcionário atualmente designado como responsável pelos registros acadêmicos.

**Blocked by:** 01 — Configurar perfil documental e marca institucional; 02 — Gerenciar funcionários e responsáveis institucionais.

**Status:** ready-for-human

- [x] Assinatura e carimbo ficam associados explicitamente ao funcionário e podem ser consultados, substituídos ou removidos no cartão/perfil desse funcionário.
- [x] Somente funcionários ativos podem receber novos ativos; assinatura enviada deve ser PNG válido e carimbo deve incluir a instituição e o nome daquele funcionário.
- [x] Upload inválido ou falha de persistência não destrói o ativo válido existente.
- [x] Prontidão documental exige marca, diretor, responsável, assinatura e carimbo válidos.
- [x] A prontidão considera assinatura e carimbo do responsável atual; trocar o responsável por alguém sem os ativos deixa a instituição incompleta.
- [x] Resposta de prontidão indica os requisitos ausentes sem expor conteúdo dos arquivos.
- [x] A interface identifica a assinatura como demonstrativa e informa que ela não possui validação criptográfica; os destinos dos dois QR codes serão integrados nos tickets de emissão documental.
- [x] E2E independente gera/configura carimbo e assinatura, consulta prontidão e grava vídeo de evidência.
