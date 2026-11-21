# Plano de implementação do fluxo agêntico do ReservaLab

**Etapa 1 concluída em 21/11/2026.** O fluxo começa no chat do Codex e será validado com uma funcionalidade real. Este plano registra o diagnóstico, as aprovações e as dependências para as próximas etapas. As decisões acordadas estão no [contexto original](../../.spec/fluxo-agentico-reservalab/contexto.md).

## Diagnóstico da etapa 1

| Área | Constatação | Implicação |
| --- | --- | --- |
| Aplicação | Monorepo TypeScript com npm workspaces, backend Express e frontend Vue 3 com Vite. A API expõe `GET /api/status`, `GET /api/equipment` e `POST /api/equipment`. A tela `/equipamentos` cadastra e lista equipamentos. | Essa é a base para o piloto. Reservas ainda não existem no código e seus requisitos serão definidos no próprio fluxo. |
| Persistência | Drizzle e `pg` usam `DATABASE_URL`. Há uma migração inicial de equipamentos. O Docker Compose publicou o PostgreSQL de desenvolvimento em `127.0.0.1:5433` e o serviço estava em execução. A porta 5432 também estava ocupada. | Revalidar portas no piloto e provisionar um banco de testes isolado com configuração e dados próprios. |
| Testes | Vitest em ambos os aplicativos, Supertest no backend e Vue Test Utils com jsdom no frontend. Os testes HTTP de equipamentos simulam o repositório, e os testes do repositório simulam o cliente de banco. Há limite de 80% para linhas, branches, funções e statements por aplicativo. | A integração automatizada com PostgreSQL real ainda precisa ser preparada. Lint e E2E de navegador ainda não estão configurados. |
| Git e PR | A pasta não faz parte de um repositório Git. A sessão expõe recursos de worktree, mas falta a base Git local. Não há remoto configurado para esta pasta. | Uma worktree exige um repositório com commit de base. Para validar o ciclo até o PR, também será preciso um remoto autorizado e acesso de publicação e revisão. |
| Configuração do fluxo | As regras estão em `.agentes/rules/` e são referenciadas em `AGENTS.md`. O projeto ainda não tem skills ou agentes do fluxo configurados. | As próximas etapas usam `.agents/skills/` para skills e, caso sejam necessários agentes personalizados, `.codex/agents/`, conforme a documentação do Codex. |

A base do diagnóstico está em [AGENTS.md](../../AGENTS.md), [README](../../README.md), [comandos da raiz](../../package.json), [rotas da API](../../backend/src/app.ts), [entrada do frontend](../../frontend/src/main.ts), [Compose](../../compose.yaml) e [migração inicial](../../backend/drizzle/0000_sparkling_zaladane.sql). A inspeção foi documental e estática, com consulta ao estado do Docker e das portas. Os testes, a cobertura, o build e a conexão real com o banco não foram executados nesta etapa.

## Fluxo de uma demanda

1. **Analisar no chat.** Ler as regras e o código afetado. Registrar objetivo, comportamento, critérios de aceitação, cenários de falha, escopo, premissas e pendências. Dividir demandas grandes em entregas verificáveis. O contrato funcional é obrigatório para funcionalidades novas e pode ser curto.
2. **Resolver decisões de produto.** Investigar primeiro. Se faltar uma decisão que mude o comportamento, apresentar contexto, opções e recomendação. Aguardar a resposta para o trabalho dependente e seguir no que for independente. O agente pode tomar decisões técnicas reversíveis dentro das regras e registrar a premissa.
3. **Planejar e revisar.** Descrever na TechSpec os componentes, contratos, dados, migrações, riscos e verificações pertinentes. Ligar cada critério às tarefas e aos testes correspondentes. Uma revisão independente do plano procura regras indefinidas, conflitos e critérios sem cobertura. Corrigir achados objetivos e levar decisões de produto ao usuário.
4. **Apresentar o resumo técnico.** Expor entrega, decisões, premissas, componentes e contratos afetados, dados e infraestrutura, cenários críticos, testes, itens fora do escopo, riscos e pendências. Obter aprovação explícita para funcionalidades novas e mudanças de comportamento. Uma correção pequena dentro de comportamento já definido recebe resumo informativo.
5. **Implementar e registrar desvios.** Usar uma worktree por demanda quando houver Git e suporte. Manter ambiente e banco de testes isolados. Registrar ajustes técnicos reversíveis dentro do escopo aprovado. Se surgir mudança de comportamento, regra de produto ou escopo, apresentar o impacto e aguardar a decisão antes do trabalho afetado.
6. **Revisar e verificar.** Fazer revisão de código independente e QA pelos critérios de aceitação. Rodar `npm test`, `npm run typecheck`, `npm run build` e `npm run test:coverage` conforme o impacto. Verificar a interface no navegador quando disponível e testar persistência e concorrência aplicáveis no PostgreSQL de testes. Registrar resultados e evidências por critério. Corrigir e revalidar falhas quando possível.
7. **Consolidar a entrega e o PR.** Preparar resumo das mudanças, resultados, evidências e limitações. A entrega normal exige critérios verificados, testes aplicáveis aprovados e revisão e QA sem bloqueios. O merge depende da aprovação humana do PR e do cumprimento das verificações e proteções do repositório.

## Pontos de intervenção humana

| Situação | Decisão ou aprovação necessária |
| --- | --- |
| Regra de produto em aberto | O usuário decide antes de prosseguir com o trabalho que depende da resposta. |
| Funcionalidade nova ou mudança de comportamento | O usuário aprova explicitamente o resumo técnico antes da implementação. |
| Mudança durante a execução | O usuário decide quando o ajuste altera comportamento, regra de produto ou escopo aprovado. Depois da atualização da regra Vue, os componentes descritos no resumo ficam cobertos pela aprovação. Um componente adicional reabre a decisão se afetar a experiência ou o escopo aprovado. |
| Falha ou bloqueio de verificação | O usuário pode aceitar a entrega explicitamente. Registrar como **concluída por aprovação manual**, com o que falhou ou ficou sem verificação, a evidência, a causa conhecida e o impacto. Manter o resultado original dos testes e respeitar as proteções do repositório. |
| PR pronto | O usuário aprova o PR antes do merge. A aprovação manual da entrega e a aprovação do PR são decisões distintas. |

Registrar junto da demanda o resumo ou a mudança que foi aprovada, a decisão do usuário e o ponto de retomada. A passagem de tempo não substitui nenhuma aprovação explícita. As permissões efetivas do Codex continuam valendo a cada ação.

## Próximas etapas e dependências

- **Etapa 2 — Regra Vue e skills principais (concluída).** A [regra de componentes](../../.agentes/rules/vue-frontend.md) foi atualizada e as cinco skills foram criadas. O [plano de execução e resultados](etapa-2-plano-de-execucao.md) registra os contratos, as verificações e os ensaios.
- **Etapa 3 — Coordenação e papéis (concluída).** O chat principal coordena e planeja. Três agentes locais foram configurados para implementação, revisão independente e QA. O [guia de coordenação](etapa-3-coordenacao.md) registra os papéis, os repasses, os pontos de decisão e o ensaio no Codex.
- **Etapa 4 — Piloto.** Escolher a funcionalidade e aprovar seu resumo técnico. Preparar o Git local antes de criar a worktree e validar o acesso ao remoto antes de abrir o PR. Separar projeto Compose, volume, porta, banco e configuração de testes. O backend e o Drizzle Kit podem ler o `.env` da raiz, então o piloto precisa confirmar o destino de teste antes das migrações e impedir o uso do banco de desenvolvimento por configuração ausente. Preservar o `.env` local e processos de outros projetos. Se o piloto for Reservas, planejar a garantia de concorrência no PostgreSQL e verificar requisições simultâneas no banco isolado. [Worktrees do Codex](https://learn.chatgpt.com/docs/environments/git-worktrees).
- **Etapa 5 — Avaliação do piloto.** Usar o histórico da demanda para identificar retrabalho, pontos de espera e lacunas nas verificações. Ajustar o fluxo antes de planejar integração com Trello, notificações, retomada automática e deploy. Essas capacidades dependem de validação própria.

O isolamento do banco e o Git local são pré-requisitos para a execução do piloto como planejado. A capacidade de abrir e revisar PR depende do remoto que vier a ser configurado.
