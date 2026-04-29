# Deploy no Vercel

Esta branch (`vercel-deploy`) foi preparada para deploy sem alterar a versao atual da branch `main`.

## 1. Criar o banco

Crie um banco PostgreSQL para producao, por exemplo:

- Vercel Postgres
- Neon
- Supabase

Copie a connection string e salve no Vercel como `DATABASE_URL`.

## 2. Variaveis de ambiente

No Vercel, configure:

```bash
OPENAI_API_KEY=sk-...
AUTH_SECRET=...
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=...
```

Gere `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Gere `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarde a `ENCRYPTION_KEY`. Se ela mudar depois que usuarios forem criados, os dados criptografados antigos nao poderao ser lidos.

## 3. Rodar migracoes

Depois de configurar `DATABASE_URL`, rode uma vez:

```bash
npm run db:migrate
```

Ou rode o comando equivalente em um ambiente com acesso ao mesmo banco.

## 4. Deploy

No Vercel:

1. Importe `https://github.com/jebmedeiros1/looksy`.
2. Escolha a branch `vercel-deploy`.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. Deploy.

Para voltar para a versao atual, use a branch `main`.
