---
name: reservalab-verificar-entrega
description: Valida critérios de aceitação e resultados de QA de uma demanda do ReservaLab, registra ressalvas e prepara o resumo para o PR.
---

# Verificar entrega do ReservaLab

Receba o contrato, o resumo técnico aprovado quando aplicável, os critérios, as mudanças, as verificações feitas e o resultado da revisão de código. Leia [AGENTS.md](../../../AGENTS.md), as regras aplicáveis e o [fluxo acordado](../../../.spc/fluxo-agentico-reservalab/plano.md).

1. Confira cada critério pelos fluxos e cenários de falha pertinentes. Use as evidências existentes quando forem válidas para a revisão atual e execute as verificações faltantes que forem viáveis. Use `npm test`, `npm run typecheck`, `npm run build` e `npm run test:coverage` conforme o impacto. Registre o comando, o resultado, a limitação e o vínculo com os critérios. A meta de cobertura é de pelo menos 80% em cada aplicativo.
2. Para mudanças de interface, verifique os fluxos no navegador quando disponível. Para persistência, confirme o isolamento do PostgreSQL de testes antes de executar migrações ou verificações e cubra concorrência quando aplicável. Quando o ambiente impedir a verificação, registre a causa conhecida e o impacto.
3. Devolva bloqueios à implementação com passos para verificar o problema. Revalide os critérios afetados após as correções e solicite nova revisão quando a mudança afetar o parecer anterior.
4. Consolide os resultados por critério e prepare a descrição do PR com mudanças, decisões, evidências e limitações. Uma entrega normal exige critérios verificados, testes aplicáveis aprovados e revisão e QA sem bloqueios. Mantenha separados os estados aprovado, falhou e não verificado.

Se restar falha ou bloqueio, apresente ao usuário o que ocorreu, a evidência, a causa conhecida e o impacto. Registre **concluída por aprovação manual** apenas com aceitação explícita da entrega. Preserve a falha ou a verificação pendente no registro e no resumo do PR.

Antes de abrir um PR, confirme que a demanda autoriza essa ação e que há remoto e acesso. A aprovação manual da entrega e a aprovação do PR são decisões distintas. Faça merge somente após aprovação humana do PR e cumprimento das verificações e proteções do repositório. Registre junto da demanda os resultados, as aprovações aplicáveis e o ponto de retomada se houver pendência.
