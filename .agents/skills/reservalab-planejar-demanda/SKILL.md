---
name: reservalab-planejar-demanda
description: Analisa e planeja uma demanda do ReservaLab antes de implementar. Use no chat para definir comportamento, critérios de aceitação, TechSpec, tarefas e resumo técnico para o usuário.
---

# Planejar demanda do ReservaLab

Receba o pedido, as decisões já registradas e o estado do projeto. Leia [AGENTS.md](../../../AGENTS.md), as regras aplicáveis e o código afetado. Use o [fluxo acordado](../../../.spc/fluxo-agentico-reservalab/plano.md) para verificar os pontos de intervenção humana.

1. Registre o objetivo, o comportamento esperado, os limites, os cenários de falha e os critérios observáveis. Distinga decisões confirmadas, premissas e pendências. Para uma nova funcionalidade, produza um contrato funcional mesmo que curto. Divida demandas grandes em entregas que possam ser verificadas separadamente.
2. Consulte código, documentação e decisões anteriores antes de perguntar. Quando faltar uma decisão de produto que possa mudar o comportamento, apresente no chat o impacto, as opções e a recomendação. Registre a resposta antes do trabalho dependente. Continue a parte independente. Escolhas técnicas reversíveis dentro das regras podem ser assumidas e registradas.
3. Detalhe na TechSpec os componentes, contratos, dados, migrações, infraestrutura, riscos e testes que forem pertinentes. Decomponha em tarefas verificáveis com dependências explícitas. Identifique os critérios de aceitação e vincule cada um às tarefas e às verificações que demonstram seu atendimento.
4. Encaminhe o pedido original, o contrato, a TechSpec e as tarefas à [revisão independente de plano](../reservalab-revisar-plano/SKILL.md). Use outra execução ou um subagente quando disponível e autorizado. Incorpore os achados objetivos e encaminhe decisões de produto em aberto ao usuário. Registre quando a revisão ficar pendente e retome pelo ponto faltante.
5. Depois da revisão, apresente no chat a entrega, as decisões, as premissas, os componentes e contratos afetados, as mudanças em dados e infraestrutura, os cenários críticos, as exclusões, os testes, os riscos e as pendências. Dimensione o resumo ao impacto. Inclua os detalhes de novos componentes previstos pela [regra Vue](../../../.agentes/rules/vue-frontend.md) quando aplicável.

Guarde os registros em `.spc/<demanda>/`, aproveitando o diretório da demanda se já existir. Em trabalho pequeno, reúna os registros em um arquivo. A saída para implementação inclui o plano revisado, as tarefas, os critérios e a decisão de aprovação quando aplicável.

Para funcionalidade nova ou mudança de comportamento, aguarde a aprovação explícita do resumo antes de encaminhar à implementação. Vincule a decisão ao resumo aprovado e registre o ponto de retomada. Para uma correção pequena dentro de comportamento definido, apresente um resumo informativo e prossiga sem aprovação adicional. Silêncio e passagem de tempo mantêm a decisão pendente.
