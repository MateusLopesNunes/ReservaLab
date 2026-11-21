# Banco de dados

O banco escolhido para o ReservaLab é PostgreSQL. Para o acesso no backend, use Drizzle ORM com o driver `pg` e Drizzle Kit para gerenciar migrações. A conexão e o Drizzle Kit estão configurados; os schemas e migrações serão criados junto às funcionalidades de persistência.

## Conexão e configuração

- Centralize a configuração da conexão e reutilize um pool de conexões. Feche-o durante o desligamento da aplicação.
- Configure a conexão por `DATABASE_URL`, carregada conforme as regras de ambiente do projeto. Valide-a com Zod na inicialização quando o banco for configurado; mantenha um `.env.example` com valores fictícios e não versione credenciais reais.
- Separe os ambientes de desenvolvimento e teste, usando um banco de testes isolado. Nunca execute testes ou migrações de teste contra dados de produção.

## Organização e migrações

- Mantenha os schemas de tabelas e o acesso aos dados próximos dos respectivos módulos em `backend/src/modules/<funcionalidade>/data/`, com configuração compartilhada da conexão em uma área comum de infraestrutura.
- Gerencie mudanças no esquema por migrações versionadas. Revise o SQL gerado antes de aplicá-lo e documente comandos de criação e execução no README quando a ferramenta for configurada.
- Use consultas parametrizadas e transações quando uma operação precisar de alterações atômicas. Regras de negócio ficam nos serviços; repositórios executam operações de persistência.
- Valide entradas externas com Zod. Tipos e schemas do Drizzle não substituem validação em tempo de execução nem as restrições do banco.
- Para impedir reservas conflitantes, defina a estratégia de concorrência e as garantias no PostgreSQL durante a implementação; validação prévia isolada não garante integridade sob requisições simultâneas.

## Testes

Cubra consultas, migrações e restrições relevantes com testes de integração em um banco PostgreSQL isolado, com dados controlados e limpeza entre testes. Informe limitações caso o ambiente de testes de banco ainda não esteja disponível.
