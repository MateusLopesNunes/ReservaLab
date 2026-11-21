---
name: reservalab-implementar-demanda
description: Executa tarefas revisadas de uma demanda do ReservaLab, respeitando o resumo aprovado, o isolamento do ambiente e os pontos de decisão durante a implementação.
---

# Implementar demanda do ReservaLab

Receba a TechSpec, as tarefas, os critérios e o registro da aprovação quando aplicável. Confira o [fluxo acordado](../../../.spc/fluxo-agentico-reservalab/plano.md) e leia [AGENTS.md](../../../AGENTS.md) e as regras afetadas antes de editar.

1. Confirme o escopo e as dependências. Para funcionalidade nova ou mudança de comportamento, só implemente o que estiver coberto pela aprovação explícita do resumo. Uma correção pequena dentro do comportamento definido usa o resumo informativo. Se houver pendência, preserve o trabalho independente e registre qual parte aguarda.
2. Use uma worktree por demanda quando houver Git e suporte. Registre a limitação quando ela estiver indisponível e aponte o que depende dela. Para rodar serviços em paralelo, separe portas e recursos da demanda. A worktree separa o checkout. Confirme também a configuração dos serviços e dos dados.
3. Antes de conectar, migrar ou rodar verificações que dependam de PostgreSQL, confirme que a configuração aponta para o banco de testes isolado. Se a configuração estiver ausente ou o destino for incerto, suspenda essas ações e prossiga no trabalho independente. Evite que o carregamento do `.env` de desenvolvimento escolha o destino por padrão. Preserve credenciais e recursos de outras tarefas ou projetos.
4. Execute as tarefas na ordem das dependências. Registre ajustes técnicos reversíveis dentro do escopo. Se um ajuste mudar comportamento, regra de produto ou escopo, proponha a mudança com seu impacto e aguarde a decisão antes de alterar a parte afetada. Aplique a [regra Vue](../../../.agentes/rules/vue-frontend.md) a componentes previstos e adicionais.
5. Rode as verificações pertinentes ao que mudou e reúna os resultados por critério. Em persistência, inclua migrações, restrições e concorrência quando relevantes. Corrija falhas da mudança e repita as verificações afetadas. Registre o que ficou pendente e por quê.

Entregue as mudanças, os critérios cobertos, os resultados de verificações, os desvios e os bloqueios para [revisão de código](../reservalab-revisar-codigo/SKILL.md) e [QA](../reservalab-verificar-entrega/SKILL.md). Registre o ponto de retomada junto da demanda quando houver uma decisão pendente.
