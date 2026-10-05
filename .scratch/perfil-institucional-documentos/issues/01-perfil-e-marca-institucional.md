# 01 — Configurar perfil documental e marca institucional

**What to build:** `SUPER_ADMIN` consegue consultar e editar o perfil documental da instituição-alvo e enviar/substituir uma marca PNG ou SVG. O perfil apresenta a identidade que o cabeçalho padrão usará, com Selo Nacional à esquerda e marca da instituição à direita.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

- [x] O acesso exige sessão `SUPER_ADMIN` e `targetTenantId` válido.
- [x] A instituição consulta e substitui sua própria marca PNG ou SVG; o identificador de outro tenant não permite acesso cruzado.
- [x] A instituição pode remover uma marca; o perfil volta a mostrar essa exigência como pendente.
- [x] O servidor valida formato real, tamanho e limites da imagem antes de persistir.
- [x] Uma substituição inválida mantém a marca válida anterior.
- [x] A interface mostra estado vazio, marca atual e mensagens de validação.
- [x] E2E independente verifica envio e consulta do perfil e grava vídeo de evidência.
