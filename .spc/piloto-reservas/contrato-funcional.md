# Contrato funcional do piloto de Reservas

## Escopo e decisões confirmadas

- Autocadastro com e-mail e senha. Nome, sobrenome, estado, cidade, data de nascimento e sexo são obrigatórios.
- A conta tem ID próprio. A sessão usa token de acesso JWT e refresh token. Equipamentos, Reservas e dados da conta exigem login. O endpoint de status permanece público.
- Um usuário autenticado pode criar e consultar reservas por equipamento. O servidor associa a criação ao ID da conta autenticada.
- Aceitar reservas com início futuro e fim posterior ao início. Rejeitar períodos sobrepostos no mesmo equipamento e permitir que um período comece exatamente quando o anterior termina. Equipamentos distintos podem ter reservas no mesmo horário.
- Edição e cancelamento de reservas, recuperação de senha, confirmação de e-mail, administração de contas, papéis de acesso, edição de perfil e notificações ficam para outras demandas.

## Premissas para aprovar com o resumo

- Após o cadastro, a pessoa entra com e-mail e senha. A sessão pode ser renovada em uma tela aberta ou ao recarregá-la. Sair encerra a sessão atual.
- Qualquer conta cadastrada pode acessar as ações já existentes de cadastrar e listar equipamentos. A proteção muda o acesso a essas ações, que conservam seus contratos após autenticação.
- A consulta lista a ocupação atual e futura do equipamento escolhido em ordem de início e identifica as reservas da própria conta. A agenda não exibe nome, e-mail, ID ou perfil do responsável pelas reservas alheias.
- A tela usa e indica o fuso do navegador para entrada e apresentação de horários. O servidor compara instantes. Estado, cidade e sexo aceitam texto preenchido. A data de nascimento deve ser válida e não pode estar no futuro. Não se aplica idade mínima nesta versão.

## Critérios de aceitação

| ID | Comportamento esperado |
| --- | --- |
| CA-01 | O autocadastro exige e-mail, senha e todos os seis campos de perfil. Entradas ausentes ou inválidas recebem indicação compreensível. O mesmo e-mail normalizado não cria duas contas. O cadastro válido permite entrar. |
| CA-02 | O login válido inicia sessão, fornece JWT de acesso e refresh e permite obter o ID da própria conta. Credenciais inválidas recebem erro genérico. Senha, hash e tokens fora dos canais previstos não aparecem em respostas, logs ou agenda. |
| CA-03 | Sem sessão válida, as telas de Equipamentos e Reservas encaminham para login e as APIs protegidas devolvem 401. Sessão válida permite as ações existentes de Equipamentos. O status permanece público. |
| CA-04 | O refresh válido preserva a identidade e substitui as credenciais. Recarregar ou continuar usando uma tela protegida recupera uma sessão ainda válida. Refresh expirado, revogado ou reutilizado é recusado. Sair invalida as credenciais daquela sessão. Uma ação iniciada na conta anterior nunca é executada na conta nova. |
| CA-05 | Dado um equipamento existente e um período válido, o usuário autenticado cria a reserva e a vê na consulta. O vínculo persistido corresponde ao ID autenticado, e o cliente não escolhe nem altera o responsável. |
| CA-06 | UUID inválido, horário sem fuso, início passado ou igual ao instante avaliado pelo servidor e fim igual ou anterior ao início são recusados com 400. Equipamento inexistente recebe 404. O formulário comunica falhas sem perder o que a pessoa preencheu. |
| CA-07 | Sobreposição no mesmo equipamento recebe 409 mesmo com requisições simultâneas. Numa corrida entre dois pedidos válidos, exatamente um é criado, o outro recebe conflito e há uma única reserva persistida. Períodos contíguos e períodos iguais em equipamentos diferentes são aceitos. |
| CA-08 | A consulta do equipamento retorna ocupação atual e futura ordenada, ou estado vazio. A interface distingue carregamento, erro e lista vazia. A identificação de reserva própria é correta e os dados pessoais dos responsáveis ficam fora da resposta de agenda. |

As decisões de produto estão confirmadas. As premissas e o desenho técnico entram no resumo que antecede a implementação. [TechSpec](techspec.md) · [Tarefas e verificações](tarefas.md).
