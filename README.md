# Looksy MVP

## Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua chave da OpenAI:
# OPENAI_API_KEY=sk-...

# 3. Rodar localmente
npm run dev
# Acesse http://localhost:3000
```

## Deploy no Vercel

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Deploy
vercel

# Adicionar variável de ambiente no Vercel:
# No dashboard: Settings → Environment Variables → OPENAI_API_KEY
```

Ou via dashboard: https://vercel.com/new → Import Git Repository

## Funcionalidades do MVP

- **Armário Digital**: Upload de fotos de roupas com classificação automática por IA (GPT-4o Vision)
- **Gerador de Looks**: Escolha evento + mood → IA monta 3 looks com suas peças reais
- **Mapeamento Emocional**: 8 moods (Empoderada, Alegre, Sofisticada, etc.)
- **Salvar Looks**: Looks favoritos salvos localmente
- **Dados locais**: Tudo salvo no localStorage do navegador (sem banco de dados)
