# Índice de especificações do MVP de gestão acadêmica
Status: ready-for-agent
## Problem Statement
O escopo decidido do MVP está registrado em ADRs e documentos que cresceram em momentos diferentes. Algumas especificações antigas ainda descrevem auditoria, matrícula em lote, integração EAD e propostas e-MEC não aprovadas como trabalho ativo; também faltavam contratos para consulta de alunos e CRUDs acadêmicos.
## Solution
Usar a ADR 0016 como fronteira vigente do MVP e especificações por fluxo como referência de implementação. Preservar a auditoria como requisito do sistema completo, sem incluí-la em nenhuma operação do MVP. Não promover decisões pendentes a requisitos atrasados.
## User Stories
1. Como responsável pelo produto, quero consultar um índice único do escopo e dos detalhes, para identificar o que já está decidido e o que aguarda decisão.
2. Como implementador, quero que cada fluxo possua uma especificação focada, para entregar fatias completas e verificáveis.
3. Como operador, quero completar pelo site o percurso central de instituição, curso, PPC, pessoa e matrícula individual.
4. Como operador, quero importar e consultar instituições e cursos de referência sem criar tenant ou matricular alunos na referência.
5. Como operador, quero localizar alunos pelos critérios aprovados com acesso autenticado e consulta pública limitada.
6. Como operador, quero gerenciar avaliações, notas e frequência por CRUD.
7. Como operador, quero gerenciar históricos acadêmicos por CRUD.
8. Como operador, quero gerenciar credenciais por CRUD, inclusive após emissão, sem declarar validade oficial.
9. Como responsável pelo sistema completo, quero manter prevista a auditoria futura sem gravar eventos de auditoria nas operações do MVP.
10. Como usuário do desenvolvimento, quero que o E2E abra o navegador visível e que cada execução integral salve seu log, para acompanhar e revisar as verificações.
## Implementation Decisions
- Precedência: ADR 0016 atualiza o recorte de produto; ADRs anteriores continuam válidas quando não conflitam com ela. ADR 0015 mantém PPC e matrícula individual direta no curso.
- Catálogo público: escolas importadas do INEP e IES/cursos de graduação dos CSVs e-MEC em `CSV_DADOS_ABERTOS`. Especializações ficam fora. Referência global não cria tenant, curso local, vínculo de aluno ou matrícula.
- Buscas de instituições: nome; município/UF; nome com município/UF; curso; curso com município/UF.
- Busca de alunos: CPF, nome, município e UF de nascimento e curso; existe para operadores e público. Resposta pública limitada a nome, curso e instituição.
- CRUD de avaliações, notas, frequência, históricos e credenciais pertence ao MVP. Integração EAD fica depois. Regras acadêmicas e efeitos sobre registros emitidos que não foram decididos continuam pendentes.
- Credenciais emitidas podem ser editadas e excluídas no MVP; efeitos em hash, QR Code, token e validação precisam de definição própria.
- Matrícula em lote está fora do MVP. Auditoria de ações também está fora de todo o MVP; a auditoria permanece requisito do sistema completo.
- O fluxo E2E visível, a verificação do endpoint `/health` e o script `npm run test:all` já foram implementados e documentados; cada execução cria `logs/log-teste-<timestamp>.txt`.
- Reutilizar os seams existentes: interfaces públicas de serviço para comportamento de domínio, contratos HTTP para autorização/transporte, adaptadores para persistência e Cypress no navegador para jornadas completas. Não criar seam novo sem necessidade demonstrada.
## Testing Decisions
- Testes observam comportamento público e regras já decididas. Não afirmam regras para decisões em aberto.
- A suíte E2E abre Electron visível. `npm run test:all` é o comando padrão da suíte completa e registra saída por execução.
## Out of Scope
- Matrícula em lote, integração com EAD, oferta/turma/calendário coletivo, associação de catálogo público a tenant, cópia automática de cursos para tenant, atos regulatórios, auditoria no runtime do MVP, assinatura ICP-Brasil real e integração governamental oficial.
- Qualquer regra acadêmica, dado público ou consequência de edição de credencial não aprovada.
## Further Notes
- Catálogo público: [especificação](../catalogo-publico-mec-inep/spec.md).
- Busca de alunos: [especificação](../consulta-alunos/spec.md).
- Avaliações, notas e frequência: [especificação](../avaliacoes-notas-frequencia/spec.md).
- Históricos: [especificação](../historicos-academicos/spec.md).
- Credenciais: [especificação](../credenciais-academicas/spec.md).
- PPC e matrícula direta: [especificação existente](../ppc-matricula-direta/spec.md).
- Escopo autoritativo: [ADR 0016](../../docs/adr/0016-escopo-atual-do-mvp.md).
