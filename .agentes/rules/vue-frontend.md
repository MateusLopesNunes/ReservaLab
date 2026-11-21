# Regras do frontend Vue

Estas regras orientam o frontend do ReservaLab, que usa Vue 3 e TypeScript.

## Vue e TypeScript

- Escreva código novo em TypeScript, utilizando Vue 3, Composition API e componentes `.vue` com `<script setup lang="ts">`.
- Tipe props, eventos, dados de API e estados; aproveite inferência clara e evite `any`. Valide dados externos quando necessário, pois tipos não validam respostas em tempo de execução.
- Use Zod para validar formulários e respostas externas. Mantenha schemas em `schemas/` dentro do módulo e derive tipos dos schemas quando apropriado.
- Use nomes expressivos e mantenha componentes e funções com responsabilidades claras.

## Organização por funcionalidade

- Organize funcionalidades de negócio em `frontend/src/modules/<funcionalidade>/`. Cada página deve ter seu próprio componente em `pages/` dentro do módulo correspondente.
- Mantenha componentes, serviços, tipos e composables locais junto da funcionalidade que os utiliza. Componentes exclusivos de uma página podem ficar próximos dela.
- Use `frontend/src/components/` para componentes compartilhados entre módulos e `components/base/` para elementos básicos de interface. Promova um componente local somente quando houver necessidade concreta de compartilhamento.
- Crie diretórios como `router/`, `stores/`, `services/` e subpastas de módulos conforme necessário. Mantenha o código compartilhado em local de responsabilidade clara.

## Catálogo, reuso e aprovação

- Antes de criar um componente, consulte o catálogo de componentes globais em `frontend/COMPONENTS.md` e examine os componentes locais e globais existentes. Priorize o reuso adequado.
- Mantenha no catálogo nome, caminho, finalidade, props, eventos e exemplo de uso de cada componente global; atualize-o ao criar ou alterar seu contrato. Se ainda não existir, crie-o quando houver componentes globais a catalogar.
- No resumo técnico, apresente a finalidade, a localização, as props, os eventos e a justificativa dos componentes locais ou globais previstos, quando aplicável. A aprovação do resumo cobre os componentes descritos nele.
- Durante a implementação, consulte o usuário antes de criar um componente adicional se ele alterar a experiência ou o escopo aprovado. Caso contrário, decida e registre o ajuste técnico, seguindo as regras de organização e reuso.

## Estado, serviços e interface

- Mantenha o estado simples no componente ou módulo que o utiliza. Use Pinia quando houver necessidade de estado compartilhado que justifique uma store.
- Use props e eventos com contratos claros e composables para lógica reutilizável. Concentre chamadas HTTP em serviços e trate carregamento, falha e estado vazio quando aplicável.
- Use HTML semântico, identifique campos, permita navegação por teclado e apresente mensagens acessíveis e compreensíveis.

## Verificação

- Execute os comandos de verificação de tipos, build e testes pertinentes quando estiverem configurados; informe limitações existentes.
- Teste comportamentos relevantes de componentes, incluindo erros, e fluxos principais. O projeto usa Vitest e Vue Test Utils com jsdom para componentes. Playwright pode ser usado para fluxos completos quando for configurado.
