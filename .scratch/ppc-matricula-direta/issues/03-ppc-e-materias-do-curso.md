# 03: Compor e manter o PPC do curso
**What to build:** O `SUPER_ADMIN` monta o PPC implícito de um curso ativo ao criar matérias com carga horária e colaboradores-professores, consulta o detalhe do curso e mantém matérias sem versionamento curricular ou exclusão física.
**Blocked by:** 01: Evoluir o ciclo de vida do curso; 02: Cadastrar e gerenciar colaboradores institucionais.
**Status:** ready-for-human
- [x] A criação atômica de matéria exige nome válido, código único no curso, carga horária inteira positiva e um ou mais colaboradores do mesmo tenant.
- [x] A criação e edição do PPC são recusadas quando o curso está inativo.
- [x] Matéria ativa exige pelo menos um professor colaborador ativo; colaboradores múltiplos são permitidos.
- [x] Nome, carga horária, professores e `ativo` podem ser alterados; código permanece imutável e pode ser reutilizado apenas em outro curso.
- [x] Desativar colaborador preserva seus vínculos; se deixar uma matéria ativa sem professor ativo, o curso fica inelegível para novas matrículas até correção ou reativação.
- [x] O detalhe do curso retorna matérias, cargas horárias e professores, inclusive registros inativos, e todas as consultas e escritas respeitam a instituição-alvo.
