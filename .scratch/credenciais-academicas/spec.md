# Credenciais acadêmicas
Status: ready-for-human
## Problem Statement
O MVP precisa permitir criar, consultar, editar e excluir credenciais acadêmicas, inclusive após sua emissão. A validação pública precisa refletir a versão atual e não pode divulgar outros dados do aluno.
## Solution
Construir CRUD de credenciais vinculado a aluno, curso e instituição. Credenciais do MVP são demonstrativas. Editar ou excluir uma credencial já emitida é permitido neste recorte, como exceção temporária ao princípio do sistema completo. O efeito está definido na ADR 0020.
## User Stories
1. Como operador autorizado, quero criar uma credencial acadêmica demonstrativa vinculada a aluno e curso, para registrar um documento acadêmico.
2. Como operador, quero consultar credenciais, para conferir sua situação e os dados associados.
3. Como operador, quero editar uma credencial, inclusive depois de emitida, para corrigir ou atualizar o registro conforme a regra do MVP.
4. Como operador, quero excluir uma credencial, inclusive depois de emitida, para remover um registro conforme a regra do MVP.
5. Como titular ou consultante público, quero validar uma credencial por token, para conferir seu estado sem acessar outros dados acadêmicos do titular.
6. Como responsável pelo documento, quero que a validação pública reflita as alterações e exclusões feitas no CRUD, para não apresentar payload antigo como atual.
7. Como responsável pela privacidade, quero que a resposta pública exponha somente os dados mínimos aprovados, para reduzir a divulgação de dados pessoais.
8. Como instituição, quero que toda credencial demonstrativa seja identificada como tal, para não sugerir emissão oficial ou assinatura real.
9. Como responsável pela segurança, quero que emissão, edição, exclusão e consulta administrativa sejam autorizadas no servidor e limitadas ao tenant, para impedir mudanças cruzadas.
## Implementation Decisions
- `credential` é a fronteira dona do ciclo de vida e da validação de credenciais; integra-se aos fatos acadêmicos por contratos públicos.
- CRUD completo foi confirmado, incluindo edição e exclusão após emissão. A regra de imutabilidade das credenciais emitidas continua válida para o sistema completo, não para este MVP.
- Credenciais do MVP são demonstrativas. Não alegar validade oficial, integração MEC ou assinatura ICP-Brasil real.
- O contrato mínimo é aluno, curso, tipo (`certificado` ou `diploma`) e data de emissão; nome do titular, curso e instituição formam a projeção pública mínima junto com situação, data e indicação demonstrativa.
- Tipo e data de emissão são editáveis; aluno e curso permanecem vinculados. Edição recalcula o hash SHA-256 e troca o token atual; o token anterior retorna 404. Exclusão física também faz o token retornar 404. A URL atual é o destino canônico para eventual QR.
- Não usar revogação e nova emissão como única forma de correção neste MVP, pois isso contrariaria a decisão explícita de permitir editar/apagar credenciais emitidas.
- A rota pública de validação expõe somente a projeção mínima aprovada na ADR 0020, sem acesso a outros dados do aluno.
- Nenhuma operação de credencial grava auditoria neste MVP. A rastreabilidade pertence ao sistema completo.
## Testing Decisions
- Testar CRUD e validação pelo serviço público de credenciais, edição, exclusão, token e isolamento entre tenants.
- Testes HTTP validam autorização e projeção pública mínima definida. A suíte E2E visível percorre emissão, edição/exclusão e validação no navegador.
Usar dados fictícios e nenhuma assinatura externa real.
- Serviço, persistência SQLite, endpoints e tela operativa cobrem o ciclo de vida. Link público atual funciona como destino que pode ser codificado por um QR; a interface não renderiza imagem QR.
## Out of Scope
- Assinatura ICP-Brasil real, integração oficial MEC e validação oficial governamental.
- Imutabilidade obrigatória de credencial emitida neste MVP; essa regra é do sistema completo.
- Auditoria e integração EAD.
## Further Notes
- A ADR 0016 registra a permissão de editar e excluir credenciais emitidas; permanecem abertas as consequências técnicas dessa edição sobre a validação.
- Decisão de ciclo de vida: [ADR 0020](../../docs/adr/0020-ciclo-de-vida-de-credenciais-no-mvp.md). Implementação validada em HTTP, SQLite e E2E visível; a interface apresenta o link, sem renderizar imagem QR.
