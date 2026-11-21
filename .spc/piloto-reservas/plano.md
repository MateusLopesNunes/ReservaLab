# Piloto de Reservas com conta e login

**Planejamento revisado em 21/11/2026.** O [resumo técnico versão 1](resumo-tecnico.md) foi aprovado explicitamente em 21/11/2026. O piloto terá criação e consulta de reservas por equipamento com autenticação. As decisões abaixo serão a base do contrato funcional e da TechSpec. [Plano do fluxo](../fluxo-agentico-reservalab/plano.md) · [Guia de coordenação](../fluxo-agentico-reservalab/etapa-3-coordenacao.md).

## Regras confirmadas

| Tema | Decisão |
| --- | --- |
| Reservas | Criar e consultar por equipamento. O recorte escolhido deixa edição e cancelamento para depois. |
| Horários | Aceitar cadastros com início futuro e fim posterior ao início. Rejeitar sobreposição no mesmo equipamento e permitir períodos consecutivos. Equipamentos distintos podem ser reservados no mesmo horário. |
| Conta e sessão | O usuário terá conta e login. A autenticação deve fornecer um token de acesso JWT, um refresh token e acesso ao ID do usuário autenticado. |
| Responsável | O backend associa a reserva à conta identificada pela autenticação. O formulário deixa de pedir o nome do responsável da reserva. |
| Perfil | Prever nome, sobrenome, estado, cidade, data de nascimento e sexo no modelo da conta. Todos os campos são obrigatórios. |

## Decisões adicionais confirmadas

- Autocadastro com e-mail e senha.
- Nome, sobrenome, estado, cidade, data de nascimento e sexo são todos obrigatórios.
- Login em Equipamentos e Reservas, com o endpoint de status público.

## Preparação concluída

- O Git foi iniciado em `main`, com o commit base `d9e2d4c`. O usuário configurou `origin` no GitHub, `main` acompanha `origin/main` e a leitura de `HEAD` no remoto confirmou `main` como branch padrão. Acesso de publicação e revisão será confirmado ao preparar o PR.
- A worktree temporária anterior confirmou o checkout sem cópia do `.env` e foi removida. O `.env` local, as dependências e os artefatos de build e cobertura estão ignorados. O primeiro commit usou a identidade local resolvida pelo Git.
- Um ensaio anterior subiu PostgreSQL 17 com projeto Compose, volume e credenciais temporários e porta dinâmica em loopback. O banco confirmou a disponibilidade de `btree_gist`. O projeto e o volume temporários foram removidos. A instância de desenvolvimento permanece separada em `127.0.0.1:5433`.

## Artefatos do piloto

O [contrato funcional](contrato-funcional.md), a [TechSpec](techspec.md) e as [tarefas e critérios de verificação](tarefas.md) cobrem dois blocos, conta e autenticação seguidas de Reservas.

## Ponto de retomada

A implementação, a revisão de código e o QA foram concluídos na worktree da branch `piloto/reservas`. O [registro de entrega](entrega.md) contém evidências por critério e o texto para o PR. A publicação da branch e a abertura do PR aguardam autorização. O merge depende da aprovação humana do PR.
