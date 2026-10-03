# ADR 0017 — Dados locais e cursos demonstrativos no MVP
## Contexto
O escopo anterior previa importar catálogos e-MEC durante a operação do MVP e excluía cursos técnicos. Para validar o fluxo acadêmico agora, o projeto precisa de cursos e matérias representativos sem depender de novas integrações nem sugerir que exista uma matriz curricular nacional uniforme.
## Decisão
- A fonte oficial local de escolas de Educação Básica será o CSV INEP já fornecido no projeto.
- `tests/fixtures/catalog-listing.sqlite` é somente fixture de referência; `tests/fixtures/academic-scenario.sqlite` contém os tenants/cursos/matérias demonstrativos. Ambos são separados do banco operacional e abertos read-only pelas suítes de consulta.
- Não haverá integração ou importação e-MEC na operação do MVP. Registros de IES e ofertas já presentes na base SQLite continuam disponíveis como fixture local. Instituições que precisem operar fora desses cenários podem ser cadastradas manualmente no sistema.
- Dados de referência não criam tenants, cursos operacionais, PPC, disciplinas, vínculos ou matrículas. Cursos e matérias operacionais são criados no tenant explicitamente selecionado.
- Inclui-se no MVP um cenário com Ensino Fundamental, Ensino Médio, Técnico em Administração e Bacharelado em Administração. Cursos e matérias desse cenário são exemplos demonstrativos, editáveis por instituição e não substituem o projeto pedagógico/currículo aprovado de um tenant.
- Cursos técnicos de nível médio entram no escopo educacional como categoria explícita, separada das etapas Fundamental e Médio e da graduação. Formas integrada, concomitante e subsequente não serão inferidas do tipo de curso; a forma da oferta fica para a configuração acadêmica aplicável.
- As integrações externas adicionais, inclusive sincronização automática de IES/cursos, ficam para uma etapa pós-MVP que exigirá nova decisão.
## Referências para dados e exemplos
- INEP: dados abertos e Sinopse Estatística da Educação Básica, que organiza as etapas/modalidades e a cobertura escolar usada pelos cenários: <https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/educacao-basica>.
- MEC/CNE: BNCC para componentes e áreas da Educação Básica: <https://www.gov.br/mec/pt-br/escola-em-tempo-integral/BNCC_EI_EF_110518_versaofinal.pdf> e <https://www.gov.br/mec/pt-br/cne/bncc_ensino_medio.pdf>.
- LDB compilada: Ensino Fundamental de nove anos, Ensino Médio com duração mínima de três anos e formas articulada/subsequente da educação técnica: <https://www.planalto.gov.br/ccivil_03/leis/l9394compilado.htm>.
- MEC, Catálogo Nacional de Cursos Técnicos, 4ª edição: Técnico em Administração, eixo Gestão e Negócios, carga horária mínima de 800 horas e perfil profissional: <https://www.gov.br/mec/pt-br/acesso-a-informacao/institucional/estrutura-organizacional/orgaos-especificos-singulares/secretaria-de-educacao-profissional/catalogos-nacionais-de-cursos/CNCT_catalogogerado2022_2023.pdf>.
- MEC: Cadastro e-MEC é a base oficial nacional de instituições e cursos superiores; para este MVP, Administração será referenciada pelo registro já presente no fixture SQLite, sem integração em execução: <https://www.gov.br/mec/pt-br/politica-regulacao-supervisao-educacao-superior/cadastro-nacional-de-cursos-e-ies>.
- Os componentes escolhidos para cursos técnicos e de graduação no cenário de teste são demonstrativos; catálogos/diretrizes oficiais informam denominação, perfil e eixos, mas não definem uma matriz única de disciplinas para todas as instituições.
## Consequências
- A aplicação não precisa chamar fontes externas para montar ou testar o cenário padrão.
- A suíte de catálogo segue read-only e separada de qualquer fixture que contenha dados acadêmicos operacionais.
- O modelo de escopo institucional representa formação técnica de nível médio explicitamente, distinta de Ensino Médio regular e graduação.
- As suítes verificam que seed local não toca a base operacional, não cria auditoria e não realiza matrícula.
- A ADR 0016 e a especificação anterior de importação e-MEC ficam atualizadas por esta decisão; a evolução futura de integrações não é cancelada, apenas retirada do MVP.
