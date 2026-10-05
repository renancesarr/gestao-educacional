> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# 06: Emissão da declaração com os ativos selecionados

**What to build:** Emitir a declaração demonstrativa de matrícula usando o modelo configurado, assinatura/carimbos e atos escolhidos, com o mesmo resultado da prévia.

**Blocked by:** 01 — Assinatura no cadastro individual de colaboradores; 04 — Áreas de carimbo e prévia da declaração de matrícula.

**Publicação:** Proposta aguardando aprovação.

- [ ] Só matrícula ativa e instituição documentalmente pronta podem emitir; referências e autorização são validadas no servidor.
- [ ] Operador seleciona atos da instituição e curso; ausência/status inativo segue a exceção justificada já decidida, sem auditoria geral.
- [ ] Guardar conteúdo e ativos utilizados na emissão para que mudanças posteriores não alterem o exemplar emitido.
- [ ] Renderização para impressão mantém somente frente e verso; textos que não cabem legivelmente bloqueiam geração com orientação de ajuste.
- [ ] Prévia e emissão usam o mesmo layout, áreas de carimbo, assinatura e marcas.
- [ ] Dois QR reais apontam a caminhos internos distintos: verificação de matrícula e representação da assinatura, sem alegação criptográfica e com dados públicos mínimos.
- [ ] Fluxo não depende do gerador nem do modelo de histórico; PNG enviado é suficiente.
- [ ] E2E emite pela UI com ativos configurados e verifica documento e destinos dos QR, gravando vídeo.
- [ ] Registrar evidência Red → Green e limitações da emissão demonstrativa.
