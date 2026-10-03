# 02 — Preparar cenário acadêmico local e isolado para teste

**What to build:** a test database can demonstrate school and higher-education courses using existing local records, separated from the read-only catalog fixture and the operational database.

**Blocked by:** None — can start immediately.

**Priority:** 1

**Status:** ready-for-human

- [x] Criar fixture acadêmico SQLite separado do catálogo read-only e do banco operacional.
- [x] Copiar de forma determinística uma escola e uma IES/oferta representativas disponíveis nos dados locais aprovados; escola usa código e rótulos INEP e a graduação Administração resolve uma oferta já existente no fixture atual.
- [x] Criar apenas entidades de tenant/cadastro no banco de cenário de teste, com IDs operacionais próprios e sem modificar origem/catalog-listing.sqlite.
- [x] Criar colaborador fictício e ativo para permitir associar matérias do PPC sem depender de pessoas reais.
- [x] Construir a fixture uma vez por comando de preparação explícito; a execução normal das suítes de listagem/E2E apenas consulta a fixture read-only.
- [x] Tornar a preparação idempotente e registrar fonte, edição/versão e contagens esperadas para validação reproduzível.
- [x] Provar integridade SQLite, isolamento dos arquivos de fixture e ausência de matrícula automática, chamadas de rede e auditoria.
- [x] Nunca apagar ou substituir o banco operacional nem outros arquivos SQLite fora do fixture de cenário autorizado.

**Implementado:** preparação explícita e idempotente criou `academic-scenario.sqlite` (2 tenants, 5 cursos, 35 matérias, zero matrículas/eventos de auditoria), com manifesto de fonte e contagens. O E2E consulta o banco read-only; o teste SQLite compara o hash da origem e valida integridade.
