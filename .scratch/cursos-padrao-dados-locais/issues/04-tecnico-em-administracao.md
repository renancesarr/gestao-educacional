# 04 — Incluir curso técnico demonstrativo no cenário acadêmico
**What to build:** an institution with technical-secondary scope can maintain a Técnico em Administração course and its demonstrative PPC components using local data only.
**Blocked by:** 02 — Preparar cenário acadêmico local e isolado para teste.
**Priority:** 1
**Status:** ready-for-human
- [x] Representar educação profissional técnica de nível médio como categoria explícita, distinta de Fundamental, Médio regular e graduação.
- [x] Validar que uma instituição precisa declarar o escopo técnico antes de cadastrar o curso.
- [x] Criar curso Técnico em Administração usando a denominação oficial do CNCT; as matérias demonstrativas somam no mínimo 800 horas, com distribuição editável e identificada como exemplo.
- [x] Associar matérias exemplo para gestão de pessoas, materiais/produção/serviços, finanças/orçamento, mercado, sistemas de informação e apoio à decisão; não apresentá-las como matriz prescrita pelo MEC.
- [x] Manter formas integrada, concomitante e subsequente como distinções não inferidas pelo curso e fora deste ticket.
- [x] Verificar isolamento por tenant, persistência SQLite, ausência de auditoria, integrações e matrícula automática em testes HTTP/SQLite e Cypress headed.
