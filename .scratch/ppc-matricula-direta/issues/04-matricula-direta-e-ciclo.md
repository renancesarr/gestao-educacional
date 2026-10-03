# 04: Matricular aluno diretamente no curso
**What to build:** O `SUPER_ADMIN` matricula uma pessoa existente diretamente em curso elegível, cria ou reutiliza seu perfil acadêmico sem conta de acesso, consulta matrículas do curso e opera manualmente o ciclo acadêmico aprovado.
**Blocked by:** 03: Compor e manter o PPC do curso.
**Status:** done
- [x] A matrícula recebe somente os IDs internos da pessoa e do curso, inicia em `ativa` e possui apenas datas técnicas de criação e atualização.
- [x] A criação exige curso ativo com matéria ativa e professor colaborador ativo, cria ou reutiliza perfil acadêmico no mesmo tenant e recusa referências cruzadas.
- [x] Curso, matéria ou colaborador inativo impedem novas matrículas; desativação não altera matrícula existente e não impede suas transições de estado.
- [x] Uma pessoa possui no máximo uma matrícula histórica por curso; pessoa e colaborador podem coexistir sem criar contas ou permissões.
- [x] As transições manuais permitidas são `ativa` para `trancada`, `cancelada` ou `jubilada`, e `trancada` para `ativa`, `cancelada` ou `jubilada`; `cancelada` e `jubilada` são finais.
- [x] Inelegibilidade posterior do curso ou PPC bloqueia somente novas matrículas e não impede regularizar matrículas existentes.
- [x] A listagem por curso é ordenada pelo nome da pessoa e aceita filtro opcional de estado, sempre limitada à instituição-alvo.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/ppc-matricula-direta/04-matricula-direta-e-ciclo/2026-10-03T11-06-14-228Z/run.txt`) e produziu o vídeo `logs/e2e/ppc-matricula-direta/04-matricula-direta-e-ciclo/2026-10-03T11-06-14-228Z/videos/04-matricula-direta-e-ciclo.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
