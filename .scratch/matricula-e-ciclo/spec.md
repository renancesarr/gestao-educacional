# Matrícula e ciclo acadêmico — índice vigente

Status: ready-for-human

Esta especificação antiga de matrícula em lote, integração EAD, ativações, ciclos/ofertas e auditoria como requisito do MVP foi substituída pelas decisões da ADR 0015 e ADR 0016. Não use os requisitos da proposta anterior como trabalho pendente.

## Recorte vigente

- Matrícula individual pelo site, diretamente em curso, conforme [PPC e matrícula direta](../ppc-matricula-direta/spec.md).
- Cadastro e manutenção da instituição e do escopo inicial conforme [instituição](../instituicao/spec.md) e [onboarding do SUPER_ADMIN](../onboarding-super-admin/spec.md).
- Busca operacional e pública de alunos conforme [consulta de alunos](../consulta-alunos/spec.md).
- Matrícula em lote e integração com EAD ficam fora do MVP.
- Auditoria fica fora de todas as operações do MVP; continua requisito do sistema completo.
- Avaliações, notas, frequência, históricos e credenciais estão no MVP e possuem especificações focadas na pasta `.scratch`.

## Limites do recorte atual

- Não executar matrícula em lote nem integração EAD ou novas integrações externas durante o desenvolvimento do MVP.
- Lançamentos manuais de avaliações, notas e frequência podem usar datas acadêmicas passadas; fórmulas e cálculos automáticos não fazem parte do contrato atual.
- Histórico é transferido manualmente em registros editáveis, sem cálculo ou declaração de documento oficial.
- Credenciais emitidas podem ser editadas ou excluídas no MVP; edição recalcula hash e troca o token de validação conforme ADR 0020.
- Auditoria fica fora das operações do MVP e permanece requisito do sistema completo.

## Fontes de precedência

- [ADR 0015](../../docs/adr/0015-ppc-e-matricula-direta-no-curso-no-mvp.md)
- [ADR 0016](../../docs/adr/0016-escopo-atual-do-mvp.md)
- [Visão do projeto](../../docs/IDEIA.md)
- [Glossário](../../docs/CONTEXT.md)
