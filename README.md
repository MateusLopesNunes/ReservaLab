# ReservaLab

Base de uma aplicação full stack para gestão de reservas de equipamentos. Neste primeiro passo, a interface consulta um endpoint de status da API.

## Estrutura

```text
reservalab/
├── backend/       # API Node.js + Express + TypeScript
├── frontend/      # Interface Vue 3 + Vite + TypeScript
└── package.json   # npm workspaces e comandos compartilhados
```

## Pré-requisitos

- Node.js 20.19 ou superior e npm.
- Docker com Docker Compose para executar o PostgreSQL.

## PostgreSQL com Docker

Preencha o arquivo `.env` na raiz do projeto. Para preparar outro ambiente, copie `.env.example` para `.env` e preencha:

- `POSTGRES_USER`: usuário inicial do PostgreSQL.
- `POSTGRES_PASSWORD`: senha desse usuário.
- `POSTGRES_DB`: nome do banco inicial.
- `POSTGRES_PORT`: porta disponível no seu computador; a porta interna do contêiner é 5432.
- `DATABASE_URL`: endereço de conexão que será usado pelo backend quando a integração com o banco for implementada, no formato `postgresql://USUARIO:SENHA@localhost:PORTA/BANCO`. Os valores devem corresponder aos demais campos; caracteres especiais no usuário ou senha precisam de codificação de URL.

Com o Docker em execução, inicie e verifique o banco na raiz do projeto:

```bash
docker compose up -d
docker compose ps
```

O PostgreSQL fica acessível somente pela máquina local e os dados persistem no volume Docker `postgres_data`. Para parar o serviço, use `docker compose down`; não acrescente `-v` se quiser preservar o volume. O usuário, a senha e o banco iniciais são aplicados apenas na primeira inicialização de um volume vazio; alterar o `.env` depois não altera automaticamente as credenciais já criadas.

O backend e o Drizzle Kit leem `DATABASE_URL` do `.env` da raiz. O endereço é validado na inicialização; a API cria um pool compartilhado, cuja conexão é aberta quando uma consulta é executada. Para verificar a conexão real com o banco configurado:

```bash
npm run db:check
```

Os schemas de tabelas deverão ficar em arquivos `*.schema.ts` dentro de `backend/src/modules/<funcionalidade>/data/`. Após criá-los, gere e revise as migrações em `backend/drizzle/` e aplique-as ao banco configurado:

```bash
npm run db:generate
npm run db:migrate
```

Confira o destino em `DATABASE_URL` antes de aplicar migrações. A migração inicial cria a tabela de equipamentos. O endpoint `/api/status` indica apenas que a API responde; use `db:check` para verificar o PostgreSQL.

## Equipamentos

`GET /api/equipment` lista equipamentos por nome. `POST /api/equipment` cadastra um equipamento; o campo `name` é obrigatório e aceita até 150 caracteres, e `description` é opcional e aceita até 1000 caracteres. O servidor gera o identificador UUID e retorna o registro com status 201. Dados inválidos retornam 400.

A interface de equipamentos fica em `http://localhost:5173/equipamentos` e também pode ser aberta pelo link **Ver equipamentos** na página inicial. Ela permite cadastrar equipamentos e consultar a lista, com mensagens de carregamento, erro e sucesso.

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H 'Content-Type: application/json' \
  -d '{"name":"Projetor","description":"Projetor da sala"}'
curl http://localhost:3000/api/equipment
```

Os testes atuais verificam os endpoints com o repositório simulado. Testes automatizados de integração com PostgreSQL isolado ainda precisam ser configurados.

## Executar em desenvolvimento

Na pasta raiz do projeto:

```bash
npm install
npm run dev
```

Acesse o endereço informado pelo Vite (normalmente http://localhost:5173). A API fica em http://localhost:3000/api/status. O servidor de desenvolvimento do Vite encaminha as chamadas `/api` para o backend, evitando a necessidade de configurar CORS durante o desenvolvimento.

Para iniciar os projetos separadamente, use dois terminais na raiz:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

O backend aceita a variável de ambiente `PORT`. Se alterá-la, inicie também o frontend com `API_PROXY_TARGET` apontando para o endereço correspondente, por exemplo:

```bash
PORT=3001 npm run dev:backend
API_PROXY_TARGET=http://localhost:3001 npm run dev:frontend
```

## Endpoint inicial

`GET /api/status` retorna:

```json
{
  "status": "ok",
  "message": "API do ReservaLab funcionando!"
}
```

## Verificação e testes

Na raiz, execute:

```bash
npm run typecheck
npm test
npm run test:coverage
```

Os testes são escritos em TypeScript com Vitest. O backend usa Supertest para verificar o contrato HTTP; o frontend usa Vue Test Utils e jsdom para verificar carregamento, sucesso, falha e nova tentativa. O serviço de status também valida e testa respostas fora do contrato da API.

Para executar apenas um aplicativo, use `npm run test:backend` ou `npm run test:frontend`. Para acompanhar alterações, use `npm run test:watch -w backend` ou `npm run test:watch -w frontend`.

A cobertura exige pelo menos 80% de linhas, funções, branches e statements em cada aplicativo. Relatórios HTML ficam em `backend/coverage/index.html` e `frontend/coverage/index.html`. Arquivos de tipos e os pontos de entrada `backend/src/server.ts`, `backend/src/db/check.ts` e `frontend/src/main.ts` ficam fora da métrica. A suíte atual não contém testes E2E de navegador; o linter ainda não está configurado.

## Build dos aplicativos

```bash
npm run build
```

O resultado fica em `backend/dist` e `frontend/dist`. Para iniciar a API compilada, execute `npm start -w backend` após o build. Durante o desenvolvimento, o backend usa `tsx watch`.

O código do backend fica em `backend/src/modules/<funcionalidade>/`. A tela inicial existente fica em `frontend/src/modules/status/pages/StatusPage.vue`, e seu serviço e schema de resposta pertencem ao mesmo módulo. O projeto usa Zod para validação de dados externos; os testes ficam próximos ao código que verificam.

O proxy configurado no Vite é apenas para desenvolvimento: para publicar, configure um servidor ou proxy para encaminhar `/api` ao backend. Ainda não há funcionalidades de reservas nesta base inicial.

Referências: [Vue com TypeScript](https://vuejs.org/guide/typescript/overview.html) e [Vitest 4](https://v4.vitest.dev/guide/).
