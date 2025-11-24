# Visão geral do sistema

Este documento resume a arquitetura do NextSchedule, descreve os principais fluxos e mapeia as responsabilidades por pasta/arquivo em formato de árvore.

## Fluxo de alto nível

1. **Bootstrap global**: `src/app/layout.tsx` define tipografia, temas, React Query e Toaster, envolvendo todas as rotas com `ThemeProvider`, `ReactQueryProvider` e `NuqsAdapter`.
2. **Roteamento inicial**: `src/app/page.tsx` verifica a sessão via `auth.api.getSession` e redireciona para `/dashboard` ou `/authentication` conforme o usuário autenticado.
3. **Área protegida**: as rotas em `src/app/(protected)` usam o layout que injeta o `SidebarProvider` e `ActiveClinicProvider`, exibindo `AppSidebar`, `Header` e `MobileLayout` antes do conteúdo da página.
4. **Ações de servidor**: a lógica de escrita/consulta é concentrada em `src/actions`, usando `next-safe-action` para validação (`zod`) e revalidação de rotas após mutações.
5. **Dados e autenticação**: `src/lib/auth.ts` integra Better Auth com o Drizzle, enriquecendo a sessão com clínicas associadas; `src/db/schema.ts` define todo o modelo relacional para usuários, clínicas, profissionais e agendamentos.
6. **APIs e documentação**: as rotas em `src/app/api/**/route.ts` expõem endpoints públicos e internos; `src/lib/swagger.ts` gera especificações OpenAPI consumidas pelas páginas `src/app/api-doc/page.tsx` e `src/app/api-doc/internal/page.tsx`.

## Árvore de responsabilidades

```text
src/
├── _helpers/                 Funções utilitárias compartilhadas (formatadores, parsing, etc.).
├── actions/                  Server Actions com validação e revalidação de cache.
│   ├── cancel-appointment.ts Cancela um agendamento e atualiza rotas protegidas.
│   ├── clinic-settings-actions.ts Fluxos de atualização de configurações de clínica.
│   ├── update-appointment.ts Atualização geral de dados de agendamento.
│   ├── add-appointment/      Criação de agendamentos em etapas.
│   ├── ... (demais pastas)   Serviços específicos (planos, horários, especialidades, etc.).
├── app/                      App Router (layouts, páginas e APIs).
│   ├── layout.tsx            Layout raiz com provedores globais.
│   ├── page.tsx              Redireciona usuários para auth ou dashboard.
│   ├── globals.css           Estilos globais (Tailwind).
│   ├── api/                  Handlers REST públicos/internos.
│   ├── api-doc/              Páginas do Swagger UI (público e interno).
│   ├── authentication/       Fluxo de login/registro e componentes de autenticação.
│   ├── signature/            Páginas relacionadas a assinatura/checkout.
│   └── (protected)/          Área autenticada.
│       ├── layout.tsx        Layout com sidebar, header e contexto de clínica ativa.
│       ├── _components/      Navegação, cabeçalho e layout mobile.
│       ├── dashboard/        Visão geral de métricas e cards.
│       ├── appointments/     Listagem e gestão de agendamentos.
│       ├── clients/          Gestão de pacientes/clientes.
│       ├── professionals/    Cadastro de profissionais.
│       ├── specialties/      Gestão de especialidades.
│       ├── clinic-form/      Wizard de criação/edição de clínica.
│       ├── clinic-settings/  Configurações avançadas da clínica.
│       ├── clinic-persona/   Persona/assistente da clínica.
│       ├── apikey/           Gestão de chaves de integração.
│       └── subscription/     Tela de assinatura/planos.
├── components/               Componentes reutilizáveis da UI.
│   ├── ui/                   Biblioteca base (botões, inputs, tabelas, sidebar, etc.).
│   └── Mobile/               Componentes específicos para experiências mobile.
├── data/                     Datasets estáticos (ex.: seeds, opções de select).
├── db/                       Configuração do Drizzle e schemas.
│   ├── index.ts              Cliente/driver configurado.
│   └── schema.ts             Tabelas, enums e relações (usuários, clínicas, agenda).
├── hooks/                    Hooks React customizados.
├── lib/                      Utilitários de domínio e infraestrutura.
│   ├── auth.ts               Configuração Better Auth e sessão enriquecida.
│   ├── auth-client.ts        Cliente de autenticação para uso no front.
│   ├── clinic-session.ts     Tipos auxiliares de sessão de clínica.
│   ├── next-safe-action.ts   Instância tipada do next-safe-action.
│   ├── swagger.ts            Geração das specs OpenAPI (público/interno).
│   └── utils.ts              Helpers genéricos.
└── providers/                Providers globais da aplicação.
    ├── active-clinic.tsx     Contexto/estado da clínica selecionada.
    └── react-query.tsx       Setup do React Query com hidratação no App Router.
```

## Fluxos chaves

- **Autenticação e sessão**: `src/lib/auth.ts` usa `betterAuth` com adaptador Drizzle para persistir usuários, contas e sessões. Um plugin `customSession` agrega os vínculos de clínicas para habilitar o seletor de clínica no dashboard.
- **Navegação autenticada**: o layout de `src/app/(protected)/layout.tsx` injeta `SidebarProvider` e `ActiveClinicProvider`, exibindo o `AppSidebar`, `Header` e `MobileLayout` antes do conteúdo de cada rota protegida.
- **Mutação de agendamentos**: ações como `src/actions/cancel-appointment.ts` validam entrada com `zod`, executam atualizações no `appointmentsTable` via Drizzle e revalidam rotas relevantes para refletir o novo estado.
- **Modelo de dados**: `src/db/schema.ts` centraliza a definição de tabelas (usuários, clínicas, profissionais, clientes, agendamentos, horários, integrações) e relações, garantindo consistência entre autenticação e domínio clínico.
- **Documentação de API**: `src/lib/swagger.ts` monta specs públicas e internas consumidas pelas páginas `api-doc`; rotas em `src/app/api/**` são anotadas com JSDoc para aparecerem automaticamente no Swagger UI.

## Como ler e evoluir

1. **Entender o domínio**: comece pelo schema em `src/db/schema.ts` para ver entidades e relacionamentos.
2. **Seguir o fluxo de autenticação**: leia `src/lib/auth.ts` e `src/app/page.tsx` para entender redirecionamentos e sessão inicial.
3. **Explorar o dashboard**: abra `src/app/(protected)/layout.tsx` e as páginas dentro de `(protected)` para ver como o estado de clínica é aplicado na UI.
4. **Manter as APIs documentadas**: ao criar/alterar handlers em `src/app/api/**`, inclua JSDoc conforme o guia em `docs/walkthrough.md` para que o Swagger reflita o endpoint.
