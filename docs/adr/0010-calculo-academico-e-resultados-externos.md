# Cálculo acadêmico e validação de resultados externos

**Escopo atualizado pela ADR 0016:** a gestão acadêmica interna por CRUD pertence ao MVP; integração com ambiente EAD, ingestão de registros por disciplina e validação de resultados externos ficam para depois.

O sistema recebe registros por disciplina e calcula a situação acadêmica pelas regras da oferta, mantendo a gestão acadêmica responsável pelos registros e resultados sem construir um ambiente de ensino EAD. Resultados finais externos precisam passar por um fluxo de validação antes de fundamentar históricos e certificados, em vez de serem aceitos diretamente como definitivos. A validação é automática como regra geral, enquanto mudanças específicas precisam ser aceitas pelo administrador. Os dados exigidos, os critérios da automação, as mudanças que exigem aceite e o alcance do papel administrativo ainda serão definidos.
