# 03: Compor e manter o PPC do curso
**What to build:** O `SUPER_ADMIN` monta o PPC implícito de um curso ativo ao criar matérias com carga horária e colaboradores-professores, consulta o detalhe do curso e mantém matérias sem versionamento curricular ou exclusão física.
**Blocked by:** 01: Evoluir o ciclo de vida do curso; 02: Cadastrar e gerenciar colaboradores institucionais.
**Status:** done
- [x] A criação atômica de matéria exige nome válido, código único no curso, carga horária inteira positiva e um ou mais colaboradores do mesmo tenant.
- [x] A criação e edição do PPC são recusadas quando o curso está inativo.
- [x] Matéria ativa exige pelo menos um professor colaborador ativo; colaboradores múltiplos são permitidos.
- [x] Nome, carga horária, professores e `ativo` podem ser alterados; código permanece imutável e pode ser reutilizado apenas em outro curso.
- [x] Desativar colaborador preserva seus vínculos; se deixar uma matéria ativa sem professor ativo, o curso fica inelegível para novas matrículas até correção ou reativação.
- [x] O detalhe do curso retorna matérias, cargas horárias e professores, inclusive registros inativos, e todas as consultas e escritas respeitam a instituição-alvo.

- **Revisão e aceite (2026-10-03):** aceite registrado a pedido explícito do responsável. Critérios conferidos com a especificação vigente, implementação e evidências de teste; E2E isolado correspondente passou (`logs/e2e/ppc-matricula-direta/03-ppc-e-materias-do-curso/2026-10-03T11-04-37-174Z/run.txt`) e produziu o vídeo `logs/e2e/ppc-matricula-direta/03-ppc-e-materias-do-curso/2026-10-03T11-04-37-174Z/videos/03-ppc-e-materias-do-curso.cy.ts.mp4`. A regressão ampla mais recente passou por unitários, HTTP, SQLite, typechecks, lint e build; o comando agregado também executou os 33 specs em sequência e encontrou 4 falhas de estado compartilhado. Essas falhas não reproduzem nos comandos isolados por ticket e ficam acompanhadas pelo ticket 35 de infraestrutura E2E.
