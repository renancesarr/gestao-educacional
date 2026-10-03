# 04: Matricular aluno diretamente no curso
**What to build:** O `SUPER_ADMIN` matricula uma pessoa existente diretamente em curso elegível, cria ou reutiliza seu perfil acadêmico sem conta de acesso, consulta matrículas do curso e opera manualmente o ciclo acadêmico aprovado.
**Blocked by:** 03: Compor e manter o PPC do curso.
**Status:** ready-for-human
- [x] A matrícula recebe somente os IDs internos da pessoa e do curso, inicia em `ativa` e possui apenas datas técnicas de criação e atualização.
- [x] A criação exige curso ativo com matéria ativa e professor colaborador ativo, cria ou reutiliza perfil acadêmico no mesmo tenant e recusa referências cruzadas.
- [x] Curso, matéria ou colaborador inativo impedem novas matrículas; desativação não altera matrícula existente e não impede suas transições de estado.
- [x] Uma pessoa possui no máximo uma matrícula histórica por curso; pessoa e colaborador podem coexistir sem criar contas ou permissões.
- [x] As transições manuais permitidas são `ativa` para `trancada`, `cancelada` ou `jubilada`, e `trancada` para `ativa`, `cancelada` ou `jubilada`; `cancelada` e `jubilada` são finais.
- [x] Inelegibilidade posterior do curso ou PPC bloqueia somente novas matrículas e não impede regularizar matrículas existentes.
- [x] A listagem por curso é ordenada pelo nome da pessoa e aceita filtro opcional de estado, sempre limitada à instituição-alvo.
