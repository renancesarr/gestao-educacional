# 01 — Definir conteúdo e ciclo de vida do histórico acadêmico

**What to build:** especificar quais fatos compõem um histórico e como se comportam as operações de criar, consultar, editar e excluir, sem pressupor geração ou validade oficial.

**Blocked by:** None — decision work can start immediately.

**Priority:** 1

**Status:** ready-for-human

- [x] Campos e granularidade: uma linha manual por componente/período com origem, curso, ano/período, componente, carga horária, nota/conceito e faltas opcionais, resultado e observações.
- [x] Conteúdo preenchido manualmente; nenhum cálculo ou composição automática.
- [x] Vínculo obrigatório com pessoa do tenant; matrícula, curso operacional e matéria atual não são exigidos. Curso e componente históricos são rótulos textuais.
- [x] Operações feitas pelo `SUPER_ADMIN` com tenant-alvo explícito; edição e exclusão físicas permitidas.
- [x] Histórico é um registro acadêmico manual, não uma credencial nem documento oficial.

## Comments

O usuário confirmou o CRUD no MVP. O contrato mínimo escolhido para transferência manual está na ADR 0021.

Contrato mínimo adotado para permitir transferência manual no MVP a pedido do usuário; registrado na ADR 0021.
