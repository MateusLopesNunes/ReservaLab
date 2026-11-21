# ReservaLab

Aplicação full stack para cadastro de equipamentos e reservas com conta e login.

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
- `DATABASE_URL`: endereço de conexão usado pelo backend e pelo Drizzle, no formato `postgresql://USUARIO:SENHA@localhost:PORTA/BANCO`. Os valores devem corresponder aos demais campos; caracteres especiais no usuário ou senha precisam de codificação de URL.

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

## Conta e sessão

No ambiente local, configure `AUTH_JWT_SECRET` com uma chave aleatória de pelo menos 32 bytes codificada em base64url. Por exemplo, gere um valor para salvar no seu `.env` local:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

`AUTH_ALLOWED_ORIGIN` deve ser a origem exata usada no navegador, por exemplo `http://localhost:5173`. Use `AUTH_ALLOW_INSECURE_LOOPBACK=true` para testar por HTTP em loopback. Fora do ambiente local, configure a origem HTTPS e desative o modo HTTP. A API escuta apenas em `127.0.0.1`. Sirva o frontend e encaminhe `/api` por um proxy HTTPS no mesmo host, que termina TLS antes de encaminhar para o backend. Mantenha a origem do navegador no cabeçalho `Origin`.

Em `/cadastro`, informe e-mail, senha, nome, sobrenome, estado, cidade, nascimento e sexo. A senha precisa ter pelo menos 15 caracteres. Após o cadastro, entre em `/login`. As páginas e APIs de Equipamentos e Reservas exigem sessão. O status segue público.

O login retorna um JWT de acesso de 15 minutos e o ID da conta. O refresh fica em cookie e é substituído a cada renovação. O botão **Sair** encerra a sessão. Em navegadores sem Web Locks, duas abas renovando simultaneamente podem exigir novo login.

## Equipamentos

`GET /api/equipment` lista equipamentos por nome. `POST /api/equipment` cadastra um equipamento; o campo `name` é obrigatório e aceita até 150 caracteres, e `description` é opcional e aceita até 1000 caracteres. O servidor gera o identificador UUID e retorna o registro com status 201. Dados inválidos retornam 400.

A interface de equipamentos fica em `http://localhost:5173/equipamentos` e também pode ser aberta pelo link **Ver equipamentos** na página inicial. Ela permite cadastrar equipamentos e consultar a lista, com mensagens de carregamento, erro e sucesso.

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Projetor","description":"Projetor da sala"}'
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/api/equipment
```

## Reservas

Em `/reservas`, escolha um equipamento e informe início e fim no fuso indicado na tela. O início deve ser futuro e o fim deve ser posterior. A agenda mostra reservas em curso e futuras e indica as suas. Dois períodos sobrepostos para o mesmo equipamento retornam conflito. É possível reservar equipamentos diferentes no mesmo horário e começar uma reserva quando a anterior termina.

A API autenticada usa `GET /api/equipment/:equipmentId/reservations` para consultar a agenda e `POST` no mesmo caminho para criar com `startsAt` e `endsAt` em ISO 8601 com fuso explícito. A API determina o responsável pela sessão autenticada.

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
npm run test:integration
```

Os testes são escritos em TypeScript com Vitest. O backend usa Supertest para verificar o contrato HTTP; o frontend usa Vue Test Utils e jsdom para verificar carregamento, sucesso, falha e nova tentativa. O serviço de status também valida e testa respostas fora do contrato da API.

A integração e a cobertura do backend usam Docker Compose para criar PostgreSQL 17 com credenciais, volume e porta de loopback exclusivos. O provisionador valida o destino, aplica migrações e remove o ambiente ao terminar. O banco de desenvolvimento não é usado para esses comandos. Para verificar a atualização de um banco com equipamento da versão anterior, execute `npm run test:integration -- --with-existing-equipment`.

Para executar apenas um aplicativo, use `npm run test:backend` ou `npm run test:frontend`. Para acompanhar alterações, use `npm run test:watch -w backend` ou `npm run test:watch -w frontend`.

A cobertura exige pelo menos 80% de linhas, funções, branches e statements em cada aplicativo. Relatórios HTML ficam em `backend/coverage/index.html` e `frontend/coverage/index.html`. Arquivos de tipos e os pontos de entrada `backend/src/server.ts`, `backend/src/db/check.ts` e `frontend/src/main.ts` ficam fora da métrica. A suíte atual não contém testes E2E de navegador; o linter ainda não está configurado.

## Build dos aplicativos

```bash
npm run build
```

O resultado fica em `backend/dist` e `frontend/dist`. Para iniciar a API compilada, execute `npm start -w backend` após o build. Durante o desenvolvimento, o backend usa `tsx watch`.

O código do backend fica em `backend/src/modules/<funcionalidade>/`. A tela inicial existente fica em `frontend/src/modules/status/pages/StatusPage.vue`, e seu serviço e schema de resposta pertencem ao mesmo módulo. O projeto usa Zod para validação de dados externos; os testes ficam próximos ao código que verificam.

O proxy configurado no Vite é apenas para desenvolvimento: para publicar, configure um servidor ou proxy para encaminhar `/api` ao backend.

Referências: [Vue com TypeScript](https://vuejs.org/guide/typescript/overview.html) e [Vitest 4](https://v4.vitest.dev/guide/).
