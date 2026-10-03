# Acessos e integridade documental

Inspeção realizada em 29/09/2026, no ambiente acessível ao agente.

Este é um relatório histórico sobre acesso e integridade documental. A expressão “auditoria” aqui se refere à pasta e à sua referência SHA-256; ela não define a auditoria de produto. O código da aplicação passou a existir desde a inspeção registrada, e a ADR 0016 define a auditoria de produto como fora do MVP atual, mantendo-a como requisito do sistema completo.

Após a inspeção, `IDEIA.md`, `CONTEXT.md` e o conteúdo completo de `AGENTS.md` foram movidos da raiz para `docs/`. Um novo `AGENTS.md` curto na raiz encaminha para as instruções completas, e `docs/README.md` serve de índice. Os acessos abaixo descrevem a inspeção original. A referência de integridade foi atualizada após a revisão desta reorganização.

## Acessos observados

- Dono e grupo: `nanerr:nanerr`.
- Os oito Markdown originais têm modo `664`: dono e grupo podem ler e escrever; outros podem ler.
- A raiz, `docs` e `docs/adr` têm modo `775`: dono e grupo podem criar, remover e renomear entradas; outros podem listar e atravessar essas pastas.
- As ACLs consultadas da raiz, dos três Markdown da raiz e das pastas documentais contêm apenas permissões básicas, sem entradas adicionais.
- `.git`, `.agents` e `.codex` aparecem como diretórios `555` vazios neste ambiente. `git status` retorna que a pasta não é um repositório Git.
- O agente pode editar a área de trabalho, mas essas três pastas são protegidas pelo ambiente. Permissões Unix não substituem as restrições do sandbox.

Esses dados não demonstram exposição pela internet, nem identificam quem acessou arquivos no passado. Permissões de diretórios ancestrais e controles externos também podem limitar o acesso. Nenhuma permissão foi alterada.

## Lacuna encontrada

A [ADR 0004](adr/0004-garantia-forte-de-auditoria-apos-mvp.md) adia a garantia forte contra alteração do armazenamento de auditoria. Ela não dispensa registros de ações críticas: chamá-la de “arquivo não auditável” seria impreciso. O conteúdo pode ser inspecionado; a proteção futura ainda não está implementada.

Há também uma lacuna documental: não foi possível obter histórico Git nesta cópia. Nenhum dos oito arquivos permite, por si só, provar quem fez cada alteração e por quê. A pasta contém documentos de planejamento, sem aplicação executável para testar autorização ou auditoria acadêmica.

## Ajuste entregue

O script `scripts/auditar_markdown.py` inventaria Markdown com SHA-256, permissões, UID e GID. A referência inicial fica em `docs/markdown-baseline.json`, incluindo este relatório.

Execute na raiz:

```sh
python3 scripts/auditar_markdown.py inventory
python3 scripts/auditar_markdown.py check
```

O check informa arquivos novos, removidos e alterados, incluindo mudanças de permissões e proprietário. Retorna `0` quando tudo confere, `1` quando há divergências e `2` quando não pode concluir. A criação inicial usa `init` e recusa sobrescrever uma referência existente. Links simbólicos de arquivos Markdown são rejeitados; diretórios simbólicos não são percorridos. Pastas `.git`, `.agents`, `.codex`, `node_modules` e `.venv` são excluídas.

Uma mudança legítima exige revisão do diff documental e da referência antes de atualizar esta última. Não regenere a referência automaticamente para fazer uma divergência desaparecer. Mudanças de UID/GID ao copiar a pasta entre máquinas também geram divergências que precisam ser avaliadas.

## Limites e próximo passo

Este mecanismo detecta divergências em relação à referência local; não registra acessos, autoria, motivo, versões anteriores ou alterações revertidas entre verificações. Quem pode modificar arquivos, script e referência pode contornar a verificação. Ele também não monitora permissões dos diretórios nem representa auditoria do sistema acadêmico.

Para histórico documental, o próximo passo é disponibilizar um repositório Git real, revisar alterações e guardar a referência em um destino com controle de acesso independente. Isso não foi executado: não há remoto configurado disponível nesta cópia. A ADR 0004 e as decisões de escopo do MVP foram preservadas.
