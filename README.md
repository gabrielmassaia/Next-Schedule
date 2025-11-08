# NextSchedule

Sistema de agendamento médico desenvolvido com Next.js 15, TypeScript e PostgreSQL.

## Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (versão 15 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/) ou [pnpm](https://pnpm.io/)

## Configuração do Ambiente

1. Clone o repositório:

```bash
git clone [URL_DO_REPOSITÓRIO]
cd Next-Schedule
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto
   - Copie o conteúdo do arquivo `.env.example` para o `.env`
   - Preencha as variáveis com suas configurações:

```env
# Database
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/nextschedule"

# Auth
AUTH_SECRET="seu_secret_aqui"
```

4. Execute as migrações do banco de dados:

```bash
npm run db:migrate
# ou
yarn db:migrate
# ou
pnpm db:migrate
```

## Executando o Projeto

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

2. Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Estrutura do Projeto

```
src/
  ├── actions/              # Server Actions do Next.js
  │   ├── auth/            # Ações relacionadas à autenticação
  │   └── api/             # Ações da API e manipulação de dados
  │
  ├── app/                 # Rotas e páginas da aplicação
  │   ├── api/            # Endpoints da API
  │   ├── auth/           # Rotas de autenticação
  │   └── (dashboard)/    # Área protegida do sistema
  │
  ├── components/         # Componentes React reutilizáveis
  │   ├── ui/            # Componentes base da interface
  │   └── shared/        # Componentes compartilhados
  │
  ├── db/                # Configurações do banco de dados
  │   ├── migrations/    # Migrações do Drizzle
  │   ├── schema/        # Schemas das tabelas
  │   └── index.ts      # Configuração do cliente DB
  │
  ├── hooks/            # Hooks personalizados React
  │   ├── auth/         # Hooks de autenticação
  │   └── form/         # Hooks para formulários
  │
  ├── lib/             # Bibliotecas e configurações
  │   ├── auth/        # Configuração de autenticação
  │   ├── utils/       # Funções utilitárias
  │   └── config/      # Configurações gerais
  │
  └── _helpers/       # Funções auxiliares e utilitários
```

### Detalhamento da Arquitetura

- **actions/**: Contém os Server Actions do Next.js 13+, responsáveis por operações no servidor como manipulação de dados e autenticação.

- **app/**: Implementa o App Router do Next.js, onde cada pasta representa uma rota da aplicação.
  - `api/`: Endpoints da API REST
  - `auth/`: Páginas e rotas de autenticação
  - `(dashboard)/`: Grupo de rotas protegidas da aplicação

- **components/**: Componentes React reutilizáveis organizados por domínio
  - `ui/`: Componentes básicos da interface (botões, inputs, etc)
  - `shared/`: Componentes compartilhados entre diferentes partes da aplicação

- **db/**: Todo o código relacionado ao banco de dados
  - `migrations/`: Histórico de alterações do banco
  - `schema/`: Definição das tabelas e relacionamentos
- **hooks/**: Custom hooks React para reutilização de lógica
  - `auth/`: Hooks relacionados à autenticação
  - `form/`: Hooks para gerenciamento de formulários

- **lib/**: Configurações e utilitários
  - `auth/`: Configuração do sistema de autenticação
  - `utils/`: Funções utilitárias gerais
  - `config/`: Configurações da aplicação

- **\_helpers/**: Funções auxiliares e utilitários compartilhados

### Padrões e Convenções

- Utilizamos o padrão de Server Components por padrão
- Client Components são identificados com o sufixo 'use client'
- Cada componente tem seu próprio diretório com arquivos relacionados
- Seguimos o princípio de Colocation para manter arquivos relacionados próximos

## Tecnologias Utilizadas

- [Next.js 15](https://nextjs.org/) - Framework React
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados
- [Drizzle ORM](https://orm.drizzle.team/) - ORM para TypeScript
- [Better Auth](https://better-auth.com/) - Sistema de autenticação
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [React Hook Form](https://react-hook-form.com/) - Gerenciamento de formulários
- [Zod](https://zod.dev/) - Validação de schemas
- [Radix UI](https://www.radix-ui.com/) - Componentes de interface acessíveis
- [Lucide React](https://lucide.dev/) - Biblioteca de ícones
- [Day.js](https://day.js.org/) - Biblioteca para manipulação de datas
- [Sonner](https://sonner.emilkowal.ski/) - Sistema de notificações toast

## Componentes e Recursos

O projeto inclui diversos componentes pré-configurados:

- Sistema completo de autenticação
- Temas claro/escuro
- Componentes de UI acessíveis (Radix UI)
- Formulários validados com Zod
- Sistema de notificações toast
- Formatação de números e datas
- Componentes de diálogo, menu dropdown, avatar, tabs e tooltips

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run db:migrate` - Executa as migrações do banco de dados
- `npm run db:studio` - Abre o Drizzle Studio para gerenciar o banco de dados

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

Stripe test local -> stripe listen --forward-to localhost:3000/api/stripe/webhook

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
