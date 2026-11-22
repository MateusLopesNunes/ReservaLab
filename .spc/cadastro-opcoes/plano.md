# Plano de opções para cadastro de usuário

## Pedido e comportamento

O formulário de autocadastro passa a obter opções previamente cadastradas no banco para estado, cidade e sexo. As opções continuam obrigatórias. A carga inicial contém Goiás, com chave `GO`, e as cidades Ceres e Rialma ligadas a Goiás.

Para o campo chamado **Sexo**, a proposta inicial de opções é **Feminino**, **Masculino**, **Intersexo**, **Outro** e **Prefiro não informar**. A seleção é obrigatória, inclusive para escolher não informar. Esses rótulos são uma premissa apresentada no resumo para aprovação. A aplicação guarda a opção selecionada.

A pessoa seleciona o estado antes da cidade. A lista de cidades é filtrada pelo estado e uma alteração de estado limpa a cidade selecionada. O formulário informa carregamento, lista vazia e falha de consulta, com opção de nova tentativa, sem descartar os demais campos.

## Critérios de aceitação e verificação

| ID | Critério | Evidência |
| --- | --- | --- |
| CA-01 | A carga inicial cria Goiás com chave primária `GO`, Ceres e Rialma relacionadas a `GO`, e as opções de sexo propostas. Executar a carga repetidamente não duplica nem modifica registros existentes. | Integração em PostgreSQL isolado verifica PK, FKs, valores e duas execuções. |
| CA-02 | O cadastro lista as opções do banco antes do login. Cidade depende do estado selecionado, e os três campos são obrigatórios. Alterar estado limpa a cidade. | Testes HTTP, Vue e verificação no navegador. |
| CA-03 | Cadastro com estado, cidade ou sexo inexistente, ou cidade de outro estado, recebe erro 400 compreensível. O banco garante referências válidas e a associação cidade/estado. | Testes HTTP e integração com banco isolado, inclusive chamadas diretas à API e inconsistências por concorrência. |
| CA-04 | Cadastro válido e `GET /api/auth/me` retornam dados coerentes após a mudança. Os campos de opções são identificadores no contrato de cadastro e informações legíveis do perfil são preservadas. | Testes de contrato, integração e fluxo de cadastro/login. |
| CA-05 | Contas existentes não são descartadas nem convertidas para valores incorretos. A migração preserva e associa valores equivalentes quando possível e interrompe com informação útil se houver dados sem correspondência. | Migração testada em banco isolado com dados anteriores válidos, variações conhecidas e valores sem correspondência. |
| CA-06 | Falha ou lista vazia no carregamento é comunicada, há nova tentativa e não é enviado cadastro com opções inexistentes. | Testes Vue, HTTP e navegador. |

## Abordagem técnica

- Criar tabelas de domínio de estado, cidade e opção de sexo em módulo compartilhado de dados de cadastro. Estado usa código UF como chave primária `varchar(2)`, incluindo `GO`; cidade tem chave própria, nome e FK de estado; sexo tem chave estável e rótulo. Identificadores das opções são enviados no cadastro. A referência de cidade e estado será garantida por chave composta, com índice único correspondente, além da FK de sexo.
- Usar migração versionada Drizzle para esquema, dados iniciais e associação dos perfis atuais numa transação. Separar e documentar o script SQL de carga inicial, também invocado na migração, com operações idempotentes. Gerar SQL autocontido da migração a partir da mesma fonte de seed e verificar que ambos estão sincronizados. A execução da migration não depende de comandos de inclusão do psql. A migração deve funcionar de modo autônomo na execução padrão do Drizzle e no setup automático das worktrees.
- Os campos atuais são texto livre. A migração normaliza espaços, caixa e acentos apenas para Goiás/GO e Ceres/Rialma. Sexo só é associado quando o valor histórico coincide com um rótulo proposto após essa normalização, sem presumir equivalências semânticas. Cidade e estado precisam corresponder conjuntamente. Quando houver valores antigos sem equivalência, falhar antes de remover ou tornar obrigatórias as referências, com mensagem que não exponha dados pessoais. Antes da migração, oferecer diagnóstico local por contagem e identificador de conta para resolução manual, sem exibir dados em logs. Documentar como corrigir ou cadastrar equivalências antes de repetir. A transação preserva os registros em caso de falha. Após conversão, /me retorna os rótulos canônicos via join, preservando o contrato legível. Não presumir que todos os bancos estão vazios.
- Expor endpoints públicos somente de leitura para estados, cidades filtradas pelo código de estado e opções de sexo, necessários antes do login. Validar entrada e saída com Zod. Se houver remoção concorrente entre validação e INSERT, mapear a violação de FK esperada para 400 sem expor SQL. Manter os retornos de login e `/me` compatíveis para os consumidores existentes e acrescentar IDs somente quando necessário, documentando o contrato de cadastro alterado.
- Usar `select` nativo na página existente `CadastroPage.vue`, sem novo componente Vue público. Os serviços do módulo consultam as opções da API e apresentam erro recuperável. Descartar respostas atrasadas de cidade após troca de estado e bloquear envio enquanto as listas necessárias não estiverem prontas.
- Não criar telas de administração das listas nem adicionar outros estados ou cidades no escopo. O seed aceita futuras opções adicionadas sem removê-las.

## Tarefas e dependências

1. **T1** Criar schemas, script de carga e migração de dados existentes, incluindo garantia de integridade e rollback transacional. Cobrir CA-01, CA-03 e CA-05.
2. **T2** Após T1, criar endpoints públicos de consulta e validação do cadastro, ajustar contrato e leitura de perfil. Cobrir CA-02 a CA-05.
3. **T3** Após T2, alterar o formulário e os serviços para obter e selecionar opções, com estados de carregamento e falha. Cobrir CA-02, CA-04 e CA-06.
4. **T4** Executar testes, typecheck, build e cobertura; estender o harness isolado para inserir contas antes da migração e verificar abortar, preservar dados e repetir após corrigir; rodar integração para bancos novos e com dados antigos; validar o cadastro no navegador. Revisão de código e QA independentes, depois atualizar PR.

Aplicar migrações em banco de desenvolvimento somente após conferir o destino e a compatibilidade dos dados existentes. A configuração e o banco da worktree permanecem separados dos bancos de testes. O resumo técnico precisa ser aprovado explicitamente antes da implementação.

## Revisão do plano

Revisão independente concluída. Os achados sobre migração transacional, dados históricos, geração do seed, consultas concorrentes e testes de banco foram incorporados. As opções de sexo e as premissas de conversão serão apresentadas ao usuário no resumo.

## Aprovação e resultado

O usuário aprovou o resumo e as opções em 21/11/2026. A implementação foi revisada de forma independente, com correções na validação das respostas da API, documentação, sincronização do seed e teste de remoção concorrente.

- A carga inicial foi executada duas vezes em PostgreSQL isolado sem duplicação. A FK composta rejeitou cidade de outro estado.
- A migração em banco isolado preservou contas antigas quando uma opção não era reconhecida. Após correção, a migração foi executada novamente com sucesso.
- A revisão verificou os achados após as correções e não encontrou bloqueio.
- Typecheck, build e cobertura passaram. Backend alcançou 96,56% de linhas e 90,07% de branches; frontend, 95,96% de linhas e 86,74% de branches. A integração com dados antigos teve 13 testes aprovados e um teste exclusivo do cenário de equipamento anterior ficou de fora.
- O navegador exibiu Goiás, Ceres e Rialma e as cinco opções de sexo. Um cadastro fictício com Ceres e “Prefiro não informar” foi concluído.
- O banco de desenvolvimento da worktree não recebeu a nova migração. Antes de aplicá-la, confira o destino e execute o diagnóstico descrito no README. Valores antigos sem correspondência precisam de correção, com dados preservados em caso de falha.
