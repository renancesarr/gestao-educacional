> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# 04: Áreas de carimbo e prévia da declaração de matrícula

**What to build:** Escolher carimbos para áreas nomeadas do modelo padrão e visualizar a declaração de matrícula com essas associações antes de salvar a configuração.

**Blocked by:** 02 — Catálogo de carimbos PNG.

**Publicação:** Proposta aguardando aprovação.

- [ ] Modelo declara áreas nomeadas e categorias aceitas; operador seleciona ativos existentes, sem preencher coordenadas X/Y.
- [ ] Associação persiste e é consultável após recarregar; categorias incompatíveis e ativos de outro tenant são rejeitados pelo servidor.
- [ ] Prévia usa o modelo 2 aprovado, cabeçalho com marcas configuradas e marca-d’água inferior direita a 10%.
- [ ] Preservar frente declarativa e verso para atos completos e dois QR com destinos internos distintos; QR de assinatura identificado como simulação.
- [ ] Carimbos ficam nas áreas previstas sem encobrir conteúdo; ausência ou remoção de ativo gera indicação clara antes da emissão.
- [ ] A configuração apresenta somente dados reais e campos disponíveis; não inventa série/ano letivo ausentes.
- [ ] Contrato de áreas e composição é reutilizável por histórico e demais modelos, sem criar editor livre de HTML ou páginas.
- [ ] E2E seleciona carimbos pela UI, abre a prévia e grava vídeo; o gerador não é pré-requisito.
- [ ] Registrar evidência Red → Green dos contratos públicos e do resultado visual.
