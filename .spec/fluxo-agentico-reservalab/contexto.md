# Contexto para implementação do fluxo agêntico do ReservaLab

Registro das decisões tomadas com Mateus em 21/11/2026 para continuar o trabalho em outra conversa. Este documento é contexto e plano de trabalho: as skills, os agentes e as automações descritos abaixo ainda precisam ser projetados e implementados. Verifique o estado atual do projeto antes de fazer alterações.

## Objetivo

Construir um projeto de portfólio que demonstre o desenvolvimento agêntico de uma aplicação full stack, da análise de uma demanda até implementação, testes, QA, revisão e PR. O fluxo deve ser o mais autônomo possível, com intervenção humana concentrada em decisões de produto, aprovação do resumo técnico e aprovação do PR.

A visão futura inclui demandas no Trello, uma worktree por demanda, coordenação e retomada quando houver pendências e, posteriormente, deploy. Iniciar pelo chat do Codex, validar o processo com uma funcionalidade real e só depois integrar o Trello. Não presumir que a integração, as notificações, a retomada automática ou o deploy já estão disponíveis.

## Estado do projeto

- Raiz: `/Users/Mateus/Documents/Projeto agentico`.
- Monorepo com npm workspaces: backend Node.js/Express/TypeScript em `backend/` e frontend Vue 3/Vite/TypeScript em `frontend/`.
- PostgreSQL via Docker Compose; Drizzle ORM, `pg`, Drizzle Kit e Zod configurados. O `.env` contém configuração local sensível: preserve-o e nunca inclua credenciais no contexto, no Git ou em logs.
- Há cadastro e listagem de equipamentos no backend e no frontend, além do endpoint inicial de status. Existe uma migração inicial para equipamentos. Consulte `README.md` e o código para o estado e os comandos atuais.
- A porta externa local do PostgreSQL do ReservaLab foi ajustada para 5433 em uma sessão anterior; confira o ambiente antes de usá-la. A porta 5432 já esteve ocupada por outro projeto. Nunca encerre processos ou contêineres de outro projeto para liberar portas; escolha portas livres e isole os serviços iniciados pela tarefa.
- Há testes Vitest e Vue Test Utils no frontend e Vitest/Supertest no backend, com meta de cobertura de 80%. Na última avaliação, os testes de endpoints usavam repositórios simulados e ainda não havia testes de integração automatizados com PostgreSQL isolado nem E2E configurados. Confirme o estado atual antes de planejá-los.
- `AGENTS.md` referencia regras em `.agentes/rules/`. Essas regras devem ser lidas antes de alterar o código. Na consulta de 21/11/2026, a pasta ainda não era um repositório Git; confirme antes de planejar worktrees ou PRs. Não presuma que há remoto ou integração GitHub configurados.

## Referência e adaptação

As skills de referência estão em <https://github.com/rodrigobranas/formacao-inteligencia-artificial/tree/main/spec-driven-development/example_3/.agents/skills>. Elas incluem criação de PRD, TechSpec e tarefas, execução, revisão e QA. Servem como inspiração; não copiá-las sem adaptação.

O usuário já trabalha com SDD e planos de execução. O fluxo proposto combina critérios de aceitação e especificação funcional curta com TechSpec, tarefas e revisão independente, dimensionados conforme impacto e incerteza. Para novas funcionalidades, sempre registrar comportamento, escopo e critérios; um PRD extenso não é obrigatório em toda demanda. O usuário não pretende revisar o PRD nem a TechSpec completos: precisa de perguntas objetivas e um resumo confiável para análise.

Aplicar raciocínio semelhante ao Grill Me de forma seletiva: procurar decisões e lacunas, pesquisar fatos e examinar o código antes de perguntar, sem transformar toda escolha técnica em pergunta. Regras específicas do produto devem vir das decisões do usuário ou ser registradas como premissas, não ser presumidas como fatos apenas por pesquisa externa.

As skills originais de referência exigem PRD para TechSpec e tarefas e algumas pedem aprovações adicionais; adaptá-las ao fluxo aqui acordado. A skill original de revisão é de código: o fluxo também precisa de revisão de plano antes da implementação.

## Fluxo acordado

1. **Entrada e análise:** receber a demanda no chat; consultar regras, código, documentação e decisões existentes. Identificar objetivo, escopo, dependências, riscos e incertezas; dividir demandas grandes em entregas verificáveis.
2. **Contrato funcional:** registrar comportamento esperado, critérios de aceitação, limites de escopo e cenários de falha. Separar decisões confirmadas, premissas e pendências.
3. **Pendências:** se faltar uma decisão de produto que altere o comportamento e não puder ser inferida, avisar o usuário com contexto, opções e recomendação. Aguardar a resposta antes de avançar no trabalho dependente; continuar trabalho independente quando possível. Passagem de tempo não equivale a aprovação. Questões técnicas reversíveis e compatíveis com as regras podem ser decididas autonomamente, com premissas registradas.
4. **TechSpec e tarefas:** detalhar componentes afetados, contratos, dados, migrações, riscos, critérios, testes e tarefas com dependências explícitas. Adaptar profundidade e quantidade de documentos ao tamanho e ao risco. Mapear critérios de aceitação aos testes e às tarefas.
5. **Revisão do plano:** outro agente ou execução independente procura lacunas, conflitos, regras não definidas, riscos e critérios sem cobertura. Corrigir problemas objetivos; levar decisões de produto em aberto ao usuário.
6. **Resumo para o usuário:** apresentar de forma concisa entrega, decisões confirmadas, premissas, componentes e contratos relevantes, alterações em dados e infraestrutura, cenários críticos, fora do escopo, testes, riscos e pendências. Para funcionalidades novas e mudanças de comportamento, aguardar aprovação explícita antes de implementar. Para correções pequenas dentro de comportamento já definido, apresentar resumo informativo sem exigir aprovação. A disponibilidade do Codex e suas políticas efetivas de permissão continuam prevalecendo.
7. **Implementação:** executar tarefas em worktree por demanda quando houver Git e suporte, usando ambiente e banco de testes isolados. Não presumir que worktree isola bancos, portas ou dados. Respeitar as regras do projeto; verificar suas instruções reais antes de delegar.
8. **Mudanças de plano:** se a implementação revelar necessidade de alterar comportamento, decisão de produto ou escopo aprovado, apresentar a alteração e aguardar decisão do usuário. Ajustes técnicos reversíveis dentro do escopo aprovado podem ser feitos pelo agente e registrados.
9. **Revisão e QA:** executar testes, verificações de tipo, build, cobertura aplicável, revisão de código independente e QA dos critérios, com evidências adequadas. Em alterações de interface, verificar fluxos no navegador quando a ferramenta estiver disponível. Testar persistência e concorrência em PostgreSQL de testes isolado. Registrar falhas e testes não executados; corrigir e revalidar quando possível.
10. **Conclusão e PR:** preparar PR com resumo das mudanças, decisões, resultados, evidências e limitações. O PR exige aprovação humana. Depois da aprovação humana, o agente está autorizado a fazer merge, respeitando verificações e proteções do repositório. No futuro o merge poderá disparar deploy por CI/CD; deploy e suas condições serão definidos em etapa própria.

## Aprovação manual e falhas de QA

O estado normal de concluído exige critérios de aceitação verificados, testes aplicáveis aprovados e revisão/QA sem bloqueios. O usuário autorizou uma alternativa: quando houver falha ou bloqueio, inclusive por ambiente, apresentar claramente o que falhou ou não foi verificado, evidências, causa conhecida e impacto; mediante **aprovação explícita da entrega pelo usuário**, considerar a demanda concluída por aprovação manual, com ressalva registrada. Não reclassificar testes falhos ou não executados como aprovados. A aprovação manual não invalida as proteções técnicas do repositório; não presumir sua liberação.

## Componentes Vue: decisão a aplicar às regras

O usuário aprovou mudar a regra atual de `.agentes/rules/vue-frontend.md`: a aprovação do resumo da TechSpec cobre os componentes descritos nele. Se durante a implementação for necessário um componente adicional, consultar novamente o usuário quando ele alterar a experiência ou o escopo aprovado; componentes adicionais que não alterem esses pontos podem ser decididos autonomamente, respeitando reuso e organização. A regra no arquivo ainda expressa a exigência anterior de aprovação para qualquer componente e precisa ser atualizada quando a implementação do fluxo começar.

## Skills e agentes propostos

Skills são procedimentos reutilizáveis; agentes executam responsabilidades e podem utilizar skills. Uma skill pode servir a mais de um agente, e um agente pode usar várias skills. Skills não são pré-requisito técnico para agentes, mas a ordem escolhida é fechar o processo e criar primeiro as skills principais.

Responsabilidades de skills a considerar, com nomes e quantidade a refinar durante a criação:

- Analisar demanda, identificar premissas e pendências e elaborar perguntas.
- Produzir contrato funcional e TechSpec com resumo para aprovação.
- Decompor em tarefas rastreáveis e verificáveis.
- Revisar o plano antes da implementação.
- Implementar tarefas com isolamento e verificações.
- Revisar código de forma independente.
- Executar QA por critérios e reunir evidências.
- Consolidar entrega, ressalvas e PR.

Papéis iniciais sugeridos: coordenador, planejamento, implementação, revisão e QA. Começar com poucos papéis, delegar somente quando útil e observar disponibilidade, permissões e mecanismos reais do ambiente. A revisão deve ter contexto e objetivo independentes; outra execução de IA não garante correção.

Antes de implementar skills, consulte as instruções atuais de criação de skills e a documentação do Codex para local, descoberta e configurações válidas. Atenção: as regras existentes estão em `.agentes/rules/`; não presumir que `.agentes` e `.agents` sejam intercambiáveis. Escolher caminhos de skills e configurações de agentes compatíveis com o Codex, preservando as regras existentes e ajustando referências quando necessário.

## Ordem de trabalho autorizada para a próxima conversa

1. Ler este contexto, `AGENTS.md`, as regras existentes e o estado real do projeto; documentar o fluxo e seus pontos de intervenção humana.
2. Ajustar a regra de componentes Vue conforme a decisão acima e criar as skills principais, refinando seus contratos de entrada, saída, bloqueios e verificações.
3. Definir e configurar os agentes e suas responsabilidades de acordo com os recursos disponíveis.
4. Experimentar o processo em uma funcionalidade com worktree e banco de testes isolado. Reservas foi sugerida como candidata, mas os requisitos da funcionalidade precisam ser refinados e aprovados no próprio fluxo.
5. Avaliar resultados e ajustar o processo; integrar Trello e preparar deploy em etapas posteriores.

Não criar automaticamente tarefas em serviços externos, PRs ou deploys apenas por ler este documento. Verificar o pedido da conversa atual, as autorizações existentes e as capacidades disponíveis para cada ação.
