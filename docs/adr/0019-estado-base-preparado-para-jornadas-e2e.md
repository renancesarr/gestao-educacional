# ADR 0019 — Estado-base preparado para jornadas E2E

## Contexto

As jornadas visíveis no navegador repetiam o provisionamento do `SUPER_ADMIN` e a criação de instituições e cursos antes de alcançar o fluxo novo. Esses passos já possuem cobertura própria e aumentam o tempo e o acoplamento das jornadas E2E de funcionalidades posteriores.

## Decisão

- Jornadas E2E de funcionalidades novas começam de um estado-base de teste preparado, determinístico e validado.
- Por padrão, essas jornadas cobrem o fluxo novo ou alterado e não repetem interativamente o provisionamento do `SUPER_ADMIN`, a criação de instituições ou a criação de cursos já testados.
- A cobertura específica dos fluxos-base continua disponível. Deve ser executada quando houver alteração nesses cadastros/provisionamentos ou quando uma falha sugerir que a preparação, os dados ou os vínculos do estado-base estão incorretos.
- Ao investigar uma falha, verificar a presença e integridade dos dados esperados na fixture antes de concluir que o fluxo novo está quebrado.
- A decisão se aplica ao escopo das jornadas E2E; não remove regressões automatizadas nas suítes unitária, HTTP ou de persistência, nem altera o comando completo `npm run test:all`.
- O E2E permanece visível ao usuário, abrindo o navegador Electron.

## Consequências

- Jornadas E2E ficam menores e focadas no comportamento recém-adicionado.
- Fixture e mecanismo de preparação tornam-se pré-condições explícitas, com validação dos registros necessários ao cenário.
- Falhas na fixture podem ser isoladas dos defeitos do fluxo sob teste por meio da cobertura direcionada dos fluxos-base.
- `docs/TESTES.md` e as especificações de funcionalidades devem refletir essa política.
