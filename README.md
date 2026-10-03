# Documentação do projeto
Comece pela visão do produto e consulte o vocabulário antes de trabalhar nas regras acadêmicas.
| Documento | Finalidade |
| --- | --- |
| [IDEIA.md](docs/IDEIA.md) | Princípios, visão e limites do MVP; em validação. |
| [CONTEXT.md](docs/CONTEXT.md) | Vocabulário compartilhado do domínio. |
| [AGENTS.md](docs/AGENTS.md) | Instruções de trabalho para agentes em todo o projeto. |
| [adr/](docs/adr/) | Decisões arquiteturais e seus motivos. |
| [ADR 0016](docs/adr/0016-escopo-atual-do-mvp.md) | Recorte vigente do MVP, incluindo matrícula individual, catálogos, CRUDs acadêmicos e auditoria adiada. |
| [REVISAO-TICKETS.md](docs/REVISAO-TICKETS.md) | Passo a passo para revisar tickets entregues, aceitar ou pedir correções e atualizar o status. |
| [AUDITORIA-DA-PASTA.md](docs/AUDITORIA-DA-PASTA.md) | Inspeção de acessos e uso do verificador de integridade documental. |
O `AGENTS.md` da raiz encaminha para as instruções completas desta pasta. Os documentos de produto e domínio têm sua fonte em `docs/`.
Quando especificações ou planos anteriores divergirem do escopo vigente, prevalece a ADR 0016; documentos anteriores mantêm valor histórico e decisões de domínio futuro que não foram substituídas.
Para conferir a integridade documental, execute na raiz:
```sh
python3 scripts/auditar_markdown.py check
```
Configuração das skills: [tarefas](docs/agents/issue-tracker.md), [triagem](docs/agents/triage-labels.md) e [documentação de domínio](docs/agents/domain.md).
## Desenvolvimento
O baseline executável usa SQLite e cobre o fluxo `SUPER_ADMIN` de instituição, pessoas, colaboradores, cursos, PPC/matérias e matrícula individual, além de buscas, catálogo local e CRUDs acadêmicos. O recorte ampliado do MVP está definido em [ADR 0016](docs/adr/0016-escopo-atual-do-mvp.md). Para revisar o que foi entregue e decidir se um ticket pode ser aceito, siga [REVISAO-TICKETS.md](docs/REVISAO-TICKETS.md). Use Node.js 24.12 ou superior:
```sh
npm ci
npm run test:unit
npm run typecheck
```
Veja [como configurar o baseline executável](docs/EXECUCAO.md) e [testes e limites da implementação](docs/TESTES.md).
### Frontend Next.js
O frontend do fluxo `SUPER_ADMIN` está em `frontend/` e usa o backend existente pelo proxy `/api/*`. Inicie o backend em `http://127.0.0.1:3001` com a origem pública `http://localhost:3000`, depois rode:
```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```
O primeiro acesso aceita login por passkey ou ativação por código de uso único. A conta global precisa ser provisionada pelo operador local; o cadastro de instituição exige informar os dados da primeira conta institucional. Para validar o pacote sem servidor ou banco, use `npm test`, `npm run lint` e `npm run typecheck`; `npm run build` valida a compilação de produção.
O E2E em Cypress sobe automaticamente o Next.js e um backend SQLite em memória com dados fictícios. Ele simula somente a chamada ao autenticador WebAuthn para testar ativação e novo login sem exigir dispositivo físico:
```sh
cd frontend
npm run test:all
```
`npm run test:all` salva a saída em `logs/log-teste-<timestamp>.txt` e abre o navegador visível durante o E2E.
