# Testes unitários isolados
## Suíte completa disponível
O código atual cobre os fluxos implementados do MVP e não exige auditoria em pessoas, identidade ou onboarding. As operações de auditoria permanecem fora do MVP, e o módulo sistêmico é mantido para evolução futura. A integração de catálogos e-MEC não pertence ao MVP; buscas ampliadas de alunos e CRUDs acadêmicos têm especificações e tickets próprios. Para revisar entregas e atualizar o status dos tickets, siga [REVISAO-TICKETS.md](REVISAO-TICKETS.md).
Com Node.js 24.12 ou superior e dependências instaladas, execute toda a suíte padrão com um comando:
```sh
npm ci
npm --prefix frontend ci
npm run test:all
```
`npm run test:all` executa testes unitários, HTTP e SQLite, typechecks backend/frontend, testes unitários e lint do frontend e, por último, o E2E. Ele para na primeira falha, transmite a saída ao terminal e grava a execução completa em `logs/log-teste-<timestamp>.txt`. Uma nova execução cria outro arquivo. Os logs locais não são versionados.
O E2E visível no navegador é prioridade 1 do fluxo de testes. Ele abre uma janela Electron e percorre o fluxo novo ou alterado a partir de um estado-base de teste preparado e validado. Não repete interativamente o provisionamento do `SUPER_ADMIN`, a criação de instituições ou a criação de cursos que já foram testados. Essa cobertura-base continua disponível e deve ser executada quando esses fluxos forem alterados ou quando uma falha indicar estado-base ausente/incorreto; nessa situação, confira também se a fixture contém os registros esperados. Esta política não remove testes automatizados de regressão unitários, HTTP ou persistência, nem muda o comando completo da suíte. O Cypress inicia Next.js e backend de fixture; ambos precisam disponibilizar `/health` com resposta bem-sucedida antes do teste. O Next encaminha `/health` ao backend.
O comando `npm --prefix frontend run test:e2e` executa somente a jornada institucional-base em Electron visível. `npm run test:all` termina com essa mesma jornada e grava seu resultado em `logs/log-teste-<timestamp>.txt`; ele não executa os specs de ticket em sequência.

## E2E seletivo por ticket

Para validar um ticket funcional, rode o spec independente associado ao ID do ticket de origem. Exemplo:
```sh
npm run test:e2e:ticket -- consulta-alunos/02-busca-publica-limitada
```
O ID é o caminho do ticket sob `.scratch/`, sem `.md`. O runner confere se o ticket está ativo e se existe um único spec em `frontend/cypress/e2e/tickets/<feature>/<NN-ticket>.cy.ts`; executa apenas esse arquivo com Cypress/Electron em modo visível. Um ticket sem spec, inativo ou com execução sem testes falha em vez de aparentar sucesso.

Cada execução cria um diretório exclusivo em `logs/e2e/<feature>/<NN-ticket>/<timestamp>/`, contendo `run.txt` e `videos/<spec>.mp4`. Os logs e vídeos são evidências locais e não devem ser adicionados ao Git. O navegador precisa estar visível durante a execução; ao terminar, o terminal informa os caminhos do log e do vídeo. Para uma mudança rotineira, execute primeiro os testes direcionados do ticket e as verificações unitárias/HTTP/SQLite correspondentes. `npm run test:all` continua reservado para regressão ampla quando necessário.

A cobertura E2E tem 33 specs separados para os fluxos funcionais e um ticket de infraestrutura do runner. Cada spec de ticket é executado individualmente pelo comando seletivo e possui vídeo MP4 e log em `logs/e2e/`. A suíte ampla seleciona apenas `platform-journey.cy.ts`, evitando estado compartilhado entre tickets; a revisão de 2026-10-03 havia encontrado quatro falhas quando todos os specs eram executados em sequência. A especificação, o inventário e os tickets individuais estão em `.scratch/e2e-por-ticket/`; para mudança futura, execute somente o ticket alterado e suas verificações relacionadas.

Decisão do usuário: testes unitários isolados. A fronteira testada é a interface pública dos serviços; banco, HTTP, Docker e rede não participam da execução.
## Execução
Requer Node.js 24.12 ou superior. Instale as ferramentas de desenvolvimento com `npm ci` e execute:
```sh
npm run test:unit
npm run typecheck
```
Os testes também rodam diretamente com `node tests/unit/people.test.ts`. O Node executa TypeScript nativamente, mas não verifica tipos; a checagem de tipos é um comando separado. Referência: [documentação oficial do Node](https://nodejs.org/api/typescript.html).
## Fixture SQLite do catálogo público
Os testes SQLite e o E2E visível consultam `tests/fixtures/catalog-listing.sqlite` em modo somente leitura. Ele contém uma escola por combinação município/UF do CSV INEP atual (5.567), uma IES por cada UF (27) e todas as ofertas dessas IES (5.358). A fonte, o critério de seleção e as contagens estão em `tests/fixtures/catalog-listing.manifest.json`.
O cenário operacional demonstrativo fica separado em `tests/fixtures/academic-scenario.sqlite`, com dois tenants, cinco cursos, 35 matérias e sem matrícula nem registros de auditoria. O Cypress consulta seus cursos e PPCs por um adaptador read-only, e a suíte SQLite verifica integridade, contagens, fontes e hash inalterado da fixture de catálogo. Para preparar uma fixture ausente use `npm run fixture:academic:prepare`; se já existir, o comando valida integridade e não a substitui. Esse comando não é parte da execução normal da suíte completa. A fonte INEP é a escola de Porto Velho/RO de código `11000023`; a referência de graduação é Bacharelado em Administração da Universidade de Brasília já presente no catálogo local.
O fixture de catálogo foi validado uma vez com o construtor abaixo. Ele usa os CSVs locais aprovados, substitui somente o arquivo fixture de saída e não é executado por `npm run test:all`. Não há arquivo SQLite operacional dentro desta operação.
```sh
node scripts/build-catalog-listing-fixture.mjs
```
Os testes de listagem não inserem catálogo manualmente nem importam os CSVs em lote para SQLite. Testes unitários continuam exercitando os parsers e contratos de importação com suas próprias fronteiras.
## Fronteiras e evidências
- `createPeopleService`: cadastro, consulta por ID e busca por CPF/identificador institucional, validação de entrada, escopo institucional, permissão e proteção de conta de aluno.
- `createSuperAdminService`: onboarding institucional com escopo educacional, validação de níveis/etapas/modalidades, autorização global, duplicidade e falha de persistência, usando store em memória por teste.
- Persistência de pessoas: adaptador em memória exclusivo de testes, implementando o contrato externo de armazenamento. O contrato exige unicidade por tenant e não recebe eventos de auditoria.
- Tempo e identificadores: funções injetadas com valores determinísticos; nenhum teste depende do relógio real.
- Cada teste cria seu próprio armazenamento; não usa banco compartilhado, chamadas HTTP, filesystem como fonte de dados ou mocks de métodos privados.
- Asserções observam os serviços públicos e não dependem de leitura ou gravação de auditoria.
## Limites da entrega
`Principal` é produzido no servidor a partir da sessão autenticada, jamais a partir do corpo de uma requisição. A suíte SQLite em memória verifica identidade/sessão, pessoas e onboarding sem exigir ou gravar auditoria; as listagens do catálogo usam o fixture read-only descrito acima.
O teste de indisponibilidade verifica a resposta do serviço a uma falha do armazenamento. O adaptador em memória não prova rollback, isolamento ou unicidade de um banco real.
CPF é normalizado e validado quanto ao formato; não há consulta cadastral externa nem verificação de dígitos verificadores nesta entrega. Dados dos testes são fictícios. Cadastro duplicado retorna conflito sem atualizar ou unir registros; importação, alteração cadastral e CPF posteriormente informado continuam sujeitos às decisões abertas da especificação.
## Ciclos TDD executados
1. Cadastro consultável: falhou por ausência do serviço; passou após criação do serviço e adaptador em memória.
2. Permissão de cadastro e consulta: cada negação falhou antes da autorização e passou após sua implementação.
3. Contexto de aluno: falhou antes da restrição à conta profissional e passou depois.
4. Consulta entre tenants: falhou ao não retornar o erro de não encontrado; passou com resposta indistinguível de ID inexistente.
5. Entrada inválida: falhou antes da validação e passou depois.
6. Duplicidade: falhou antes de traduzir o conflito do armazenamento e passou depois.
7. Auditoria era requisito do sistema completo no baseline anterior; a ADR 0016 a retirou do MVP. Testes atuais verificam que os fluxos do MVP não dependem de gravação ou consulta de auditoria.
8. Falhas de infraestrutura: falharam quando expunham detalhes internos; passaram após normalização.
9. Busca por CPF/identificador: falhou por ausência da operação, depois por falta de autorização e normalização de erro; cada comportamento passou após a implementação correspondente.
10. Escopo institucional: o teste de criação falhou com entrada inválida quando `educationScope` ainda era desconhecido; passou depois do parser e do contrato de onboarding. Testes adicionais cobrem combinações inválidas e rejeitam sucesso parcial diante de falha do armazenamento em memória.
Casos complementares cobrem duplicidade do identificador institucional e independência entre instâncias de teste.
## Autenticação e verificações separadas
Os testes unitários de identidade também usam persistência em memória e tempo controlado. A derivação de senha usa a primitiva criptográfica real local, sem acessar rede. Ciclos TDD cobriram sessão válida, expiração, desativação de conta, logout independente e limitação de tentativas. Casos complementares verificam instituição incorreta, contexto de aluno/responsável, negação do papel global sem MFA e sal independente.
```sh
# Continua sendo apenas a suíte unitária isolada.
npm test
# Servidor HTTP real em porta local 4318, banco substituído por fixture.
npm run test:http
# Integração local do adaptador SQLite; testes do catálogo leem o fixture e os demais cenários usam bases isoladas.
npm run test:sqlite
```
Os testes HTTP exercitam login, atributos do cookie, negação de origem externa, autorização, consulta cruzada por ID, busca, duplicidade, ausência de rotas de auditoria e revogação; o onboarding global cobre passkey fixture, exigência de sessão, campos de escopo e respostas de validação/conflito.
## Verificação da interface
A interface foi exercitada no navegador da aplicação com fixture local: login, cadastro, consulta, duplicidade e navegação da jornada institucional. O E2E visível executa com Cypress/Electron; auditoria não é uma tela nem comportamento do MVP.
Foram inspecionados layouts de uma e duas colunas. O navegador aplicou larguras efetivas diferentes das solicitadas (425, 907 e 1451 CSS px para pedidos de 375, 800 e 1280); a leitura do DOM não detectou overflow horizontal. As capturas apresentaram limitações de recorte, portanto não há validação visual conclusiva nos tamanhos exatos solicitados nem alegação de acessibilidade universal ou compatibilidade entre navegadores.
