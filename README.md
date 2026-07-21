# DeliveryHub

Sistema web para restaurantes, cozinhas, confeitarias e operações de delivery.

**DeliveryHub** integra os módulos:

1. **Insumos** — cadastro e atualização de matérias-primas e custos
2. **Ficha Técnica** — cadastro de preparos com insumos, rendimento, modo de preparo e validade
3. **Precificação** — cálculo de custo, margem, impostos e preço sugerido/praticado
4. **Etiqueta de Validade** — geração e impressão de etiquetas com lote, produção e validade

## Nome técnico

O nome técnico do projeto é **deliveryhub** (package, banco, scripts e documentação).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (`prisma/deliveryhub.db`)
- Interface em português (pt-BR)

## Como rodar

```bash
# Instalar dependências
npm install

# Configurar banco (já incluso .env.example)
cp .env.example .env

# Migrar e popular dados de exemplo
npm run deliveryhub:setup

# Ambiente de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts DeliveryHub

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Rodar migrations |
| `npm run db:seed` | Popular banco com dados de exemplo |
| `npm run db:reset` | Resetar banco DeliveryHub |
| `npm run deliveryhub:setup` | Migrate + seed |

## Módulos

### Insumos (`/insumos`)

- CRUD de matérias-primas (nome, unidade, custo, categoria)
- Busca e filtro por categoria
- Ao alterar o custo, o DeliveryHub recalcula o preço sugerido das fichas vinculadas

### Ficha Técnica (`/fichas`)

- CRUD de fichas com lista de insumos e perda percentual
- Cadastro rápido de insumos ou vínculo com o módulo Insumos
- Busca por nome/categoria
- Rendimento, validade em horas e modo de preparo
- Ao salvar, cria/atualiza a precificação vinculada

### Precificação (`/precificacao`)

- Custo de insumos + embalagem + mão de obra + operacional
- Margem %, impostos % e taxa de delivery
- Preço sugerido e preço praticado editáveis

### Etiqueta de Validade (`/etiquetas`)

- Vínculo opcional com ficha técnica
- Cálculo automático da validade pelas horas da ficha
- Busca por produto, lote ou responsável
- Visual pronto para impressão (Ctrl/Cmd+P)

## Banco de dados

O banco SQLite do DeliveryHub fica em:

```
prisma/deliveryhub.db
```

Variável de ambiente:

```
DATABASE_URL="file:./prisma/deliveryhub.db"
```

## Estrutura

```
src/
  app/           # Páginas e API routes do DeliveryHub
  components/    # Componentes de UI
  lib/           # db, cálculos e formatação
prisma/
  schema.prisma  # Schema DeliveryHub
  seed.ts        # Dados de exemplo
  deliveryhub.db # Banco SQLite (gerado localmente)
```

## Licença

Projeto privado — DeliveryHub.
