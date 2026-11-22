# Resumo técnico do piloto de Reservas

**Versão 1 aprovada em 21/11/2026.** O [contrato funcional](contrato-funcional.md), a [TechSpec](techspec.md) e as [tarefas](tarefas.md) foram revisados de forma independente. As correções de sessão, isolamento e concorrência foram conferidas em nova leitura.

## Entrega proposta

- **Conta e sessão.** Autocadastro por e-mail e senha, com nome, sobrenome, estado, cidade, data de nascimento e sexo obrigatórios. Login, renovação e logout. A conta tem um UUID. Equipamentos e Reservas exigem sessão, e o endpoint de status permanece público.
- **Reservas.** Criar e consultar por equipamento. Aceitar início futuro e fim posterior. Horários consecutivos são aceitos e sobreposições no mesmo equipamento são recusadas, inclusive sob concorrência. O backend vincula a reserva ao ID autenticado.
- **Consulta.** Mostrar ocupação em curso e futura do equipamento e sinalizar as reservas da própria conta. A agenda não expõe informações de quem fez as demais reservas. Os horários são informados e exibidos no fuso do navegador, identificado na tela.
- **Interface.** Uma estrutura comum de navegação e sessão e três páginas novas, Login, Cadastro e Reservas. Sem props ou eventos públicos nesses componentes. Reaproveitar as páginas existentes de Equipamentos e Status.
- **Dados e infraestrutura.** Adicionar contas, sessões e reservas em migrações versionadas. JWT de acesso com validade inicial de 15 minutos, refresh rotativo em cookie `HttpOnly` e sessão inicial de até 7 dias. As reservas têm garantia de exclusão de horários no PostgreSQL. Executar o piloto em worktree e testar com PostgreSQL 17 isolado.
- **Verificação.** Cobrir cadastro, login, proteção das áreas, troca de conta entre abas, expiração, refresh, logout, privacidade e conflitos de agenda. Na corrida entre dois pedidos para o mesmo equipamento e horário, exigir um sucesso, um conflito e uma única reserva persistida. Rodar testes, tipos, build, cobertura e verificação no navegador.
- **Limitação prevista.** Em navegadores sem Web Locks, renovações simultâneas em duas abas podem exigir novo login. Operações pendentes ficam vinculadas à identidade original.
- **Fora do recorte.** Edição e cancelamento de reservas, recuperação de senha, confirmação de e-mail, edição de perfil, administração de contas, papéis e notificações.

Após aprovação explícita deste resumo, o coordenador prepara a worktree e inicia as tarefas na ordem prevista. Revisão de código, QA e aprovação do PR seguem como etapas próprias.
