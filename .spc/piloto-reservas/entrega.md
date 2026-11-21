# Entrega do piloto de Reservas

**Validação concluída em 21/11/2026.** A versão 1 do [resumo técnico](resumo-tecnico.md) recebeu aprovação explícita no chat. Implementação, revisão independente e QA concluídos na branch `piloto/reservas`. O texto abaixo prepara o PR.

## Autenticação e reservas de equipamentos

O ReservaLab permite criar conta, entrar por e-mail e senha e reservar equipamento com vínculo à conta autenticada. Equipamentos e Reservas exigem login e o status continua público. A agenda mostra ocupação e identifica reservas próprias sem expor dados das outras contas.

O PostgreSQL recusa sobreposição para o mesmo equipamento e aceita períodos consecutivos. Se um impasse abortar a inserção concorrente, o serviço repete a operação uma vez e usa a restrição do banco para confirmar conflito. As migrations são aditivas e incluem as tabelas de conta, sessão e reserva e a restrição de exclusão. [Implementação planejada](techspec.md) · [Restrições no PostgreSQL](https://www.postgresql.org/docs/17/rangetypes.html#RANGETYPES-CONSTRAINT).

## Verificações

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado no backend e frontend. |
| `npm run build` | Aprovado no backend e frontend. Rollup removeu anotações de comentários internos do Zod sem impedir o build. |
| `npm test` | 119 testes aprovados no backend e 74 no frontend. |
| `npm run test:coverage` | Backend combina unitários e 9 testes de integração em um PostgreSQL recém-criado. A verificação exclusiva da base anterior roda no cenário dedicado. Aprovado em ambos os aplicativos. |
| `npm run test:integration -- --with-existing-equipment` | 10 testes aprovados. Inclui a preservação do equipamento anterior às novas migrações. |
| Revisão independente de código | Sem bloqueios após conferência das correções na guarda do banco, no login após falha de restauração, na escuta em loopback, na sanitização de erros e na concorrência. |

| Cobertura | Linhas | Branches | Funções | Statements |
| --- | ---: | ---: | ---: | ---: |
| Backend | 96,72% | 89,73% | 93,75% | 93,93% |
| Frontend | 96,51% | 86,07% | 93,04% | 93,42% |

## Evidências por critério

| Critério | Evidência |
| --- | --- |
| CA-01 Cadastro | Vitest cobre campos obrigatórios e formato. PostgreSQL aceita uma conta quando dois cadastros usam o mesmo e-mail normalizado. O navegador criou uma conta fictícia e encaminhou ao login. |
| CA-02 Autenticação | Login, identificação da própria conta e cookies verificados. Testes checaram hash de senha, origem autorizada e respostas sanitizadas. |
| CA-03 Proteção | API responde 401 em Equipamentos e Reservas sem credencial válida. Acesso direto à tela de Equipamentos abriu login, com retorno à tela após autenticar. Status continua público. |
| CA-04 Renovação | Dois refresh simultâneos foram observados no PostgreSQL. Houve um 200, um 401 e revogação persistida. O navegador recuperou a sessão em duas abas e as duas voltaram ao login após sair. Testes em Vue cobrem troca de identidade e login após falha na restauração inicial. |
| CA-05 Criação | A API associa o usuário do JWT à reserva. O navegador confirmou criação e agenda com o marcador de reserva própria. |
| CA-06 Validação | Testes de esquema, HTTP e Vue cobrem campos, data, fuso, UUID malformado, 404 e preservação de formulário. |
| CA-07 Concorrência | Duas inserções em conexões distintas foram observadas antes do fim da primeira transação. O PostgreSQL permitiu uma reserva e a API retornou um 201 e um 409. Adjacência e equipamentos distintos passaram. O navegador mostrou conflito e preservou os horários. |
| CA-08 Agenda | Testes verificam ordenação, ocupação em curso e futura, visibilidade entre contas e descarte de respostas antigas após troca de equipamento. |

O QA usou ambiente temporário PostgreSQL 17 com porta dinâmica, volume e credenciais próprios. O fluxo no navegador usou dados fictícios. Em navegadores sem Web Locks, renovações ao mesmo tempo em duas abas podem pedir novo login. O cenário de proxy HTTPS não foi implantado neste piloto. As [instruções de execução](../../README.md) descrevem a configuração de origem, a fronteira HTTPS e o banco isolado.

**Ponto de retomada.** Publicar a branch e abrir o PR quando autorizado. O merge depende da aprovação humana do PR e das verificações do repositório.
