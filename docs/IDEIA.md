# IDEIA.md — Ideologia do Sistema de Gestão Acadêmica Brasil
Versão: 0.1.0
Base: HANDOFF v0.1
Status: Em validação
## 1. Propósito
Este projeto existe para permitir que instituições educacionais brasileiras gerenciem sua vida acadêmica com clareza, rastreabilidade, segurança e respeito à privacidade.
Ele não é apenas um CRUD escolar. Ele é um sistema de registro, confiança, evidência acadêmica e responsabilidade institucional.
O sistema deve atender, no MVP:
- Escolas de Educação Básica:
- Ensino Fundamental
- Ensino Médio
- EJA
- Instituições de Ensino Superior:
- Cursos de graduação
- Educação Profissional Técnica de nível médio, com um curso demonstrativo neste MVP
Expansões futuras podem incluir Educação Infantil, pós-graduação, cursos livres, novas integrações de dados, assinatura digital real e portal público de matrícula.
### Recorte do MVP decidido
O recorte atual inclui operação pelo site, matrícula individual, cadastro e consulta de instituições, cursos e matérias, busca de alunos e fluxos CRUD de avaliações, notas, frequência, históricos e credenciais. Matrícula em lote e integração com ambientes EAD ficam para depois. O catálogo de escolas utiliza os dados INEP já fornecidos para Educação Básica. Para cenários de teste, instituições e cursos superiores existentes no fixture SQLite e referências oficiais fixadas para cursos técnico e graduação são dados locais; não haverá novas integrações de catálogo no MVP. O sistema permite cadastrar instituição, curso e matérias manualmente. Educação Profissional Técnica de nível médio é escopo próprio, separado do Ensino Médio regular e da graduação. Especializações ficam fora do MVP. O contrato mínimo de avaliações, notas e frequência está na ADR 0018; regras de cálculo e progressão continuam pendentes.
Na busca pública de alunos, os critérios incluem município e UF de nascimento, e os resultados expõem somente nome, curso e instituição.
O catálogo INEP e o fixture SQLite são dados locais para consulta e teste; sua presença não cria instituição operacional, curso, vínculo ou matrícula. O arquivo `catalog-listing.sqlite` é read-only e serve de origem para consulta; `academic-scenario.sqlite` é uma fixture operacional separada, criada por comando explícito, sem matrícula e sem auditoria. Dados externos de IES e cursos só serão integrados após o MVP. Os dados de exemplo não são matrizes curriculares nacionais: cada tenant pode manter seus cursos e matérias. A consulta pública de alunos existe neste recorte com resultados limitados aos campos aprovados: nome, curso e instituição.
Auditabilidade continua sendo princípio do sistema completo. A implementação de auditoria, incluindo trilhas de alterações, fica fora do MVP atual e deverá ser retomada em uma etapa posterior.
No MVP, o CRUD de credenciais permite editar e excluir credenciais mesmo após a emissão. Essa é uma exceção temporária ao princípio do sistema completo, no qual credenciais emitidas são imutáveis e corrigidas por revogação e nova emissão. Conforme ADR 0020, editar recalcula o hash e troca o token; o link público atual pode ser usado como destino de QR, embora a interface ainda não renderize a imagem.
## 2. Tese Central
A gestão acadêmica lida com fatos que afetam a vida de pessoas: matrícula, frequência, notas, histórico, conclusão de curso, emissão de documentos e direitos estudantis.
Portanto, o sistema deve ser construído sob uma premissa inegociável:
> Registro acadêmico é prova.
> Dado pessoal é responsabilidade.
> Documento emitido deve ser verificável.
> Regra acadêmica deve ser explícita, configurável e auditável.
O sistema não pode tratar educação como um formulário genérico. Cada instituição, nível, curso e modalidade possui regras próprias. O papel da plataforma é suportar essa diversidade com disciplina técnica e clareza de domínio.
## 3. Princípios Fundadores
### 3.1 Verdade Registral
O banco de dados deve refletir fatos acadêmicos com integridade. Dados críticos não devem ser alterados silenciosamente.
- No sistema completo, notas, faltas, matrículas e documentos devem possuir trilha de auditoria.
- Alterações relevantes devem registrar autor, data, motivo e estado anterior quando aplicável; esse mecanismo não integra o MVP atual.
- Documentos emitidos devem ser imutáveis ou revogáveis, nunca falsamente editáveis como se fossem novos.
### 3.2 Isolamento entre Instituições
Multi-tenancy não é detalhe técnico. É fronteira de segurança e negócio.
- Toda entidade sensível deve carregar `tenantId`.
- Consultas devem ser protegidas contra vazamento entre tenants.
- White label não pode significar exposição cruzada de dados.
- O sistema deve assumir que um erro de isolamento é um incidente grave.
### 3.3 LGPD by Design
Privacidade não é funcionalidade tardia. É requisito estrutural.
- Coletar apenas dados necessários.
- Controlar acesso por papel e permissão.
- Proteger dados sensíveis com autorização explícita.
- Registrar consentimentos e suas alterações.
- Permitir trilha para exercício de direitos do titular.
- Não expor dados excessivos em validação pública de documentos.
O software apoia conformidade, mas não substitui processos jurídicos, organizacionais e regulatórios.
### 3.4 Auditabilidade como Regra do Sistema Completo
Auditoria não é luxo. É proteção para instituição, estudante, gestor e operador do sistema.
No MVP atual não será implementado registro de auditoria. Para o sistema completo, as ações mínimas auditáveis são:
- Criação e alteração de instituição.
- Alteração de credenciamento.
- Criação e alteração de pessoas.
- Registro e revogação de consentimento LGPD.
- Lançamento e alteração de notas.
- Registro de frequência.
- Alteração de matrícula.
- Emissão de histórico.
- Emissão de diploma/certificado.
- Revogação de diploma/certificado.
- Validação pública de documento.
### 3.5 Modularidade com Fronteiras Claras
O MVP é um monólito modular, não um amontoado de arquivos.
Cada módulo deve possuir responsabilidade clara:
- identity
- institution
- people
- academic
- credential
- lgpd
- audit
Módulos não devem invadir o domínio uns dos outros. Comunicação deve ocorrer por:
- Serviços públicos.
- DTOs.
- Eventos de domínio.
- Contratos estáveis.
### 3.6 SOLID Obrigatório
SOLID não é enfeite arquitetural. É regra de engenharia.
- Single Responsibility: cada classe/função deve ter uma responsabilidade clara.
- Open/Closed: regras novas devem ser adicionadas sem quebrar comportamento existente.
- Liskov Substitution: implementações alternativas devem respeitar contratos.
- Interface Segregation: evitar interfaces gordas e genéricas demais.
- Dependency Inversion: regras de negócio devem depender de abstrações, não de detalhes frágeis.
### 3.7 Regras Acadêmicas Configuráveis
Não existe uma única regra acadêmica brasileira universal.
Portanto:
- Média mínima deve ser configurável.
- Frequência mínima deve ser configurável.
- Regras de aprovação/reprovação devem ser configuráveis.
- Recuperação, quando existir, deve ser configurável.
- Trancamento, cancelamento e conclusão devem seguir regras por instituição/curso.
O motor de regras acadêmicas nasce como peça central do MVP.
### 3.8 Conformidade Progressiva e Honesta
O MVP emite diploma/certificado em modo demonstração.
Isso significa:
- Não afirmar validade jurídica oficial.
- Não simular falsamente integração MEC.
- Não fingir assinatura ICP-Brasil real.
- Preparar interfaces para futura implementação formal.
- Deixar claro quando um documento é demonstrativo.
Honestidade técnica é parte da ideologia do projeto.
### 3.9 Documentos Verificáveis
Documentos acadêmicos devem ser mais do que PDFs bonitos.
Cada credential deve possuir, no mínimo:
- Payload estruturado.
- XML estruturado.
- Hash.
- Token público.
- QR Code para validação.
- Status.
- Registro de emissão.
- Registro de revogação, quando aplicável.
- Assinatura demonstrativa no MVP.
A validação pública deve responder:
- O documento existe?
- Está emitido, revogado ou em rascunho?
- Qual instituição emitiu?
- Qual curso ou credencial?
- Quem é o titular, com exposição mínima?
- Quando foi emitido/concluído?
### 3.10 Evolução sem Ruptura
O sistema deve nascer simples, mas não deve nascer frágil.
Decisões atuais devem permitir:
- Futura extração de módulos para microserviços.
- Futura integração com filas reais.
- Futura assinatura digital oficial.
- Futura integração governamental.
- Futuro suporte a pós-graduação e cursos livres.
Mas o MVP não deve carregar complexidade desnecessária.
## 4. Filosofia de Produto
### 4.1 White Label com Núcleo Forte
Cada instituição pode ter identidade visual própria, nome próprio e configurações próprias, mas o núcleo do sistema deve permanecer consistente, seguro e auditável.
White label não significa permitir que cada tenant destrua regras críticas de segurança, privacidade ou integridade acadêmica.
### 4.2 Suporte a Múltiplos Níveis sem Uniformização Forçada
Educação Básica e Ensino Superior possuem naturezas diferentes.
O sistema deve suportar os dois níveis, mas sem tentar impor um único fluxo regulatório, acadêmico ou documental.
A plataforma deve ser flexível o suficiente para:
- Diferentes níveis de ensino.
- Diferentes modalidades.
- Diferentes regimes de avaliação.
- Diferentes tipos de credencial.
- Diferentes estruturas curriculares.
### 4.3 MVP Honesto
O MVP entrega valor real, mas reconhece limites.
Ele não tenta ser:
- ERP financeiro completo.
- Folha de pagamento.
- Integração oficial MEC.
- Assinador ICP-Brasil real.
- Marketplace educacional.
- Aplicativo mobile nativo.
- Plataforma completa de BI.
O recorte decidido cobre o fluxo pelo site, catálogo consultável de instituições e cursos, matrícula individual e CRUD de avaliações, notas, frequência, históricos e credenciais. Auditoria e integração com ambientes EAD ficam fora deste MVP. Os detalhes acadêmicos ainda não decididos devem ser fechados antes de implementar cada fluxo.
### 4.4 Usuário no Centro da Operação
O sistema deve servir a pessoas reais:
- Secretaria acadêmica.
- Direção institucional.
- Professores.
- Alunos.
- Responsáveis legais.
- Administradores técnicos.
A interface e a API devem respeitar essas personas com permissões claras, fluxos compreensíveis e mensagens de erro úteis.
## 5. Filosofia de Engenharia
### 5.1 Domínio antes de Framework
Next.js, Prisma, Docker e outras ferramentas são meios.
O domínio é o centro:
- Institution
- Person
- Course
- CurriculumComponent
- Class
- Enrollment
- AcademicAssessment
- AttendanceRecord
- Credential
- Accreditation
- AuditLog
- Consent
- User
- Role
- Permission
- Tenant
A tecnologia deve servir ao domínio, não o contrário.
### 5.2 Monólito Modular Primeiro
O MVP roda como um único processo backend monolítico modular.
Isso reduz complexidade operacional e permite evoluir com segurança.
Microserviços são possibilidade futura, não requisito inicial.
### 5.3 API com Contratos Claros
Toda exposição funcional deve possuir contrato explícito:
- DTO de entrada.
- Validação com Zod ou equivalente.
- Regras de negócio em services.
- Respostas de erro normalizadas.
- Permissões verificadas.
- Auditoria registrada quando aplicável.
### 5.4 Eventos como Fatos de Domínio
Eventos representam fatos que aconteceram no sistema.
Exemplos:
- institution.created
- person.created
- student.enrolled
- enrollment.updated
- academic-record.generated
- credential.issued
- credential.revoked
- lgpd.consent.updated
No MVP, eventos podem usar EventEmitter interno. Futuramente, podem migrar para filas reais, outbox ou mensageria dedicada.
### 5.5 Dados como Responsabilidade
Banco de dados não é apenas armazenamento. É responsabilidade legal, acadêmica e ética.
- O domínio não depende de um fornecedor de banco; mecanismos de persistência são integrados por adaptadores substituíveis.
- O MVP mantém um único armazenamento lógico.
- Isolamento por tenant.
- Migrações controladas.
- Campos de auditoria.
- UTC em datas.
- UUID como identificador principal.
### 5.6 Testes como Prova
Código sem teste é opinião. Código com teste é comportamento verificado.
Cada módulo deve buscar testes para:
- Regras de serviço.
- Validações de DTO.
- Fluxos críticos.
- Regras de autorização.
- Regras acadêmicas.
- Emissão/revogação de credenciais.
### 5.7 Erros como Pipeline
Erros não devem ser tratados apenas com try/catch espalhado.
O projeto deve avaliar padrões como:
- Collector Pattern.
- Chain of Responsibility.
- Full-Chain Walk, como variação interna para tratamento de erros.
O objetivo é transformar erros em respostas consistentes, auditáveis e tipadas, sem perder contexto.
## 6. Ecossistema do Sistema
### 6.1 Atores do Ecossistema
#### SUPER_ADMIN
Acesso global à plataforma, responsável por operações técnicas e criação de tenants. No sistema completo, deve ser altamente auditado; essa auditoria não é implementada no MVP atual.
#### TENANT_ADMIN
Papel institucional reservado para evolução posterior. No MVP de validação, operações institucionais são executadas pelo `SUPER_ADMIN` com instituição-alvo explícita. A auditoria de plataforma permanece prevista para o sistema completo e fora do MVP atual.
#### ACADEMIC_SECRETARY
Papel operacional reservado para evolução posterior. No MVP de validação, não recebe permissões institucionais.
#### TEACHER
Papel reservado para evolução posterior; não recebe permissões institucionais no MVP de validação.
#### STUDENT
Papel reservado para evolução posterior; não recebe permissões institucionais no MVP de validação.
#### VIEWER
Papel reservado para evolução posterior; não recebe permissões institucionais no MVP de validação.
### 6.2 Fluxos Principais
Os fluxos a seguir descrevem o sistema completo. O conjunto incluído no MVP atual está delimitado no início deste documento e na ADR 0016; passos de auditoria e de integração EAD permanecem fora desse recorte.
#### Fluxo 1: Onboarding de Instituição
1. Tenant é criado.
2. Institution é cadastrada.
3. Credenciamentos são registrados.
4. Tema white label é configurado.
5. Usuários administrativos são criados.
6. Auditoria registra a fundação do tenant.
#### Fluxo 2: Estrutura Acadêmica
1. Cursos são criados.
2. Componentes curriculares são vinculados.
3. Turmas/ofertas são abertas.
4. Professores são atribuídos.
5. Regras acadêmicas são configuradas.
#### Fluxo 3: Pessoas e Matrícula
1. Pessoa é cadastrada.
2. Pessoa recebe papel acadêmico.
3. Aluno é vinculado a curso/turma.
4. Enrollment é criada.
5. Consentimentos LGPD são registrados quando aplicável.
6. Evento de matrícula é emitido.
#### Fluxo 4: Vida Acadêmica
1. Avaliações são lançadas.
2. Frequência é registrada.
3. Motor de regras calcula situação.
4. Histórico acadêmico é gerado.
5. Alterações são auditadas.
#### Fluxo 5: Documento Acadêmico
1. Sistema valida conclusão segundo regras configuradas.
2. Credential é criada em estado DRAFT.
3. Payload, XML, hash e token são gerados.
4. Documento é emitido como ISSUED em modo demonstração.
5. QR Code aponta para validação pública.
6. Auditoria registra emissão.
7. Documento pode ser revogado se necessário.
#### Fluxo 6: Validação Pública
1. Usuário público acessa rota `/validar/:token`.
2. Sistema busca credential pelo token.
3. Sistema valida hash/status.
4. Sistema retorna dados mínimos.
5. Sistema registra auditoria da consulta.
6. Nenhum dado sensível excessivo é exposto.
### 6.3 Arquitetura Funcional
O ecossistema é composto por:
- Camada HTTP/API.
- Módulos de domínio.
- Services com regras de negócio.
- Repositories ou acesso Prisma.
- DTOs com validação Zod.
- Eventos internos.
- Auditoria transversal.
- Motor de regras acadêmicas.
- Módulo de credenciais.
- Módulo LGPD.
- Persistência encapsulada por contratos e adaptadores, com um único armazenamento lógico no MVP.
### 6.4 Camadas de Responsabilidade
#### Controller / Route Handler
Recebe requisição, valida entrada básica, invoca service, retorna resposta HTTP.
Não deve conter regra de negócio profunda.
#### Service
Orquestra caso de uso, aplica regras, verifica permissões, dispara eventos, chama repositórios e garante consistência.
#### Repository / Prisma Access
Acessa banco de dados, executa queries e persistência.
Não deve conter regras de negócio complexas.
#### DTO / Schema
Define contrato de entrada e saída.
Valida forma, tipos, obrigatoriedade e limites.
#### Domain Events
Comunicam fatos ocorridos entre módulos.
#### Audit
Registra ações relevantes para rastreabilidade.
#### LGPD
Controla consentimento, minimização, acesso a dados sensíveis e solicitações relacionadas a titulares.
## 7. Regras de Ouro
1. Nunca vazar dados entre tenants.
2. Nunca expor dados sensíveis em rotas públicas.
3. Nunca alterar silenciosamente registros acadêmicos críticos.
4. Nunca emitir documento oficial real sem requisitos legais implementados.
5. Nunca fingir conformidade MEC/ICP-Brasil.
6. Nunca permitir escrita sem permissão.
7. Nunca executar regra acadêmica hardcoded quando ela dever ser configurável.
8. A auditoria é requisito do sistema completo, mas está explicitamente fora do MVP atual.
9. Nunca permitir que um módulo acesse internals de outro módulo.
10. Nunca sacrificar isolamento por conveniência.
## 8. Limites Ideológicos
Este projeto não deve, no MVP:
- Virar ERP financeiro.
- Virar folha de pagamento.
- Virar integração bancária.
- Virar plataforma governamental oficial.
- Virar marketplace.
- Virar aplicativo mobile nativo.
- Virar BI avançado.
- Virar sistema de assinatura ICP-Brasil real.
- Implementar múltiplos processos separados sem necessidade.
- Implementar Kafka/RabbitMQ antes de justificar.
## 9. Critérios de Decisão
Em caso de dúvida, escolher:
- Auditabilidade em vez de conveniência.
- Isolamento em vez de velocidade.
- Clareza de domínio em vez de atalho técnico.
- Configuração em vez de hardcode.
- Conformidade progressiva em vez de conformidade falsa.
- Monólito modular em vez de microserviços prematuros.
- Dados mínimos em vez de coleta excessiva.
- Contrato explícito em vez de integração implícita.
- Evidência técnica em vez de suposição.
## 10. Manifesto do Projeto
Este sistema existe para registrar fatos acadêmicos com seriedade.
Ele não improvisa sobre direitos estudantis.
Ele não finge conformidade legal.
Ele não trata privacidade como detalhe.
Ele não mistura instituições, cursos e regras como se fossem uma coisa só.
Ele é modular porque respeita fronteiras.
Ele é auditável porque assume responsabilidade.
Ele é configurável porque educação não é uniforme.
Ele é progressivo porque evolução técnica honesta vale mais que promessa complexa.
Este projeto nasce para servir instituições educacionais brasileiras com disciplina técnica, transparência e respeito às pessoas.
