# 03 — Associar uma instituição pública a um tenant

**What to build:** O `SUPER_ADMIN` consegue associar explicitamente um tenant a um registro público do INEP ou do e-MEC e, para uma escola básica associada, aplicar seu escopo publicado ao tenant.

**Blocked by:** 01 — Importar o catálogo público de escolas do INEP; 02 — Importar instituições, cursos e atos do e-MEC.

**Status:** wontfix

- [ ] A associação é opcional, explícita e identifica o tenant-alvo; instituições locais sem correspondência pública continuam operáveis sem associação.
- [ ] O `SUPER_ADMIN` consegue pesquisar registros das duas fontes e associar ou alterar a associação por ação explícita, sem criar tenant ou conta institucional.
- [ ] Uma ação separada permite aplicar etapas/modalidades INEP ao escopo local de uma escola associada, usando somente valores suportados pelo domínio atual.
- [ ] Nova versão global não altera associações nem escopos locais automaticamente; registros públicos escolares não criam cursos de graduação.
- [ ] A associação e a aplicação de escopo respeitam autorização global no servidor e são verificáveis pelo fluxo administrativo.
- [ ] Testes unitários exercitam o serviço público do catálogo com stores em memória; integração verifica persistência SQLite, isolamento do tenant-alvo e que importar uma versão global não modifica dados locais.

## Comments

Não faz parte do fluxo aprovado pela ADR 0016. O catálogo importado é uma referência consultável e não precisa ser associado a tenant. Não implementar este ticket no MVP atual.

Revisão após ADR 0016: o escopo confirmado exige que os registros importados estejam disponíveis para consulta. Associação com tenant e aplicação de escopo local não foram confirmadas como necessárias para esse fluxo; manter fora da implementação até nova triagem.
