# DeliveryHub

Sistema web para restaurantes, cozinhas, confeitarias e operações de delivery.

**DeliveryHub** integra:

1. **Autenticação** — login, registro e isolamento por operação/restaurante
2. **Insumos** — matérias-primas e custos
3. **Ficha Técnica** — preparos com rendimento e validade
4. **Precificação** — custo, margem e preço de venda
5. **Etiqueta de Validade** — geração e impressão

Pronto para hospedar no seu domínio (Docker + HTTPS). Veja [DEPLOY.md](./DEPLOY.md).

## Nome técnico

O nome técnico do projeto é **deliveryhub** (package, banco, scripts e documentação).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Auth.js (NextAuth v5) com credenciais
- Prisma + SQLite (`prisma/deliveryhub.db`)
- Docker Compose para produção
- Interface em português (pt-BR)

## Como rodar (local)

```bash
npm install
cp .env.example .env
# Gere AUTH_SECRET: openssl rand -base64 32
npm run deliveryhub:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

A raiz abre em **Criar conta** (`/registro`). Cada operação começa com dados vazios e isolados.

Para popular dados de demonstração (opcional):

```bash
npm run db:seed
```

Para limpar tudo e voltar ao estado de cadastro:

```bash
npm run db:clean
```

## Hospedar no domínio

```bash
cp .env.example .env
# Defina AUTH_SECRET e AUTH_URL=https://seu-dominio.com.br
docker compose up -d --build
```

Guia completo com Caddy/Nginx e HTTPS: **[DEPLOY.md](./DEPLOY.md)**

Healthcheck: `GET /api/health`

## Scripts DeliveryHub

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Migrations (dev) |
| `npm run db:deploy` | Migrations (produção) |
| `npm run db:seed` | Dados de exemplo |
| `npm run deliveryhub:setup` | Migrate + seed |

## Segurança multi-operação

Cada conta cria uma **organização**. Insumos, fichas, precificação e etiquetas ficam isolados por organização.

## Licença

Projeto privado — DeliveryHub.
