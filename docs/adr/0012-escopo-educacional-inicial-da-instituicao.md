# Escopo educacional inicial da instituição

**Escopo atualizado pela ADR 0016:** a exigência de gravação transacional das auditorias fica fora do MVP atual; cadastro institucional e escopo educacional permanecem no recorte.

O cadastro institucional existente registra apenas código e nome, o que não descreve os contextos educacionais necessários para validar o futuro catálogo de cursos. Decidimos que o `SUPER_ADMIN` declara o escopo educacional durante a criação da instituição na aplicação. Uma instituição pode oferecer Educação Básica, Educação Superior ou ambas; no MVP, Educação Básica cobre Ensino Fundamental e Ensino Médio, com EJA como modalidade ligada a cada etapa, enquanto Educação Superior cobre graduação. Educação Infantil permanece fora do MVP.

O escopo acompanha o tenant e é gravado na mesma transação do cadastro da instituição e do primeiro `TENANT_ADMIN`. Assim, uma operação não deixa uma instituição parcialmente provisionada nem um escopo solto de seu tenant. O catálogo futuro de cursos deve respeitar esse escopo. CNPJ, endereço, manutenção posterior do escopo e preenchimento de instituições preexistentes sem escopo ficam fora desta decisão. O registro de auditoria foi retirado desta operação do MVP pela ADR 0016; permanece requisito do sistema completo.
