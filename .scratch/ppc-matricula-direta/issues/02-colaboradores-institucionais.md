# 02: Cadastrar e gerenciar colaboradores institucionais
**What to build:** O `SUPER_ADMIN` vincula uma pessoa existente da instituição-alvo como colaboradora, consulta colaboradores pelo nome da pessoa e ativa ou desativa o vínculo sem criar conta, login ou permissões institucionais.
**Blocked by:** None (can start immediately).
**Status:** done
- [x] A criação recebe somente o ID interno de pessoa e recusa pessoa ausente ou pertencente a outro tenant.
- [x] O serviço `academic` valida a pessoa pela consulta pública já existente de `people`, injetada pela composição da aplicação; não acessa internals nem cria uma rota de leitura duplicada.
- [x] Uma pessoa possui apenas um vínculo de colaborador por instituição e esse vínculo inicia ativo.
- [x] A listagem é restrita à instituição-alvo, ordenada pelo nome da pessoa e inclui a disponibilidade do vínculo.
- [x] Ativação e desativação preservam o vínculo e não criam ou alteram conta de acesso.
Unitários usam leitor público em memória isolado por tenant.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/ppc-matricula-direta/02-colaboradores-institucionais/2026-10-03T11-00-04-169Z/run.txt`) e produziu o vídeo `logs/e2e/ppc-matricula-direta/02-colaboradores-institucionais/2026-10-03T11-00-04-169Z/videos/02-colaboradores-institucionais.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
