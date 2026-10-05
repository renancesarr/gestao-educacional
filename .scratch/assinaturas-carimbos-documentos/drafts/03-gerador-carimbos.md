> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# 03: Gerador configurável de carimbos

**What to build:** Gerar um carimbo na aplicação, escolher formato quadrado ou redondo, cor e texto, visualizar o resultado e confirmar sua gravação no catálogo.

**Blocked by:** 02 — Catálogo de carimbos PNG.

**Publicação:** Proposta aguardando aprovação.

- [ ] Gerador disponível para carimbos de colaborador, instituição e outros usos.
- [ ] Forma quadrada/redonda e cor escolhidas aparecem na prévia e no PNG salvo.
- [ ] Carimbo individual identifica pessoa e instituição; institucional identifica instituição; outro usa texto informado.
- [ ] Confirmar grava o PNG consultável pelos mesmos contratos do upload.
- [ ] Cancelar criação/substituição não altera o ativo salvo anteriormente.
- [ ] Texto que não pode ser representado legivelmente é rejeitado com orientação de ajuste, sem corte silencioso.
- [ ] E2E escolhe forma, cor e texto pela UI, verifica prévia, cancelamento e gravação e gera vídeo.
- [ ] Registrar evidência Red → Green através da interface pública de exportação e do fluxo do usuário.
