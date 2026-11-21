# Plano de execução da etapa 2 do ReservaLab

**Etapa 2 concluída em 21/11/2026.** A regra de aprovação de componentes Vue foi atualizada e as cinco skills que guiam uma demanda no Codex estão disponíveis na raiz do projeto. O chat continua sendo o ponto de entrada. A configuração de agentes, o piloto, o Git, o Trello e o deploy pertencem a etapas posteriores. [Plano geral](plano.md) · [Contexto acordado](../../.spec/fluxo-agentico-reservalab/contexto.md).

## Arquivos e comportamento proposto

**Regra Vue.** Alterar o item de aprovação na seção de catálogo e reuso de [vue-frontend.md](../../.agentes/rules/vue-frontend.md). No resumo técnico, descrever finalidade, localização, props, eventos e justificativa dos componentes propostos, quando aplicável. A aprovação do resumo cobre os componentes ali descritos. Durante a implementação, consultar o usuário se um componente adicional alterar a experiência ou o escopo aprovado. Nos demais casos, decidir e registrar o ajuste técnico conforme as regras de organização e reuso. Manter a consulta e a atualização do catálogo conforme a regra atual.

**Skills.** A proposta inicial reúne oito responsabilidades em cinco skills, com revisão de plano e revisão de código acionáveis em sessões independentes. Usar `.agents/skills/<nome>/SKILL.md` na raiz do projeto. Cada skill terá `name` e `description` em YAML e instruções em português. Criar referências ou scripts somente quando houver uma necessidade concreta. [Documentação de skills no Codex](https://learn.chatgpt.com/docs/build-skills).

| Skill proposta | Entrada e acionamento | Saída ou condição de espera |
| --- | --- | --- |
| `reservalab-planejar-demanda` | Pedido no chat, regras e código existentes. | Contrato funcional, TechSpec e tarefas proporcionais à demanda. Se faltar decisão de produto, retorna opções e recomendação e espera para o trabalho dependente. Após revisão independente, entrega o resumo técnico e aguarda aprovação explícita para funcionalidade nova ou mudança de comportamento. Correção pequena dentro do comportamento definido recebe resumo informativo. |
| `reservalab-revisar-plano` | Demanda original, critérios, TechSpec e tarefas, antes do resumo final. | Achados sobre lacunas, conflitos e critérios sem verificação, com referências. Distingue correções objetivas de decisões de produto. Devolve os achados a quem mantém o plano. |
| `reservalab-implementar-demanda` | Tarefas e critérios revisados, aprovação quando aplicável e ambiente disponível. | Alterações e resultados de verificações, com registro de ajustes técnicos. Se surgir mudança de comportamento, escopo ou regra de produto, apresenta o impacto e espera pela decisão antes de avançar na parte afetada. Confirma isolamento antes de usar o banco de testes. |
| `reservalab-revisar-codigo` | Mudanças, critérios e plano aprovado quando aplicável. | Achados com prioridade, localização, impacto e evidência. Registra o que foi inspecionado e devolve problemas à implementação para correção e nova revisão, quando necessária. |
| `reservalab-verificar-entrega` | Critérios, mudanças e resultados de implementação e revisão. | QA com evidência por critério, resultados de testes e resumo para PR. Se a verificação falhar ou estiver bloqueada, indica o que falta, a causa conhecida e o impacto. Quando houver aceitação explícita, registra a entrega como concluída por aprovação manual e preserva os resultados originais. O merge exige aprovação do PR e o atendimento às proteções do repositório. |

As skills recebem os registros da demanda anterior e entregam o que a etapa seguinte precisa. Usar como padrão `.spc/<demanda>/` para guardar contrato, TechSpec, tarefas, decisões, evidências e ponto de retomada. Os registros podem ser reunidos em um arquivo quando a demanda for pequena. Identificar cada critério de aceitação nas tarefas e evidências correspondentes. A etapa 3 definirá os papéis e como acionar cada revisão com independência.

## Ordem de execução

| Tarefa | Trabalho e dependência | Como concluir |
| --- | --- | --- |
| 2.1 | Atualizar a regra Vue com o texto acordado acima. | Conferir o tratamento de componentes cobertos pelo resumo e de componentes adicionais, com e sem impacto na experiência ou no escopo. |
| 2.2 | Criar as skills de planejamento e revisão de plano. Usa a regra Vue atualizada no conteúdo do resumo. | Revisar a rastreabilidade de critérios, as entradas e saídas e o tratamento distinto de decisões de produto e escolhas técnicas reversíveis. |
| 2.3 | Criar as skills de implementação, revisão de código e verificação da entrega. Usa os registros e as decisões produzidos em 2.2. | Conferir aprovações, mudanças de escopo, isolamento, QA, registro de ressalvas e aprovação do PR. |
| 2.4 | Validar estrutura, descoberta e comportamento das cinco skills depois de 2.1 a 2.3. | Registrar as verificações executadas e seus resultados, corrigir lacunas e deixar o uso no piloto vinculado à etapa 4. |

As [skills de referência](https://github.com/rodrigobranas/formacao-inteligencia-artificial/tree/main/spec-driven-development/example_3/.agents/skills) orientam a divisão de responsabilidades. No ReservaLab, o contrato funcional pode ser curto, a revisão de plano precede a aprovação, e o usuário recebe um resumo técnico proporcional ao risco da mudança.

## Verificação da etapa 2

1. Validar os cinco `SKILL.md` com o `quick_validate.py` da skill `skill-creator` e conferir os links locais. O Python padrão deste ambiente está sem PyYAML, dependência do validador. Usar um ambiente Python isolado para a ferramenta, sem incluir essa dependência nos workspaces npm.
2. Conferir se o Codex descobre as skills a partir da raiz do projeto e consegue carregar pelo menos uma por invocação explícita. Se a descoberta estiver indisponível, registrar a limitação e distinguir leitura direta de carregamento como skill.
3. Fazer ensaios com demandas simuladas. Usar entradas suficientes para observar a decisão e reunir as saídas, sem executar comandos que afetem serviços do projeto ou serviços externos.

| Cenário simulado | Resultado esperado |
| --- | --- |
| Funcionalidade com regra de produto indefinida | A skill de planejamento pede uma decisão objetiva e bloqueia a parte dependente. Depois da decisão, a revisão aponta critérios sem cobertura antes de o resumo seguir para aprovação. |
| Funcionalidade com resumo técnico aprovado | A implementação reconhece a aprovação, usa os critérios nas verificações e entrega os resultados para revisão e QA. A entrega pode seguir para preparação do PR com as evidências. |
| Correção pequena ou mudança durante a execução | A correção dentro do comportamento definido recebe resumo informativo. A mudança que altera comportamento ou escopo exige nova decisão. Os três casos de componentes Vue seguem a regra atualizada. |
| Persistência com isolamento ausente | A execução identifica a falta do ambiente de teste antes de usar o banco, continua o trabalho independente e registra a verificação pendente. |
| QA falho e PR preparado | A revisão identifica o defeito, e a entrega registra evidência e impacto. A aprovação manual, quando explícita, mantém a falha registrada. O PR continua sujeito à sua própria aprovação e às proteções do repositório. |

A etapa termina com a regra atualizada, os cinco contratos revisados e evidências de estrutura, descoberta e ensaios. Registrar qualquer verificação indisponível no resumo da entrega. O piloto usará uma demanda real para avaliar a eficácia das skills e da coordenação.

## Resultado da execução

A regra Vue passou a usar a aprovação do resumo técnico. As cinco skills foram implementadas nos caminhos previstos com instruções e metadados no `SKILL.md`.

| Verificação | Evidência |
| --- | --- |
| Estrutura e referências | Os cinco arquivos passaram no `quick_validate.py` da skill `skill-creator`, executado em um ambiente Python temporário. Os 15 links locais das skills apontam para arquivos existentes. |
| Descoberta no Codex | A chamada `skills/list` do App Server encontrou as cinco skills ativas na raiz do ReservaLab. Um turno efêmero carregou explicitamente `reservalab-implementar-demanda` e concluiu que o PostgreSQL de desenvolvimento não serve para testes de integração. A resposta preservou a tarefa independente com mocks e registrou a condição para retomar. |
| Planejamento e revisão simulados | O ensaio apresentou opções diante de uma regra de produto indefinida e interrompeu o trabalho dependente. Em um plano separado, a revisão apontou falta de garantia de concorrência no banco e um teste de listagem mapeado ao critério errado. |
| Implementação simulada | O ensaio aceitou o componente coberto pelo resumo e a extração interna equivalente. Manteve a exclusão de histórico pendente por mudar escopo e experiência. A correção de grafia seguiu com resumo informativo. Com apenas o banco de desenvolvimento disponível, os testes de persistência ficaram pendentes e a tarefa independente pôde avançar. |
| Revisão de código e QA simulados | O ensaio identificou a falha de concorrência e a lacuna do teste sequencial. A aceitação explícita simulada concluiu a entrega por aprovação manual, manteve o critério como falho e deixou a aprovação do PR pendente. |

Os ensaios foram independentes e usaram demandas fictícias. A execução não precisou iniciar a aplicação, usar PostgreSQL, executar a suíte do produto ou publicar um PR. A próxima etapa é definir os agentes e como coordenar o fluxo.
