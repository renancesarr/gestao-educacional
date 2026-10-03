# 02: Cadastrar e gerenciar colaboradores institucionais
**What to build:** O `SUPER_ADMIN` vincula uma pessoa existente da instituição-alvo como colaboradora, consulta colaboradores pelo nome da pessoa e ativa ou desativa o vínculo sem criar conta, login ou permissões institucionais.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] A criação recebe somente o ID interno de pessoa e recusa pessoa ausente ou pertencente a outro tenant.
- [x] O serviço `academic` valida a pessoa pela consulta pública já existente de `people`, injetada pela composição da aplicação; não acessa internals nem cria uma rota de leitura duplicada.
- [x] Uma pessoa possui apenas um vínculo de colaborador por instituição e esse vínculo inicia ativo.
- [x] A listagem é restrita à instituição-alvo, ordenada pelo nome da pessoa e inclui a disponibilidade do vínculo.
- [x] Ativação e desativação preservam o vínculo e não criam ou alteram conta de acesso.
Unitários usam leitor público em memória isolado por tenant.
