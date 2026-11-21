# Regras de testes

Estas regras se aplicam aos testes do backend. Os exemplos em TypeScript também orientam projetos JavaScript, com as adaptações necessárias.

## Cobertura obrigatória

<critical>**Todo código deve ser coberto por testes automatizados. Esta é uma regra crítica e não deve ser ignorada.**</critical>

A cobertura mínima exigida é de 80%. O percentual, entretanto, não é o único critério de qualidade: os testes devem validar comportamentos, requisitos e cenários relevantes por meio de boas assertions ou expects.

A prioridade deve ser dada ao código de maior risco para o negócio. Por exemplo, o fluxo de checkout é mais crítico do que o cadastro de uma categoria de produto e deve receber maior profundidade de testes, incluindo cenários de sucesso, falha, limites e recuperação.

Não aumente a cobertura apenas para atingir o percentual mínimo. Código sem comportamento relevante não deve receber testes artificiais, e código crítico não deve ficar sem testes porque o percentual geral já foi alcançado.

## Princípio FIRST

Os testes devem seguir o princípio FIRST. O aspecto Timely pode ser ignorado neste projeto.

### Fast

Os testes devem executar rapidamente. Priorize testes unitários e evite dependências externas lentas, como rede, banco de dados real, filas e serviços de terceiros.

Use stubs para substituir dependências cuja execução não seja relevante para o comportamento testado.

```ts
const paymentGateway = {
  authorize: async () => ({ authorized: true }),
};

const result = await checkoutService.checkout(order, paymentGateway);

expect(result.status).toBe('approved');
```

### Independent

Cada teste deve ser independente dos demais. Um teste não pode depender da ordem de execução, do estado criado por outro teste ou de dados compartilhados que possam ser alterados.

Prepare os dados necessários dentro do próprio teste ou em uma configuração isolada. Se um teste falhar, os demais devem continuar capazes de informar seus próprios resultados.

```ts
it('calcula o frete para um pedido válido', () => {
  const order = makeOrder({ total: 100 });

  expect(calculateShipping(order)).toBe(10);
});
```

### Repeatable

Ao serem executados repetidamente, os testes devem produzir os mesmos resultados. Não dependa do horário atual, de números aleatórios, de chamadas externas ou de dados mutáveis.

Use mocks para controlar o relógio, geradores aleatórios e respostas de APIs externas.

```ts
vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));

expect(createExpirationDate()).toEqual(new Date('2026-01-16T12:00:00.000Z'));
```

Restaure mocks e spies após cada teste para impedir vazamento de estado entre casos.

### Self-validated

O próprio teste deve detectar uma falha de comportamento. Testes que apenas executam código, verificam cobertura ou não possuem assertions significativas não são suficientes.

Valide o retorno, o estado final, os efeitos colaterais e as interações relevantes com dependências. Uma assertion deve representar um requisito do comportamento testado.

```ts
it('recusa um checkout sem itens', async () => {
  const result = await checkoutService.checkout({ items: [] });

  expect(result).toEqual({
    status: 'rejected',
    reason: 'ORDER_EMPTY',
  });
});
```

## Estrutura dos testes

Use uma destas estruturas, mantendo cada teste claro e focado:

- Given/When/Then: contexto, ação e resultado esperado.
- AAA (Arrange/Act/Assert): preparação, execução e verificação.

Cada teste deve verificar um único conceito ou comportamento. Não misture requisitos diferentes no mesmo caso. Prefira vários testes pequenos e expressivos a um teste com muitas razões possíveis para falhar.

```ts
it('retorna erro quando o e-mail é inválido', () => {
  const input = { email: 'invalido' };

  const result = validateUser(input);

  expect(result).toEqual({ valid: false, error: 'INVALID_EMAIL' });
});
```

Os nomes dos testes devem descrever o requisito observado, incluindo a condição e o resultado esperado. Evite nomes genéricos como `deve funcionar` ou `teste do serviço`.

## Ordem de criação dos testes

Para obter o melhor resultado com eficiência, crie os testes nesta ordem:

1. Identifique os requisitos e classifique os fluxos por risco e impacto no negócio.
2. Comece pelas regras de negócio críticas no backend, cobrindo primeiro os testes unitários.
3. Adicione testes unitários para validações, estados de erro, limites e transformações de dados.
4. Crie testes de integração para contratos HTTP, persistência e colaboração entre módulos.
5. Finalize com poucos testes E2E para os fluxos críticos completos, como login, checkout e confirmação de pedido.
6. Execute a suíte, analise falhas e lacunas de cobertura e só então complemente cenários menos críticos.

Essa ordem reduz o feedback inicial, favorece testes rápidos e evita usar E2E para descobrir problemas que poderiam ser identificados em testes unitários.

## Pirâmide de testes

Distribua os testes conforme a pirâmide de testes:

1. Uma base ampla de testes unitários, rápidos e isolados, para regras de negócio e funções.
2. Uma quantidade menor de testes de integração, verificando a colaboração entre módulos, adaptadores, rotas e persistência.
3. Uma quantidade reduzida de testes E2E, cobrindo os fluxos críticos completos pela perspectiva do usuário.

Não use testes E2E para substituir testes unitários ou de integração. O checkout, por exemplo, deve ter regras de cálculo e validação testadas unitariamente, integração com pagamento testada em integração e o fluxo essencial coberto por E2E.

## Ferramentas e organização

Para projetos Node.js e TypeScript que utilizem Vitest, use-o para testes unitários e de integração e configure a verificação de cobertura mínima de 80%. Use Playwright para testes E2E quando aplicável, organizados separadamente dos testes unitários e de integração.

Os testes do backend devem validar regras de negócio, contratos HTTP, códigos de status, payloads, erros e efeitos relevantes. Mocks, stubs e fakes devem substituir dependências externas ou lentas sem esconder a integração que o teste pretende verificar. Em testes de integração, prefira dependências controladas e ambientes isolados.

Antes de concluir uma alteração, execute os testes e a verificação de cobertura dos módulos afetados. A cobertura mínima é uma meta; reporte eventuais limitações do projeto existente e proteja os cenários críticos.
