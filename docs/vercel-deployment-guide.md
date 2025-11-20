# Guia de Deploy na Vercel - Next Schedule

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Neon](https://neon.tech) (PostgreSQL)
- Repositório Git (GitHub, GitLab ou Bitbucket)

---

## Passo 1: Preparar o Banco de Dados no Neon

### 1.1 Criar/Acessar Projeto no Neon

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie um novo projeto ou use o existente
3. Copie a **Connection String** (formato: `postgresql://user:password@host/database`)

### 1.2 Executar Migração Inicial

Como você está em desenvolvimento, o arquivo de migração atual (`drizzle/0000_wild_salo.sql`) já contém **TODAS** as tabelas necessárias, incluindo as alterações mais recentes (API keys vinculadas a clínicas).

**Opção A: Banco Zerado (Recomendado para produção)**

```bash
# 1. Conectar ao banco Neon
psql "postgresql://user:password@host/database"

# 2. Executar a migração completa
\i drizzle/0000_wild_salo.sql

# 3. Sair
\q
```

**Opção B: Usar Drizzle Kit (Mais simples)**

```bash
# Configurar variável de ambiente
export DATABASE_URL="postgresql://user:password@host/database"

# Executar push (cria todas as tabelas automaticamente)
npx drizzle-kit push
```

> ✅ **Recomendação**: Use a Opção B (`drizzle-kit push`) pois é mais simples e segura.

---

## Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar arquivo `.env.production` (local)

Crie um arquivo `.env.production` com todas as variáveis necessárias:

```bash
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Auth (Better Auth)
BETTER_AUTH_SECRET=seu-secret-aleatorio-aqui-min-32-chars
BETTER_AUTH_URL=https://seu-app.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# Stripe (se estiver usando)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Next.js
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

### 2.2 Gerar BETTER_AUTH_SECRET

```bash
# Gerar um secret aleatório de 32+ caracteres
openssl rand -base64 32
```

---

## Passo 3: Fazer Push do Código para Git

```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: preparar para deploy na Vercel"

# Push para o repositório
git push origin main
```

> ⚠️ **IMPORTANTE**: Certifique-se de que `.env` está no `.gitignore` (nunca commite secrets!)

---

## Passo 4: Deploy na Vercel

### 4.1 Importar Projeto

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository**
3. Selecione seu repositório
4. Clique em **Import**

### 4.2 Configurar Projeto

**Framework Preset**: Next.js (detectado automaticamente)

**Root Directory**: `./` (raiz do projeto)

**Build Command**: `npm run build` (padrão)

**Output Directory**: `.next` (padrão)

### 4.3 Adicionar Variáveis de Ambiente

Na seção **Environment Variables**, adicione TODAS as variáveis do `.env.production`:

| Name                                 | Value                                                                |
| ------------------------------------ | -------------------------------------------------------------------- |
| `DATABASE_URL`                       | `postgresql://user:password@host.neon.tech/database?sslmode=require` |
| `BETTER_AUTH_SECRET`                 | `seu-secret-gerado`                                                  |
| `BETTER_AUTH_URL`                    | `https://seu-app.vercel.app`                                         |
| `GOOGLE_CLIENT_ID`                   | `seu-google-client-id`                                               |
| `GOOGLE_CLIENT_SECRET`               | `seu-google-client-secret`                                           |
| `STRIPE_SECRET_KEY`                  | `sk_live_...` (se usar Stripe)                                       |
| `STRIPE_WEBHOOK_SECRET`              | `whsec_...` (se usar Stripe)                                         |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` (se usar Stripe)                                       |
| `NEXT_PUBLIC_APP_URL`                | `https://seu-app.vercel.app`                                         |

> 💡 **Dica**: Marque todas as variáveis para **Production**, **Preview** e **Development**

### 4.4 Deploy

Clique em **Deploy** e aguarde o build completar (2-5 minutos).

---

## Passo 5: Configurar Google OAuth

### 5.1 Atualizar URLs no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Vá em **APIs & Services** → **Credentials**
3. Selecione seu OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://seu-app.vercel.app/api/auth/callback/google
   ```
5. Salve as alterações

---

## Passo 6: Configurar Stripe Webhooks (Opcional)

Se você estiver usando Stripe para pagamentos:

### 6.1 Criar Webhook Endpoint

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. URL: `https://seu-app.vercel.app/api/stripe/webhook`
4. Selecione eventos:
   - `invoice.paid`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** (`whsec_...`)
6. Adicione como `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente da Vercel

### 6.2 Atualizar Variável de Ambiente

1. Vá em **Settings** → **Environment Variables** no projeto Vercel
2. Adicione/atualize `STRIPE_WEBHOOK_SECRET`
3. Faça um novo deploy (ou aguarde o próximo push)

---

## Passo 7: Verificar Deployment

### 7.1 Acessar Aplicação

1. Abra `https://seu-app.vercel.app`
2. Teste o login com Google
3. Crie uma clínica
4. Teste criar profissionais, clientes e agendamentos

### 7.2 Verificar Logs

Se houver erros:

1. Vá em **Deployments** no projeto Vercel
2. Clique no deployment
3. Vá em **Functions** → Selecione uma função → **Logs**

---

## Passo 8: Domínio Customizado (Opcional)

### 8.1 Adicionar Domínio

1. Vá em **Settings** → **Domains**
2. Clique em **Add**
3. Digite seu domínio (ex: `agendamentos.com.br`)
4. Siga as instruções para configurar DNS

### 8.2 Atualizar Variáveis de Ambiente

Após adicionar domínio customizado, atualize:

- `BETTER_AUTH_URL=https://agendamentos.com.br`
- `NEXT_PUBLIC_APP_URL=https://agendamentos.com.br`

E atualize também:

- Google OAuth redirect URIs
- Stripe webhook URL

---

## Troubleshooting

### Erro: "Database connection failed"

**Solução**: Verifique se a `DATABASE_URL` está correta e inclui `?sslmode=require`

### Erro: "BETTER_AUTH_SECRET is required"

**Solução**: Certifique-se de que adicionou a variável de ambiente na Vercel

### Erro: "Google OAuth redirect_uri_mismatch"

**Solução**: Verifique se adicionou a URL correta no Google Cloud Console

### Build falha com erro de TypeScript

**Solução**: Execute `npm run build` localmente para identificar o erro antes de fazer push

---

## Comandos Úteis

```bash
# Testar build localmente
npm run build

# Executar migração no Neon
npx drizzle-kit push

# Ver logs da Vercel (CLI)
vercel logs

# Fazer redeploy
git commit --allow-empty -m "redeploy"
git push
```

---

## Estrutura de Deployment

```
┌─────────────┐
│   Vercel    │ ← Frontend + Backend (Next.js)
│  (Hosting)  │
└──────┬──────┘
       │
       │ DATABASE_URL
       ↓
┌─────────────┐
│    Neon     │ ← PostgreSQL Database
│ (Database)  │
└─────────────┘
```

**Características:**

- ✅ Frontend e Backend no mesmo deploy (Next.js App Router)
- ✅ Serverless Functions automáticas (API Routes)
- ✅ Edge Network global (CDN)
- ✅ SSL/HTTPS automático
- ✅ Previews automáticos para cada PR

---

## Próximos Passos

1. ✅ Configurar domínio customizado
2. ✅ Configurar monitoramento (Vercel Analytics)
3. ✅ Configurar backups do banco (Neon tem backups automáticos)
4. ✅ Testar integração N8N em produção
5. ✅ Configurar alertas de erro (Sentry, LogRocket, etc.)

---

## Custos Estimados

**Vercel**:

- Hobby (Free): 100GB bandwidth, unlimited deploys
- Pro ($20/mês): 1TB bandwidth, analytics, mais recursos

**Neon**:

- Free: 0.5GB storage, 1 projeto
- Pro ($19/mês): 10GB storage, múltiplos projetos, backups

**Total para começar**: $0 (planos gratuitos) ou ~$40/mês (planos Pro)

---

## Suporte

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Neon Docs: [neon.tech/docs](https://neon.tech/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
