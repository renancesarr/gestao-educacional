# 11 — E2E de pesquisar aluno como super_admin
**What to build:** Após selecionar instituição, a busca aplica filtros aprovados e abre o cadastro; tenant-alvo ausente ou inválido não revela dados de outra instituição.
**Blocked by:** 01 — Executar um E2E por ID de ticket e salvar vídeo.
**Priority:** 1
**Status:** done
**Ticket de origem:** `.scratch/consulta-alunos/issues/01-busca-autenticada.md`
- [x] Existe um spec Cypress independente para este ticket, com uma jornada focada e sem cenários de outros tickets.
- [x] O fluxo usa a interface visível e a fixture/estado-base mínimo; falha claramente se os dados esperados estiverem ausentes.
- [x] O comando seletivo executa só este spec em Electron headed e grava log e vídeo MP4 com o ID deste ticket.
- [x] Assertions verificam CPF, nome, município/UF de nascimento e curso em busca combinada e filtros individuais, abrem o cadastro e confirmam que a consulta não retorna o aluno em outra instituição. Paginação e validações de autorização estão cobertas nos seams HTTP/serviço do ticket de origem.

## Comments

Especificação: [E2E isolado por ticket com vídeo](../spec.md). O comando usa o caminho identificador do ticket de origem e não executa a suíte completa.

Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- consulta-alunos/01-busca-autenticada`. A fixture tem CPF e município/UF fictícios para o aluno; vídeo/log em `logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-54-00-058Z/`.


Evidência 2026-10-03: passou 1/1 com `npm run test:e2e:ticket -- consulta-alunos/01-busca-autenticada`. Vídeo/log em `logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-39-11-958Z/`.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos; a execução isolada registrada em `logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-54-00-058Z/run.txt` terminou com `All specs passed!` e o vídeo `logs/e2e/consulta-alunos/01-busca-autenticada/2026-10-03T10-54-00-058Z/videos/01-busca-autenticada.cy.ts.mp4` existe. O comando por ticket seleciona uma única jornada visível e mantém as evidências locais.
