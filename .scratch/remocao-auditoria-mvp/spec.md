# Remover auditoria operacional do MVP

Status: ready-for-human

## Problem Statement

O escopo aprovado do MVP exclui a gravação e consulta de auditoria. Quando esta especificação foi criada, o código ainda gravava fatos de pessoas, identidade global e onboarding e expunha consultas de auditoria, em conflito com a ADR 0016; os tickets desta pasta documentam a remoção executada.

## Solution

Retirar gravações, leituras e superfícies HTTP de auditoria da operação do MVP. Preservar o módulo e o requisito da auditoria do sistema completo, bem como os registros antigos e estruturas que possam ser necessários para migração futura; não excluir dados existentes.

## User Stories

1. Como operador do MVP, quero cadastrar pessoas e administrar instituições sem criar trilhas de auditoria, para manter o produto dentro do escopo decidido.
2. Como usuário do MVP, quero que a aplicação não exponha consulta de auditoria em rotas ou interfaces, pois esse fluxo foi adiado.
3. Como responsável pelo sistema completo, quero preservar a fronteira conceitual e os documentos de auditoria, para retomá-la em uma evolução futura.
4. Como responsável por dados existentes, quero preservar as linhas já gravadas e evitar migrações destrutivas, para não descartar informação histórica.

## Implementation Decisions

- Remover do runtime do MVP as escritas tenant-scoped e de plataforma, rotas/DTOs de leitura, permissões exclusivas e dependências de composição que as habilitam.
- Não apagar o módulo conceitual `audit` nem as decisões da auditoria sistêmica. Não dropar tabelas ou apagar registros existentes nesta entrega.
- Operações de criação e onboarding permanecem atômicas para os dados funcionais necessários; sua atomicidade não depende de uma escrita de auditoria.
- Relatórios de proveniência e versões das cargas são metadados do catálogo e não trilhas de ação.

## Testing Decisions

- Exercitar criação de pessoas, identidade global e onboarding pelas interfaces públicas dos serviços e HTTP, garantindo ausência de gravações/superfícies auditáveis.
- Usar SQLite e os testes dos adaptadores para provar persistência funcional após remover a dependência de eventos de auditoria; preservar dados preexistentes na compatibilidade de schema.
- A suíte E2E visível prova que os fluxos existentes continuam operáveis. Não criar testes que dependam de trilha de auditoria no MVP.

## Out of Scope

- Construir a auditoria do sistema completo ou decidir seu mecanismo futuro.
- Apagar registros de auditoria existentes, tabelas ou arquivos históricos.
- Alterar rastreabilidade de arquivo-fonte/versão dos catálogos.

## Further Notes

- Fonte de escopo: [ADR 0016](../../docs/adr/0016-escopo-atual-do-mvp.md).
- O trabalho está dividido por jornadas verticais em dois tickets para manter cada alteração revisável.
- Os tickets 01 e 02 foram implementados e verificados pela suíte integral `npm run test:all`, inclusive E2E visível. Tabelas e módulo sistêmico permanecem preservados.
