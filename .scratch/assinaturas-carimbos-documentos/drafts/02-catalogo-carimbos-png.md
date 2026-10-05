> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# 02: Catálogo de carimbos PNG

**What to build:** Administrar carimbos enviados em PNG no cadastro do colaborador e no perfil institucional, distinguindo colaborador, instituição e outros usos.

**Blocked by:** 01 — Assinatura no cadastro individual de colaboradores.

**Publicação:** Proposta aguardando aprovação.

- [ ] Cadastrar e listar carimbos com categoria, titular e imagem consultável.
- [ ] Categoria colaborador exige titular da instituição; categoria instituição pertence à instituição selecionada; outro exige identificação.
- [ ] Substituir/remover um carimbo não altera assinatura nem outros carimbos.
- [ ] Os carimbos já existentes são preservados, sem repetir cadastro ou apagar bases SQLite.
- [ ] O responsável administrativo possui seleção explícita do carimbo individual usado na prontidão quando houver várias opções.
- [ ] Servidor valida conteúdo PNG, autorização e isolamento em todas as operações.
- [ ] E2E realiza upload e manutenção de carimbos pela UI e grava vídeo, com fixture apenas do estado-base.
- [ ] Registrar evidência Red → Green e contratos substituíveis entre os adaptadores utilizados.
