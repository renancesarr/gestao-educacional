# Atos regulatórios de instituições e cursos

## Decisões aprovadas

- O ato é um texto vinculado a uma instituição ou a um curso da própria instituição. O CRUD inicial não inclui anexos nem tipos/categorias.
- Todo ato tem um status definido manualmente: `ativo`, `vencido`, `suspenso` ou `revogado`.
- Podem existir vários atos para a mesma instituição ou curso; a listagem preserva cada cadastro para seleção explícita pelo operador em fluxos posteriores.
- Em cada edição, o operador escolhe preservar a versão anterior ou sobrescrever a versão vigente sem guardar aquela edição. Versões preservadas mantêm texto e status independentes e podem ser usadas em operações futuras.
- Matrícula guarda separadamente o texto/status da versão selecionada da instituição e do curso. Se faltar ato ou se a versão selecionada estiver vencida, suspensa ou revogada, o operador pode bloquear ou permitir a matrícula com responsável autenticado, data/hora e justificativa registrados nela. Histórico, diploma e comprovante ainda não consomem atos.
- Um ato já usado em matrícula ou documento não pode ser excluído. A edição continua permitida. A matrícula persiste as versões e textos selecionados e mantém vínculos mínimos de uso para impedir exclusão.
- Operações administrativas do MVP são feitas pelo `SUPER_ADMIN`, com instituição-alvo explícita e isolamento por tenant.
- Auditoria geral segue fora do MVP.

## Escopo da entrega atual

- CRUD pelo site e API para atos institucionais e atos de curso.
- Persistência local SQLite.
- Controle de versões por edição, consulta das versões preservadas, seleção de texto/status por versão e bloqueio de exclusão após uso.
- A matrícula integra seleção, validação de status e registro de exceção diretamente no registro da operação; emissão de documentos permanece pendente.
- E2Es independentes abrem Electron visível e gravam vídeo/log para cadastro dos atos e seleção na matrícula.
