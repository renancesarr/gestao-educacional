# Matrícula e ciclo acadêmico — índice vigente

Status: needs-info

Esta especificação antiga de matrícula em lote, integração EAD, ativações, ciclos/ofertas e auditoria como requisito do MVP foi substituída pelas decisões da ADR 0015 e ADR 0016. Não use os requisitos da proposta anterior como trabalho pendente.

## Recorte vigente

- Matrícula individual pelo site, diretamente em curso, conforme [PPC e matrícula direta](../ppc-matricula-direta/spec.md).
- Cadastro e manutenção da instituição e do escopo inicial conforme [instituição](../instituicao/spec.md) e [onboarding do SUPER_ADMIN](../onboarding-super-admin/spec.md).
- Busca operacional e pública de alunos conforme [consulta de alunos](../consulta-alunos/spec.md).
- Matrícula em lote e integração com EAD ficam fora do MVP.
- Auditoria fica fora de todas as operações do MVP; continua requisito do sistema completo.
- Avaliações, notas, frequência, históricos e credenciais estão no MVP e possuem especificações focadas na pasta `.scratch`.

## Decisões que não devem ser inventadas

- Regras de avaliação, nota, frequência e resultado acadêmico.
- Campos públicos retornados na busca de alunos e significado do município/UF do aluno.
- Origem dos dados externos de cursos.
- Semântica de edição/exclusão de histórico e efeito de editar/excluir credencial emitida sobre hash, QR Code e validação.

Pendência significa decisão de produto em aberto, não funcionalidade atrasada. A lista de requisitos antigos foi removida deste índice para evitar conflitar com o escopo aprovado.

## Fontes de precedência

- [ADR 0015](../../docs/adr/0015-ppc-e-matricula-direta-no-curso-no-mvp.md)
- [ADR 0016](../../docs/adr/0016-escopo-atual-do-mvp.md)
- [Visão do projeto](../../docs/IDEIA.md)
- [Glossário](../../docs/CONTEXT.md)
