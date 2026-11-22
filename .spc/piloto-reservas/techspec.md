# TechSpec do piloto de Reservas

[Contrato funcional](contrato-funcional.md) · [Tarefas e verificações](tarefas.md)

## Bloco 1 Conta e sessão

Criar o módulo de contas e autenticação em `backend/src/modules/auth/`, com schemas Zod, serviços e persistência separados de rotas HTTP. Montar middleware de autenticação em todas as rotas de equipamentos e reservas e no endpoint que identifica a conta. Manter a rota de status pública.

| Rota | Contrato planejado |
| --- | --- |
| `POST /api/auth/register` | Recebe e-mail, senha, nome, sobrenome, estado, cidade, data de nascimento e sexo. Retorna 201 com ID e sem criar sessão. Validação retorna 400 e e-mail duplicado recebe 409. |
| `POST /api/auth/login` | Recebe e-mail e senha. Retorna 200 com `accessToken`, `expiresIn` em segundos, `userId` e `sessionId`. Entrega refresh somente no cookie. Credenciais inválidas recebem 401 genérico. |
| `POST /api/auth/refresh` | Lê o cookie e aceita `sessionId` esperado opcional no corpo. Se o cookie for válido e corresponder ao alvo quando informado, retorna 200 com o mesmo DTO de login e substitui o cookie. Ausente, expirado, revogado, reutilizado ou de outra sessão recebe 401. Em falha, não altera o cookie. |
| `POST /api/auth/logout` | Aceita Bearer e `sessionId` esperado da aba quando disponível. Revoga apenas a sessão alvo, limpa o cookie correspondente e retorna 204. Repetir após expiração ou saída mantém a resposta 204. |
| `GET /api/auth/me` | Exige Bearer JWT válido e sessão ativa. Retorna `userId` e os próprios e-mail, nome, sobrenome, estado, cidade, data de nascimento e sexo. Nunca retorna hash ou tokens. |

Normalizar e-mail com trim e caixa baixa e impor unicidade dessa representação no PostgreSQL. Validar strings de perfil preenchidas com limites no schema e na base quando aplicável. Guardar nascimento como `date` e receber `YYYY-MM-DD` em calendário válido. Usar senha de 15 a 128 caracteres sem trim. Escolher `scrypt` assíncrono do Node com sal aleatório e parâmetros versionados, começando por N=2^17, r=8 e p=1 com orçamento de memória explícito. Limitar tentativas nos endpoints de cadastro e login por janela e origem do cliente, com estado local de tamanho limitado no piloto. Fixar teto de dois hashes concorrentes por processo, com resposta 429 quando o recurso estiver saturado, e testar o teto. Manter validações baratas antes do hash. Usar resposta genérica de login tanto para e-mail desconhecido como para senha inválida. [Armazenamento de senhas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) · [Orientação de tamanho de senha](https://pages.nist.gov/800-63-4/sp800-63b.html).

Emitir o JWT com biblioteca `jose`, algoritmo fixo HS256, chave aleatória de pelo menos 32 bytes configurada no ambiente e claims `sub` (UUID da conta), `sid` (sessão), `iss`, `aud` e `exp`. Validade inicial de 15 minutos. O middleware verifica tipo, assinatura e claims e confirma que `sid` está ativo, pertence a `sub` e não expirou. Isso encerra o acesso após logout ou revogação da sessão. Configuração inválida de autenticação impede o início da API com mensagem sem segredos. [Práticas para validação de JWT](https://www.rfc-editor.org/rfc/rfc8725.html) · [Biblioteca jose](https://github.com/panva/jose).

Gerar refresh opaco com pelo menos 32 bytes aleatórios e armazenar somente seu hash SHA-256. A sessão tem prazo absoluto inicial de 7 dias. Em transação, bloquear a sessão, validar o refresh corrente, marcar o token como consumido e inserir o novo. Manter o hash consumido até expiração para identificar reutilização. Reutilização revoga a família e essa revogação deve ser persistida mesmo que a API devolva 401. Acesso de outras sessões continua válido. Depois de validar um novo login, revogar na mesma transação a sessão anterior representada pelo cookie daquele navegador, se houver, e criar a nova. O logout toma o `sid` de um Bearer válido ou usa o cookie vinculado ao `sessionId` indicado pela sessão da aba. Quando cookie e alvo divergem, um Bearer válido pode revogar apenas seu próprio `sid`. Em divergência, preservar o cookie e a sessão da outra conta. O ID informado pelo cliente não autoriza revogação sozinho. Respostas de sessão usam `Cache-Control: no-store`.

Entregar o refresh em cookie `HttpOnly`, `SameSite=Lax`, sem atributo Domain, Path `/api/auth` e `Secure` sob HTTPS. Fora do ambiente de desenvolvimento e QA em loopback, exigir HTTPS. Vincular backend e Vite a loopback ao liberar cookie em HTTP. Configurar a origem exata do navegador (protocolo, host e porta) no backend. Login, refresh e logout recusam com 403 `Origin` ausente ou diferente, sem alterar a sessão. Usar a mesma origem no frontend via proxy Vite, verificando o cabeçalho de origem do navegador e sem usar `Host` ou `X-Forwarded-Host` como origem autorizada. [Rotação de refresh](https://www.rfc-editor.org/rfc/rfc9700.html#name-refresh-token-protection) · [Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) · [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).

O cliente HTTP compartilhado usa JWT em memória. Na inicialização, tenta refresh sem uma identidade esperada. Em tela aberta, coordena uma renovação por aba e envia o `sessionId` esperado. O servidor verifica o vínculo do cookie antes de rotacionar. O cliente só repete uma vez pedidos recusados com 401 e código `AUTH_REQUIRED` emitidos pelo middleware antes do handler, e somente se `sessionId` e `userId` continuarem iguais. Timeout ou erro de negócio não dispara repetição da mutação. Logout, perda ou troca de conta invalidam estado e respostas pendentes da identidade anterior, sem reaproveitar a ação. Em perda de sessão, encaminhar ao login. Usar Web Locks para serializar login, refresh e logout entre abas na mesma origem. Sem Web Locks, a aba funciona isoladamente e um conflito de renovação entre abas pode exigir novo login. Registrar essa limitação nos resultados do navegador.

## Bloco 2 Reservas

Criar módulo `backend/src/modules/reservations/` com rotas, validação, regras e acesso a dados. Proposta de contrato sob autenticação:

| Rota | Contrato planejado |
| --- | --- |
| `POST /api/equipment/:equipmentId/reservations` | Recebe apenas `startsAt` e `endsAt` em ISO 8601 com offset explícito. Retorna 201 com `id`, `equipmentId`, datas em UTC e `isMine: true`. 400 para formato ou período inválido, 404 para equipamento inexistente e 409 para sobreposição. |
| `GET /api/equipment/:equipmentId/reservations` | Retorna 200 com as reservas cujo fim ainda é futuro, ordenadas por `startsAt` e `id`, ou lista vazia. Usa o mesmo DTO e calcula `isMine` pelo contexto autenticado. 400 para UUID malformado e 404 para equipamento inexistente. |

Campos extras de criação, incluindo `userId`, são rejeitados. Validar a existência do equipamento e usar a FK como garantia final. Capturar violações pelo código e nome da restrição esperada e responder sem expor detalhes SQL. Um período usa início estritamente posterior ao instante validado pelo servidor e fim estritamente posterior ao início. Comparar instantes normalizados e aceitar precisão de até milissegundos, incluindo UTC representado por `Z`. Usar envelope JSON sanitizado com `code`, `message` e, quando útil, campos inválidos sem eco do valor. Reutilizar a forma de erro dos endpoints existentes de equipamentos para seus casos atuais. JSON inválido retorna 400 pelo tratamento de erro do Express. Limitação retorna 429 e erro inesperado retorna 500 sem payloads, credenciais ou detalhes SQL.

## Persistência e migrações

| Tabela | Campos e garantias |
| --- | --- |
| `user_account` | UUID, e-mail normalizado único, hash da senha e seis campos de perfil obrigatórios. Nascimento em data de calendário. |
| `auth_session` e `refresh_token` | UUID da sessão, FK de usuário, expiração e revogação. Tokens associados à sessão, digest único, registro de consumo e expiração herdada da sessão. |
| `reservation` | UUID, FKs de equipamento e usuário, início e fim `timestamptz`, restrição `ends_at > starts_at` e índice apropriado para consulta por equipamento e início. |

Usar migrations versionadas pelo Drizzle. Após a tabela de reservas, adicionar SQL específico para `btree_gist` e restrição de exclusão GiST sobre igualdade do equipamento e interseção de `tstzrange(starts_at, ends_at, '[)')`. Usar nome estável para mapear apenas a violação esperada a 409. Conferir privilégio para habilitar a extensão no banco alvo. Aplicar e verificar em PostgreSQL 17 isolado. A reserva não depende de uma consulta prévia de disponibilidade para garantir exclusão. [Restrições de intervalo do PostgreSQL 17](https://www.postgresql.org/docs/17/rangetypes.html#RANGETYPES-CONSTRAINT) · [Extensão btree_gist](https://www.postgresql.org/docs/17/btree-gist.html) · [Migrações Drizzle](https://orm.drizzle.team/docs/drizzle-kit-generate#custom-migrations).

## Interface Vue e componentes previstos

O frontend usa composable compartilhado de sessão e serviços com validação de respostas, preservando os módulos de equipamentos e status. Usar a navegação da aplicação com guarda das rotas protegidas antes de montar a área privada. Preservar a rota interna de destino ao entrar e aceitar apenas caminhos conhecidos. Conferir componentes existentes e criar catálogo quando houver componente global.

| Componente | Local e finalidade | Props e eventos |
| --- | --- | --- |
| `App.vue` | `frontend/src/App.vue`. Compor navegação, checagem inicial da sessão, áreas públicas e privadas e saída. | Sem props ou eventos públicos. Usa estado da sessão e navegação. |
| `LoginPage.vue` | `frontend/src/modules/auth/pages/`. Receber credenciais e mostrar retorno de autenticação. | Sem props ou eventos públicos. Usa o composable de sessão. |
| `CadastroPage.vue` | `frontend/src/modules/auth/pages/`. Registrar os oito campos obrigatórios e encaminhar ao login após sucesso. | Sem props ou eventos públicos. Usa o serviço de cadastro e navegação. |
| `ReservasPage.vue` | `frontend/src/modules/reservas/pages/`. Selecionar equipamento, criar reserva e mostrar ocupação, estado vazio e erros. | Sem props ou eventos públicos. Usa serviços de equipamentos, sessão e reservas. |

Reaproveitar `EquipamentosPage.vue` e `StatusPage.vue`. Atualizar serviço de equipamentos para autenticação. Converter datas editáveis para instantes com fuso indicado. Recusar horário local inexistente ou ambíguo em mudanças de offset e manter os campos para a pessoa corrigir. Renderizar respostas de agenda e criação apenas para o equipamento e a identidade que iniciaram a chamada e que continuam selecionados. Descartar respostas atrasadas após troca de equipamento ou conta. Mostrar erros e sucesso de forma acessível. Em conflito, manter os dados do formulário e permitir atualizar a agenda.

## Isolamento e entrega

Criar a worktree do piloto após aprovação. Preparar PostgreSQL 17 com identificador Compose, volume, porta dinâmica de loopback e credenciais próprios. Configurar runner de integração separado com variável de destino explícita como `TEST_DATABASE_URL` e guarda contra fallback ao `.env` de desenvolvimento. O provisionador confirma host e porta de loopback publicados pelo contêiner criado, nome e usuário de teste exclusivos. Injeta o destino validado como `DATABASE_URL` para migrações, runner e backend do navegador, antes de importar o cliente ou limpar dados. Sem destino explícito ou com destino divergente, abortar sem fallback. Manter os testes `*.integration.test.ts` fora da suíte padrão Vitest e executá-los por configuração própria. Usar dados de teste controlados, remover somente recursos do piloto e registrar as verificações e evidências.

Mudanças de schema são aditivas. Manter o ambiente de desenvolvimento preservado durante os testes e atualizar `.env.example` só com exemplos e documentar no README migrações, configuração, execução do QA e origem local em loopback. O PR inclui os resultados de revisão, QA e limitações. Rever especificamente sessão, isolamento, privacidade da agenda e concorrência.
