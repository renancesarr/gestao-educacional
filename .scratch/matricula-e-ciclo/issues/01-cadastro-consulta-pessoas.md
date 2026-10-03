# 01: Cadastrar e consultar pessoa no tenant autenticado
**What to build:** operador profissional entra na instituição, cadastra uma pessoa e a consulta por CPF, identificador institucional ou ID. O sistema limita acesso por permissão e instituição e preserva autoria e data do cadastro.
**Blocked by:** None (can start immediately).
**Status:** ready-for-human
- [x] Login profissional com senha protegida, sessão opaca, expiração e revogação.
- [x] Autorização e tenant derivados da sessão no servidor.
- [x] API e interface de cadastro, busca e consulta de autoria.
- [x] Verificação HTTP com fixture e regressão de auditoria atrasada na interface.
- [x] Concluir verificação visual em 375×812 e 1280×800, incluindo busca sem resultados e ausência de overflow horizontal.
- [ ] Criar commit na branch atual quando o workspace tiver repositório Git válido.
## Comments
Continuação autorizada por `implement`; preferência explícita do usuário por testes unitários isolados mantida. Não declarar o ticket totalmente concluído enquanto as verificações pendentes não tiverem evidência. Docker teve acesso negado; a pasta atual não é um repositório Git válido. A aplicação e a prévia não foram publicadas externamente.
Revisão pela ADR 0016: autoria/auditoria aqui documentadas refletem a implementação histórica, não requisito do MVP vigente. A busca de alunos autenticada e pública está detalhada em [consulta de alunos](../../consulta-alunos/spec.md); remover a auditoria do runtime por ticket próprio.
Verificação visual complementar em 2026-10-03: a busca de alunos agora apresenta estado vazio explícito; Cypress/Electron confirmou dimensões CSS exatas 375×812 e 1280×800 sem overflow horizontal. Capturas em `frontend/cypress/screenshots/platform-journey.cy.ts/`.
Na execução integral seguinte, `npm run test:all` passou incluindo 4 E2E visíveis; log em `logs/log-teste-2026-10-03T09-08-01-777Z.txt`.
