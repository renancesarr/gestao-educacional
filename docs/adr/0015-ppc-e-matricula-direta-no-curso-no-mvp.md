# PPC e matrícula direta no curso no MVP

**Escopo atualizado pela ADR 0016:** PPC e matrícula individual direta continuam válidos. A exclusão de notas, frequência, avaliações, históricos e credenciais deixou de valer para o MVP; matrícula em lote continua fora dele.

O MVP adia a entidade oferta educacional. Cada curso passa a conter seu PPC, formado por matérias com carga horária e professores vinculados, e os alunos realizam matrícula diretamente no curso. A oferta será introduzida depois, quando houver necessidade concreta de turmas, calendário coletivo ou progressão individual.

Esta decisão simplifica o caminho inicial de formação sem apagar a distinção futura entre curso e oferta. A ADR 0007 permanece aplicável quando ofertas forem introduzidas, mas não determina o modelo do MVP atual.

Pré-requisitos e ofertas educacionais continuam fora deste recorte. Avaliações, notas, frequência, históricos e credenciais agora fazem parte do escopo geral do MVP pela ADR 0016 e exigem regras e estados próprios.

Professor é uma pessoa cadastrada como colaborador da própria instituição, não um nome livre no PPC.

O cadastro de colaborador cria somente o vínculo profissional com a pessoa no tenant; conta de acesso e permissões de professor são decisões posteriores.

Cada matéria possui carga horária positiva em horas inteiras e um ou mais professores colaboradores. Minutos, créditos e equivalências ficam fora do MVP.
Ela é criada atomicamente com nome, código, carga horária e todos os seus professores colaboradores válidos.
Quando ativa, sua criação ou edição exige ao menos um colaborador ativo; a desativação posterior do colaborador preserva o vínculo e bloqueia novas matrículas até correção.

O código da matéria é único dentro do PPC do curso e pode ser reutilizado em outro curso; ele será a referência futura para frequência, notas e histórico.
O código é imutável; nome, carga horária e professores colaboradores podem ser editados no MVP.

Um curso pode ser criado sem matérias. O PPC é montado em operações posteriores, depois do cadastro dos colaboradores.
Cada curso possui um único PPC implícito no MVP, sem código, versão ou cadastro separado.
Alterações em matérias e professores valem imediatamente para todas as matrículas do curso; o MVP não preserva versões curriculares.

Curso, colaborador e matéria não são excluídos no MVP. Eles possuem o booleano `ativo`, iniciado como verdadeiro e usado para controlar a disponibilidade em operações futuras.
No curso, somente nome e `ativo` podem ser alterados; código e item do escopo educacional são imutáveis.

O colaborador é criado somente com o ID interno de uma pessoa já cadastrada no tenant, sem dados adicionais nem conta de acesso; a operação falha se a pessoa não existir na instituição-alvo. Esse vínculo é o requisito mínimo para professor de matéria.
Cada pessoa possui no máximo um vínculo de colaborador por instituição, reutilizável entre matérias e cursos.
Desativar o colaborador preserva seus vínculos; se deixar uma matéria ativa sem professor ativo, novas matrículas no curso ficam bloqueadas até reativação ou correção da matéria.

A matrícula é direta de uma pessoa existente para um curso. Ela é criada somente com seus IDs internos, possui apenas datas técnicas de criação e atualização e não recebe justificativas ou documentos no MVP. Há no máximo uma matrícula permanentemente por pessoa e curso, mas a pessoa pode estar em cursos diferentes do mesmo tenant. Ela inicia `ativa`; `ativa` pode mudar para `trancada`, `cancelada` ou `jubilada`; `trancada` pode voltar a `ativa`, ser `cancelada` ou `jubilada`; `cancelada` e `jubilada` são estados finais no MVP e não permitem readmissão criando nova matrícula.
Todas essas transições são manuais pelo SUPER_ADMIN, pois o MVP não contém regras acadêmicas para determiná-las automaticamente.

Matrícula exige que o curso tenha ao menos uma matéria com professor colaborador vinculado.
Ela só pode ser criada em curso ativo que possua ao menos uma matéria ativa com colaborador ativo. Desativar curso, matéria ou colaborador preserva as matrículas existentes e bloqueia apenas novas matrículas.
Mesmo sem percurso válido, matrículas existentes podem mudar de estado para permitir sua regularização.

O MVP lista colaboradores pelo nome da pessoa, consulta cada curso com matérias, carga horária e professores, e lista matrículas por curso com filtro opcional de estado, ordenadas pelo nome da pessoa.

Matrícula cria automaticamente o perfil de aluno da pessoa no tenant quando ausente e o reutiliza quando existente.
Esse perfil não cria conta, autenticação ou permissões de aluno no MVP.
Não há cadastro acadêmico separado: o perfil é criado somente como efeito da matrícula.
O perfil de aluno pode coexistir com o vínculo de colaborador da mesma pessoa na instituição.

Auditoria não será implementada em nenhuma operação deste MVP, conforme ADR 0016. O requisito de auditoria do sistema completo permanece.

Matéria tem nome obrigatório de até 200 caracteres e código no padrão `[a-z0-9][a-z0-9-]{1,99}`. Créditos e ementa ficam fora do MVP.
