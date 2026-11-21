# Estrutura de pastas do backend

Organize o código em `backend/src/modules/<funcionalidade>/`. Cada módulo reúne seus próprios arquivos de rotas, serviços, acesso a dados e tipos conforme forem necessários. Por exemplo:

```text
backend/src/
├── app.ts                  # configuração e composição das rotas
├── server.ts               # inicialização do servidor
└── modules/
    ├── status/
    │   ├── routes.ts
    │   ├── routes.test.ts
    │   └── types/
    │       └── StatusResponse.ts
    └── reservas/           # exemplo para uma funcionalidade futura
        ├── routes.ts
        ├── services/
        ├── data/
        └── types/
```

- Crie módulos por funcionalidade ou responsabilidade clara; crie pastas e arquivos apenas quando necessários.
- As rotas tratam HTTP e delegam regras de negócio a serviços; serviços podem depender da camada de dados. Dados não dependem de rotas.
- Código usado por mais de um módulo pode ser extraído para uma área compartilhada com responsabilidade clara. Evite dependências circulares.
- Ao implementar persistência, mantenha schemas de tabelas e repositórios no `data/` do módulo, conforme as [regras de banco de dados](database.md).
- `app.ts` compõe a aplicação e `server.ts` inicia o servidor. O projeto usa TypeScript; o build gera arquivos JavaScript em `backend/dist/`.
- Mantenha testes próximos ao código correspondente, conforme as regras de testes, e configurações na raiz do aplicativo ao qual pertencem.
