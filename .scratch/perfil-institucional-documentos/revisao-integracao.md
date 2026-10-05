# Correção para integração em dev-ai

A revisão dedicada rejeitou inicialmente o SHA a1d059a por aceitar SVG malformado no upload de marca. O exemplo `<svg>` reproduziu a falha (o prefixo isolado `<svg` já era recusado pela validação anterior).

## Ciclos TDD de correção

1. Teste público de validateInstitutionImage: SVG incompleto, fechamento incompatível e entidade inválida deveriam ser recusados. Red: 2 passaram/1 falhou. Green com parser XML estrito: 3/3 passaram.
2. PNG com CRC correto e fluxo zlib corrompido deveria ser recusado. Red: 3 passaram/1 falhou. Green com validação do fluxo comprimido: 4/4 passaram.
3. PNG com CRC e zlib corretos, mas altura incompatível com os pixels, deveria ser recusado. Red: 4 passaram/1 falhou. Green com verificação das linhas/dimensões/filtros: 5/5 passaram.

O parser saxes está fixado em 6.0.0. Sua API pública é acessada por uma fronteira tipada de runtime, pois os tipos publicados não compilam com a configuração estrita do TypeScript 6 do projeto. Nenhuma verificação do compilador foi desativada. Ver [documentação do parser](https://github.com/lddubeau/saxes).

A verificação PNG segue o tamanho das linhas e as passagens Adam7 da [especificação PNG](https://www.w3.org/TR/png/), com limite de 64 MiB para o conteúdo descomprimido. A validação de formatos de imagem foi separada das regras de perfil institucional.

## Verificação final

- `node --test --test-isolation=none tests/unit/institution-document-profile.test.ts tests/sqlite/institution-document-profile.test.ts tests/http/institution-document-profile.test.ts`: 11/11 passaram.
- `npm run typecheck`: passou.
- HTTP confirma rejeição de SVG malformado sem substituir a marca anterior válida.
- Interface e gerador não foram alterados por esta correção; as evidências E2E anteriores permanecem vinculadas aos tickets.

## Segunda rodada de revisão

O SHA 5fc4fc9 foi rejeitado por aceitar PNG indexado sem PLTE. Teste público reproduziu Red (5 passaram/1 falhou). A validação agora exige paleta para tipo de cor 3, com tamanho/ordem compatíveis, e o teste preserva a aceitação da mesma imagem com paleta válida. Green: 6/6 unitários e 12/12 na execução focada completa.
