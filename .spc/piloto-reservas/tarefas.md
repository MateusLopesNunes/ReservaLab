# Tarefas e verificação do piloto de Reservas

[Contrato funcional](contrato-funcional.md) · [TechSpec](techspec.md)

## Ordem de execução

| Tarefa | Depende de | Entrega verificável | Critérios |
| --- | --- | --- | --- |
| T01 | Resumo aprovado | Preparar worktree, instalar dependências a partir do lockfile, configurar PostgreSQL isolado e runner fora da suíte padrão. Provar aborto quando o destino faltar ou divergir e fornecer a URL validada às migrações, ao runner e ao backend do navegador. Aplicar a migração base e garantir limpeza dos recursos do piloto. | Suporte a CA-01 a CA-08 |
| T02 | T01 | Criar migrations de conta e sessão, validação do perfil e e-mail, hash de senha e endpoint de cadastro. Cobrir validação, persistência e unicidade. | CA-01, CA-02 |
| T03 | T02 | Implementar login, verificação de JWT, identificação da conta, rotação, revogação, logout, cookie, controles de origem e proteção das APIs. Testar 429 e teto de hashes. Atualizar exemplos de ambiente e instruções locais. Manter status público. | CA-02, CA-03, CA-04 |
| T04 | T03 | Integrar Vue com sessão, navegação, cadastro, login e acesso autenticado a equipamentos. Cobrir renovação em tela aberta e recuperação ao recarregar. Testar troca de conta sem repetir ação anterior e mensagens de erro. | CA-01, CA-02, CA-03, CA-04 |
| T05 | T03 | Implementar migration e API de reservas, vínculo com conta e equipamento, validação, concorrência no banco e consulta sem dados pessoais. | CA-05, CA-06, CA-07, CA-08 |
| T06 | T04, T05 | Implementar página de reservas, formatação de horários, seleção de equipamento, formulário, agenda e estados de falha. | CA-05, CA-06, CA-07, CA-08 |
| T07 | T06 | Executar verificações globais, revisão de código independente e QA. Corrigir e revalidar achados. Consolidar evidências e preparar o PR. | CA-01 a CA-08 |

## Evidências esperadas

| Critério | Verificações |
| --- | --- |
| CA-01 | Testes de schema para cada campo ausente ou inválido, calendário, limite de senha e JSON malformado. HTTP e PostgreSQL para e-mail normalizado e corrida de duplicidade. Vue e navegador para cadastro e encaminhamento ao login. |
| CA-02 | HTTP para login correto/incorreto, presença do JWT, refresh no cookie e identidade em `/me`; inspeção de projeções e logs para ausência de segredos. Testar limitação de tentativas e de hashes. Verificar que banco armazena hash de senha e digest de refresh. |
| CA-03 | Matriz HTTP de rotas públicas e protegidas com JWT ausente, inválido, expirado e válido; teste no navegador com entrada direta e redirecionamento. Contratos existentes de equipamentos revisados com sessão. |
| CA-04 | HTTP e PostgreSQL para refresh, revogação, expiração, rejeição de origem, replay e concorrência transacional. Verificar revogação da família persistida após 401 e logout invalidando JWT anterior. Vue/Vitest para renovação, erro, recuperação em tela aberta e descarte de uma ação quando a conta ou sessão muda. HTTP para divergência de cookie e Bearer no logout. Navegador para recarregar, sair e abrir duas abas na mesma origem. |
| CA-05 | HTTP e PostgreSQL para criação e vínculo com `sub`. Tentativa de incluir `userId` deve falhar. Navegador para criar e consultar a própria reserva. |
| CA-06 | Testes unitários e HTTP com relógio controlado para UUID, fuso, início igual ou anterior ao relógio, período inválido e 404. Vue para horário local inválido em transição de fuso, feedback e preservação do horário selecionado. |
| CA-07 | Integração com PostgreSQL real e duas requisições em paralelo usando conexões independentes e uma barreira de teste que mantenha a primeira transação de inserção aberta até a segunda tentativa. Confirmar um 201, um 409 e uma única linha persistida. Cobrir sobreposição comum, intervalo adjacente e equipamentos diferentes. Validar a migração com equipamento preexistente e em banco vazio. Vue e navegador para mensagem de conflito. |
| CA-08 | Consultas HTTP com ocupação em curso e futura, ordenação, lista vazia e duas contas. Verificar `isMine` e ausência de dados pessoais de outros usuários. Vue para carregamento, falha, estado vazio e descarte de respostas atrasadas após troca rápida de equipamento. |

A entrega inclui `npm test`, `npm run typecheck`, `npm run build` e `npm run test:coverage` com limite de 80% por aplicativo, mais o runner PostgreSQL isolado e a verificação dos fluxos no navegador quando disponível. Registrar por critério o que passou, o que falhou e o que ficou sem verificação. Reunir evidências de execução, revisão e QA antes de apresentar um resumo de entrega e de PR.
