# Instruções do projeto

O ReservaLab possui um backend Node.js com Express em `backend/` e um frontend Vue 3 em `frontend/`. Ambos usam TypeScript e npm workspaces. Siga as regras aplicáveis antes de alterar o código:

- [Padrões de codificação](.agentes/rules/code-standards.md).
- [Estrutura de pastas](.agentes/rules/folder-structure.md).
- [JavaScript e TypeScript](.agentes/rules/javascript-typescript.md).
- [Node.js](.agentes/rules/node.md).
- [Banco de dados](.agentes/rules/database.md): PostgreSQL, Drizzle e configuração de persistência.
- [Testes](.agentes/rules/tests.md).
- [Frontend Vue e TypeScript](.agentes/rules/vue-frontend.md): siga estas regras antes de alterar o frontend.

O projeto mantém `package.json` e `package-lock.json` na raiz, com workspaces para os aplicativos. Execute instalações na raiz e consulte os arquivos `package.json` para os comandos disponíveis.

- `npm run dev`: inicia backend e frontend.
- `npm run typecheck`: verifica os tipos dos dois aplicativos, incluindo testes.
- `npm run build`: compila o backend e gera o frontend.
- `npm test`: executa os testes dos dois aplicativos.
- `npm run test:coverage`: verifica a cobertura mínima de 80% em cada aplicativo.

Os testes usam Vitest; o backend usa Supertest e o frontend usa Vue Test Utils com jsdom. Lint e testes E2E ainda não estão configurados. A cobertura exclui arquivos de tipos e os pontos de entrada `backend/src/server.ts`, `backend/src/db/check.ts` e `frontend/src/main.ts`.

## Fluxo agêntico do ReservaLab

Ao conduzir uma demanda pelo fluxo agêntico, use o [guia de coordenação](.spc/fluxo-agentico-reservalab/etapa-3-coordenacao.md). Mantenha o planejamento, as decisões de produto e as aprovações no chat principal. Delegue a revisão do plano e a revisão de código a execuções independentes. Encaminhe implementação e QA conforme o escopo, a disponibilidade dos agentes e as permissões da sessão. Registre bloqueios, evidências e o ponto de retomada junto da demanda.
