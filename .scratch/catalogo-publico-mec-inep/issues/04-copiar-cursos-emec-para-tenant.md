# 04 — Copiar cursos de graduação do e-MEC para um tenant

**What to build:** Após associar explicitamente uma IES a um tenant, o `SUPER_ADMIN` consegue revisar e executar a cópia em lote dos cursos de graduação elegíveis para o catálogo local.

**Blocked by:** 02 — Importar instituições, cursos e atos do e-MEC; 03 — Associar uma instituição pública a um tenant.

**Status:** wontfix

- [ ] A cópia é iniciada por ação explícita após a associação e mostra uma prévia dos cursos que serão criados e das colisões de código existentes.
- [ ] Cada curso compatível é criado automaticamente no tenant selecionado usando apenas nome, código oficial do e-MEC e escopo de graduação já suportado pelo curso local.
- [ ] Colisões não sobrescrevem cursos locais e exigem resolução explícita; versões novas do catálogo global não atualizam cursos locais automaticamente.
- [ ] Cursos, tipos de graduação, atos e demais detalhes e-MEC continuam consultáveis na referência pública; a cópia não cria conceitos operacionais acadêmicos adicionais.
- [ ] A operação é protegida no servidor, mantém o isolamento do tenant-alvo e pode ser demonstrada no fluxo administrativo.
- [ ] Testes unitários exercitam prévia e cópia pela fronteira pública do serviço com stores em memória; integração SQLite verifica atomicidade, colisões e preservação dos cursos locais.

## Comments

Não faz parte do fluxo aprovado pela ADR 0016. Cursos importados permanecem consultáveis no catálogo de referência; importar não copia curso para tenant nem matricula aluno. Não implementar este ticket no MVP atual.

Revisão após ADR 0016: cursos importados devem estar disponíveis para busca no catálogo de referência. Copiar cursos para o catálogo operacional de um tenant não foi confirmado como parte deste fluxo; manter esta proposta fora da execução até nova triagem.
