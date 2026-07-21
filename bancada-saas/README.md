# BANCADA

SaaS para pequenos produtores de alimentos — ficha técnica, precificação e etiquetas de validade.

## Módulos

1. **Ficha Técnica** — produto, ingredientes (compra × uso), custo em tempo real
2. **Precificação** — embalagem + percentuais sobre o preço de venda
3. **Etiquetas** — validade automática, grade e PDF A4 (jsPDF)

## Stack

- Next.js 14 (App Router, JavaScript/JSX)
- Supabase (auth e-mail/senha + Postgres + RLS)
- jsPDF
- Estilos inline (sem Tailwind)
- Deploy: Vercel

## Setup local

### 1. Configurar Supabase (recomendado)

Gere um access token em [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) e rode:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."
cd bancada-saas
npm run supabase:configurar
```

O script cria (ou reutiliza) o projeto **bancada**, aplica `001_init.sql`, ajusta Auth e grava `.env.local`.

### Alternativa manual

Copie o exemplo e preencha com as chaves do painel (**Settings → API**):

```bash
cp .env.example .env.local
```

Depois, no **SQL Editor**, execute `supabase/migrations/001_init.sql`.

### 3. Instalar e rodar

```bash
npm install
npm run test:calculos   # valida a lógica de custo/preço
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), crie uma conta em `/login` e use o app em `/app`.

### 4. Deploy na Vercel

1. Conecte o repositório (pasta `bancada-saas` como root do projeto, se estiver em monorepo)
2. Configure as mesmas variáveis `NEXT_PUBLIC_SUPABASE_*`
3. No Supabase → Authentication → URL Configuration, adicione a URL da Vercel em **Site URL** e **Redirect URLs** (`https://seu-dominio.vercel.app/auth/callback`)

## Design

| Token     | Cor       |
|-----------|-----------|
| Primário  | `#2E6B4F` |
| Fundo     | `#F2F4F0` |
| Tinta     | `#212824` |
| Cinza     | `#5C6660` |
| Borda     | `#DDE3DC` |
| Alerta    | `#B97F1B` |

Fontes: **Archivo** + **IBM Plex Mono**.

## Roadmap

- **Fase 2:** Stripe Checkout, plano grátis (3 fichas) vs Pro, página de preços, recuperação de senha
- **Fase 3:** catálogo de insumos, histórico de preços, sub-receitas, etiquetas Pimaco/térmica, equipes, CMV
