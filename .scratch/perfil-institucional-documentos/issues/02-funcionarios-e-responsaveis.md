# 02 — Gerenciar funcionários e responsáveis institucionais

**What to build:** `SUPER_ADMIN` vincula pessoas existentes do tenant como funcionários administrativos e designa um diretor e um responsável pelos registros acadêmicos. A mesma pessoa pode ocupar os dois cargos.

**Blocked by:** 01 — Configurar perfil documental e marca institucional.

**Status:** ready-for-human

- [x] O CRUD cria, consulta e atualiza vínculos funcionais de pessoas do tenant-alvo.
- [x] Somente funcionário ativo do escopo administrativo pode ocupar cargos documentais.
- [x] Cada instituição possui no máximo um diretor e um responsável por registros acadêmicos atuais.
- [x] Diretor e responsável podem ser a mesma pessoa ou pessoas diferentes.
- [x] Pessoas de outro tenant, duplicidade e funcionários inativos/não administrativos não são aceitos como designados.
- [x] Desativar funcionário designado torna a instituição incompleta para emissão até nova designação.
- [x] A interface lista funcionários e permite definir ambos os cargos.
- [x] E2E independente valida vínculo e designação de funcionário e gera vídeo de evidência.
