---
name: reservalab-revisar-plano
description: Revisa de forma independente o contrato funcional, a TechSpec e as tarefas de uma demanda do ReservaLab antes do resumo técnico e da implementação.
---

# Revisar plano do ReservaLab

Receba o pedido original, as decisões confirmadas e os registros do plano. Use [AGENTS.md](../../../AGENTS.md), as regras aplicáveis e o código como referências. Faça uma leitura independente das conclusões de quem planejou. Identifique artefatos ausentes que limitem a revisão.

- Compare o comportamento, os limites e os cenários de falha com o pedido e com as decisões confirmadas. Procure premissas tratadas como fatos, regras de produto em aberto e conflitos entre os documentos.
- Em formulários novos ou campos com comportamento alterado, confira se o contrato e o resumo esclarecem apresentação e preenchimento, obrigatoriedade, validações e, quando houver opções, origem, valores iniciais e dependências. Identifique estados de carregamento, lista vazia e falha quando aplicáveis. Aponte escolhas que afetem a experiência e ainda precisem de decisão.
- Rastreie cada critério de aceitação até a tarefa que o entrega e a verificação que produz evidência. Procure dependências faltantes, testes que cobrem outro comportamento e verificações inviáveis no ambiente descrito.
- Confira contratos e componentes, dados, migrações, riscos, isolamento e concorrência na profundidade exigida pela demanda. Para interface, verifique se o plano inclui os componentes previstos pela regra Vue e uma forma de verificar os fluxos afetados.
- Verifique se o resumo técnico poderá explicar as decisões com clareza e se os pontos de intervenção respeitam o [fluxo acordado](../../../.spc/fluxo-agentico-reservalab/plano.md).

Entregue os achados a quem mantém o plano. Para cada achado, indique impacto, evidência com referência ao artefato ou código, e uma correção sugerida ou pergunta de produto. Distinga achados que bloqueiam o resumo, lacunas que podem ser corrigidas no plano e decisões que cabem ao usuário. Indique quais critérios ficaram sem cobertura. Se a revisão estiver limpa, explicite o que foi conferido e eventuais limites. A decisão de aprovação continua com o usuário quando aplicável.
