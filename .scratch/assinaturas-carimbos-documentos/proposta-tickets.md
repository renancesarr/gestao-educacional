> **Superado para esta etapa:** o usuário restringiu o trabalho ao gerador de carimbos (texto, cor, fonte, PNG/SVG). Esta proposta não autoriza implementar assinatura, catálogo, modelos ou emissão documental. Consulte a especificação em `../gerador-carimbos/` na árvore de trabalho.

# Proposta de tickets e fronteiras de teste

Proposta para aprovação; os arquivos em `drafts/` ainda não são tickets publicados. A especificação permanece inalterada.

## Entregas e dependências

1. **Assinatura no cadastro individual de colaboradores** — sem bloqueadores. Navegar desde o login até a pessoa vinculada à instituição e enviar, consultar, substituir e remover sua assinatura PNG. Mostrar vínculos administrativos e acadêmicos sem converter professor em funcionário administrativo.
2. **Catálogo de carimbos PNG** — bloqueado por 01. Cadastrar, listar, substituir e remover carimbos de colaborador, instituição e outros usos, com isolamento e titular identificado.
3. **Gerador configurável de carimbos** — bloqueado por 02. Gerar PNG quadrado/redondo com texto, cor, prévia e confirmação, aproveitando o catálogo.
4. **Áreas de carimbo e prévia da declaração de matrícula** — bloqueado por 02. Configurar áreas nomeadas do modelo padrão e visualizar a declaração com os ativos associados. O gerador não bloqueia esta entrega: imagens enviadas já a atendem.
5. **Áreas de carimbo e prévia do histórico manual** — bloqueado por 04. Reutilizar o mecanismo de modelos em uma prévia dos registros manuais existentes, sem calcular notas ou exigir matrícula atual.
6. **Emissão da declaração com os ativos selecionados** — bloqueado por 01 e 04. Emitir apenas para matrícula ativa, preservando o conteúdo utilizado e integrando os requisitos documentais já decididos. Não depende da prévia do histórico nem do gerador.

Cada entrega inclui persistência quando necessária, contrato público, interface e E2E próprio com vídeo. O teste parte da fixture e faz pela interface as ações que demonstra. Navegador oculto com vídeo, conforme decisão vigente.

## Fronteiras de teste propostas

- **Interface autenticada:** login, instituição-alvo, navegação até colaboradores/modelos, ações reais e resultados visíveis; E2E separado por ticket.
- **API HTTP com SQLite real:** autorização, vínculo com tenant, PNG válido, substituição independente e persistência observada por leitura HTTP após reabrir o serviço. Sem consultar tabelas como atalho de verificação.
- **Exportação pública do gerador:** formato, cor e texto observados na imagem PNG produzida; cancelamento observado pela interface e pela leitura do ativo anterior. Sem testar métodos privados do canvas.
- **Contrato público de persistência, quando houver mais de um adaptador:** mesmos exemplos de comportamento para SQLite e memória, para verificar substituibilidade; sem acessar detalhes internos do banco.

Após aprovação, cada ciclo escreve um teste que falha, registra a falha esperada e implementa somente o suficiente para passar, antes do próximo ciclo. A revisão SOLID ocorre antes de integrar em `dev-ai`.

## Limites preservados

- Sem X/Y; as posições pertencem ao modelo padrão.
- Sem auditoria geral, integrações externas ou verificações PostgreSQL.
- Nenhuma assinatura criptográfica; os documentos e o QR de assinatura são demonstrativos.
- Histórico continua manual. Não decidir atos, conclusão acadêmica ou emissão de diploma neste trabalho.
- O contrato comum permite áreas nos demais modelos; modelos de histórico/diploma ainda não aprovados não ganham conteúdo oficial inventado. A emissão do histórico e o modelo de diploma precisam de sua própria definição antes da implementação.
- A branch atual contém alterações não commitadas da implementação anterior. Antes de começar código novo, preservar esse trabalho e preparar a branch de tarefa conforme o fluxo do projeto.

## Aprovação solicitada

Confirmar o tamanho das seis entregas, suas dependências e as quatro fronteiras de teste; indicar eventuais tickets a unir ou dividir. Com isso, publicar os arquivos individuais em `issues/` e iniciar 01 em TDD.
