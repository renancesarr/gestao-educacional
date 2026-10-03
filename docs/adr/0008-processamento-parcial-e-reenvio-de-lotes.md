# Processamento parcial e reenvio de lotes de matrícula

**Escopo atualizado pela ADR 0016:** este desenho de lotes pertence à evolução futura. O MVP registra matrículas somente pelo fluxo individual no site.

Importações e ativações em lote processam as matrículas válidas e apresentam as pendências por matrícula, permitindo corrigir e reenviar sem duplicar registros. Escolhemos resultados independentes por matrícula em vez de bloquear todo o lote por um erro individual, para permitir a continuidade da operação em escala. Os critérios para reconhecer reenvios e tratar conflitos com registros existentes ainda serão definidos; a decisão não escolhe tecnologia de processamento nem reduz os requisitos de autorização, isolamento e auditoria.

Quando a importação identifica um aluno já cadastrado e apresenta dados divergentes, os dados novos prevalecem sobre os existentes, mantendo a rastreabilidade da alteração. Campos preenchidos substituem os anteriores, campos vazios preservam o existente e exclusões são explícitas. Dados com data de origem anterior são sinalizados. A pessoa é identificada por CPF quando disponível ou por identificador institucional estável nos demais casos; nome sozinho não une cadastros. Conflitos com dados de origem anterior passam por revisão manual, cuja decisão prevalece. O responsável pela revisão e o efeito sobre importações posteriores ainda serão definidos.

Dados decididos manualmente prevalecem e não podem ser substituídos automaticamente por importações posteriores. O tratamento operacional de novas divergências ainda será detalhado.

O CPF identifica o cadastro no contexto de cada escola, sem vincular ou alterar cadastros de outras instituições. O ADMIN pode sobrescrever os dados desse cadastro na escola selecionada, preservando a auditoria; a proposta de união por CPF foi retirada.
