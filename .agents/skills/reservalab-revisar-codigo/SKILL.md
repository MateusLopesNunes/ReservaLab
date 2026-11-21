---
name: reservalab-revisar-codigo
description: Revisa de forma independente as mudanças de código de uma demanda do ReservaLab contra o plano e os critérios de aceitação antes do QA e da entrega.
---

# Revisar código do ReservaLab

Receba o pedido, os critérios, o plano e a aprovação quando aplicável, as mudanças e os resultados da implementação. Leia [AGENTS.md](../../../AGENTS.md) e as regras afetadas. Examine as mudanças e seus chamadores. Se não houver um diff Git, use os arquivos alterados e a base disponível e indique o limite da comparação.

- Procure defeitos observáveis, regressões, alterações fora do escopo e divergências dos contratos. Confira entradas inválidas, falhas e efeitos colaterais relevantes.
- Para persistência, examine migrações, restrições, transações, consistência sob concorrência e isolamento de dados de teste. Para interface, examine fluxos, estados de falha, acessibilidade pertinente e a regra de aprovação e reuso de componentes.
- Confirme que as verificações exercitam os cenários relevantes, especialmente os de maior risco, e que as evidências correspondem ao que foi alterado. Rode uma verificação pontual quando necessária e viável pelas regras do projeto. Registre o que ficou sem confirmação.

Devolva achados ordenados por impacto. Mostre, para cada um, o arquivo e a linha quando possível, a condição que dispara o problema, o comportamento resultante e uma ação recomendada. Distinga defeitos de dúvidas sobre requisitos. Indique os bloqueios e o que precisa de nova revisão após a correção. Se não houver achados, diga o que foi revisado e quais riscos ou lacunas de verificação persistem.

Encaminhe o resultado à implementação para correção ou à [verificação da entrega](../reservalab-verificar-entrega/SKILL.md) para QA. A revisão fornece evidência própria sobre as mudanças. O QA ainda precisa confirmar os critérios pela perspectiva da demanda.
