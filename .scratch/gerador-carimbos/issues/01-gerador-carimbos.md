# 01: Gerar e exportar carimbos na aplicação

**What to build:** Abrir a ferramenta, informar texto, selecionar cor, fonte e formato, visualizar o carimbo e baixar a imagem em PNG ou SVG.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Ferramenta acessível pela navegação normal da aplicação.
- [x] Texto com quebras de linha, fonte e cor selecionáveis; formatos quadrado e redondo.
- [x] Prévia atualizada a partir das escolhas do operador.
- [x] Baixar PNG e SVG válidos, correspondentes à mesma composição da prévia.
- [x] Caracteres especiais aparecem como texto; entrada não injeta marcação executável no SVG.
- [x] Texto vazio ou que não cabe legivelmente recebe orientação, sem exportação silenciosamente cortada.
- [x] Geração/download não exige cadastrar assinatura, carimbo no banco ou modelo documental.
- [x] E2E específico faz as ações pela interface e gera vídeo com navegador oculto, sem repetir provisionamento já validado.
- [x] Registrar falha Red e resultado Green a cada ciclo dirigido pelo comportamento público.
- [x] Atualizar instruções de uso e de execução do E2E com seus caminhos reais na entrega.

## Fronteira de teste aprovada

Usar a ferramenta pela interface da aplicação e verificar a prévia e os arquivos PNG/SVG efetivamente exportados. Não testar métodos privados do canvas nem criar testes de banco/API para uma ferramenta local de geração e download.

## Limites

Somente geração de carimbos. Assinaturas, upload de ativos existentes, catálogo persistido, associação com colaboradores/instituições, modelos e emissão de documentos estão fora desta entrega. Não criar tabelas, integrações externas ou verificações PostgreSQL.

## Comments

- 2026-10-05: O usuário confirmou a proposta de um ticket sem bloqueadores e a fronteira de teste pela interface e pelos arquivos exportados. Publicado por solicitação explícita de executar to-tickets.
- 2026-10-05: O usuário aceitou a entrega com “validado!”. Ticket concluído com os critérios de aceite marcados e as evidências E2E, tipos e lint indicadas abaixo. Nenhum teste adicional foi executado para registrar esta aceitação.

## Entrega e evidências

- Implementação na branch feature/gerador-carimbos, com alterações locais anteriores preservadas. Sem commit, push ou merge nesta entrega.
- Cinco ciclos Red → Green registrados em ../tdd.md. E2E final: 5/5 passaram.
- Log final: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-19-57-545Z/run.txt.
- Vídeo: logs/e2e/gerador-carimbos/01-gerador-carimbos/2026-10-05T10-19-57-545Z/videos/01-gerador-carimbos.cy.ts.mp4.
- Checagem de tipos do frontend e lint dos arquivos tocados aprovados.
- Guia de uso e execução: docs/GERADOR-CARIMBOS.md; TESTES, IDEIA e CONTEXT alinhados.
- Limite: o SVG usa famílias genéricas locais; o programa que o abrir resolve a fonte. O PNG fixa a aparência renderizada no navegador.
