> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# 01: Assinatura no cadastro individual de colaboradores

**What to build:** O SUPER_ADMIN entra no sistema, seleciona uma instituição e acessa o cadastro individual do colaborador para administrar sua assinatura PNG. O cadastro apresenta o vínculo administrativo ou acadêmico existente sem transformar um vínculo no outro.

**Blocked by:** None (can start immediately).

**Publicação:** Proposta aguardando aprovação.

- [ ] A navegação normal chega ao perfil individual com titular e instituição identificados.
- [ ] Enviar, consultar, substituir e remover assinatura PNG funciona e persiste após recarregar.
- [ ] PNG inválido e acesso sem autorização ou com referência de outro tenant são rejeitados pelo servidor.
- [ ] Os ativos administrativos existentes continuam acessíveis e vinculados ao mesmo titular, sem duplicação ou perda.
- [ ] A prontidão usa a assinatura do responsável administrativo atualmente designado; trocar responsável não move arquivos.
- [ ] Glossário e instruções da interface distinguem colaborador acadêmico de funcionário administrativo.
- [ ] E2E específico grava login, navegação e upload/substituição na interface; fixture não realiza essas operações antecipadamente.
- [ ] Registrar evidência Red → Green e vídeo do cenário aprovado.
