# 03 — Criar cursos e matérias demonstrativos de Educação Básica

**What to build:** the local academic scenario supports operational Fundamental and Médio courses with editable example components aligned to official reference areas.

**Blocked by:** 02 — Preparar cenário acadêmico local e isolado para teste.

**Priority:** 1

**Status:** ready-for-human

- [x] Criar `Ensino Fundamental — Anos Iniciais (1º ao 5º ano)` e `Ensino Fundamental — Anos Finais (6º ao 9º ano)` dentro do escopo Fundamental da instituição de teste.
- [x] Vincular matérias demonstrativas coerentes com os componentes/áreas da BNCC para cada segmento; Língua Inglesa aparece nos anos finais; Ensino Religioso fica opcional conforme aplicável.
- [x] Criar `Ensino Médio (1º ao 3º ano)` dentro do escopo Médio e associar matérias de exemplo organizadas pelas quatro áreas oficiais, sem afirmar uma matriz universal.
- [x] Permitir consulta dos cursos e componentes pela instituição/tenant e pelo curso correspondente, sem leitura cruzada entre tenants.
- [x] Validar via serviço público, SQLite e Cypress headed a consulta dos exemplos sem matrículas criadas pelo fixture.
- [x] Indicar na demonstração que a instituição pode editar seus cursos/componentes e que a referência não substitui seu currículo/PPC.

**Implementado:** fixture contém anos iniciais/finais e Ensino Médio com componentes demonstrativos; Electron headed consulta cursos e detalha PPC, e SQLite confirma zero matrículas no seed.
