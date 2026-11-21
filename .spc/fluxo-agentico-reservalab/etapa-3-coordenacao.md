# Coordenação dos agentes do ReservaLab

O chat principal coordena a demanda e usa a skill de planejamento. Três agentes locais executam implementação, revisão independente e QA. O coordenador mantém o registro da demanda e trata as decisões e aprovações com o usuário. [Plano geral](plano.md) · [Skills e resultados da etapa 2](etapa-2-plano-de-execucao.md).

## Papéis e repasses

| Papel | Recebe | Devolve |
| --- | --- | --- |
| Chat principal com `reservalab-planejar-demanda` | Pedido, regras do projeto e decisões já registradas. | Contrato funcional, TechSpec e tarefas. Consolida achados, solicita as decisões previstas no fluxo e registra a resposta e o ponto de retomada em `.spc/<demanda>/`. |
| [reservalab_revisao](../../.codex/agents/reservalab_revisao.toml) com `reservalab-revisar-plano` ou `reservalab-revisar-codigo` | Modo da revisão, pedido e critérios. No modo plano, contrato, TechSpec e tarefas. No modo código, plano, versão das mudanças e resultados de implementação. | Achados com localização, evidência e impacto. Distingue uma correção objetiva de uma decisão de produto. |
| [reservalab_implementacao](../../.codex/agents/reservalab_implementacao.toml) com `reservalab-implementar-demanda` | Tarefas, critérios, worktree ou raiz autorizada, ambiente e evidência da aprovação quando aplicável. | Mudanças, resultados das verificações, desvios e bloqueios. |
| [reservalab_qa](../../.codex/agents/reservalab_qa.toml) com `reservalab-verificar-entrega` | Critérios de aceitação, versão candidata, ambiente de teste e resultados anteriores. | Parecer por critério, evidências, limitações e resumo para o PR. |

As configurações locais ficam em `.codex/agents/`. Os papéis usam o modelo e as permissões definidos pela sessão e seus padrões efetivos. As instruções de cada papel delimitam sua atuação. O isolamento do checkout e dos serviços deve ser definido no ambiente da demanda. [Subagentes no Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents) · [Worktrees do Codex](https://learn.chatgpt.com/docs/environments/git-worktrees).

## Sequência de uma demanda

1. O coordenador planeja e registra os critérios em `.spc/<demanda>/`. Quando faltar uma decisão de produto, faz a pergunta no chat principal e continua o trabalho independente.
2. O coordenador envia o pedido e os artefatos a uma nova execução de revisão de plano. Para preservar a independência, passe os artefatos e o objetivo e evite encaminhar o parecer de quem elaborou o plano. Incorpore os achados antes de apresentar o resumo. Em funcionalidade nova ou mudança de comportamento, aguarde a aprovação explícita do resumo.
3. Depois do aval aplicável, encaminhe a implementação com as tarefas delegadas e o ambiente da demanda. Coordene as mudanças para que tarefas que escrevam nos mesmos arquivos ocorram em sequência. Se surgir mudança de comportamento ou escopo, o agente devolve a proposta ao chat principal e a parte afetada aguarda a decisão.
4. Envie a versão candidata para uma nova execução de revisão de código e, após tratar bloqueios, encaminhe a versão revisada ao QA. A revisão de código começa com contexto próprio, distinto da execução que revisou o plano. Reencaminhe correções para nova revisão e revalidação quando afetarem as evidências anteriores.
5. Consolide resultados e ressalvas no chat principal. O QA prepara o resumo do PR. A aceitação manual de uma entrega com falha mantém o resultado original e exige decisão explícita. O merge depende da aprovação humana do PR e do atendimento às verificações e proteções do repositório.

Em cada repasse, informe o objetivo, o papel, os caminhos dos artefatos, a versão ou base de comparação, o ambiente, o que pode ser alterado e a saída esperada. Passe os critérios e decisões confirmadas que sejam necessários à etapa. Mantenha as credenciais no ambiente.

## Quando houver bloqueio

Se o agente personalizado estiver indisponível, use uma execução independente quando o ambiente permitir. Forneça a skill da função, os artefatos e os limites da tarefa. Registre qual mecanismo foi usado. Se nenhuma revisão independente puder ser feita, registre a lacuna e o impacto no fluxo. Para o piloto, confirme o Git e a worktree, o banco isolado e a disponibilidade do remoto no ponto em que cada recurso for necessário.

Para retomar uma demanda, leia o registro em `.spc/<demanda>/`, confirme a última decisão e a versão dos artefatos e prossiga do primeiro trabalho dependente liberado. As perguntas ao usuário e as aprovações ficam no chat principal.

## Validação da etapa 3

Em 21/11/2026, os três arquivos TOML foram validados e os caminhos para as skills e o guia foram conferidos. Um ensaio efêmero no App Server do Codex a partir da raiz do projeto abriu quatro execuções. O papel de revisão foi usado em duas sessões independentes. Implementação e QA tiveram uma sessão cada.

- A revisão de plano identificou que o teste de formato não cobria o critério de duplicidade.
- A revisão de código apontou que retornar 204 sempre violava o critério de 404 para item inexistente.
- A implementação manteve a tarefa pendente porque a mensagem do usuário adiava a revisão do resumo.
- O QA manteve o critério sem verificação e a entrega pendente quando só havia banco de desenvolvimento e faltava uma decisão sobre a ressalva.

Os cenários foram simulados. A execução com uma funcionalidade real, worktree e PostgreSQL de testes fica para o piloto.
