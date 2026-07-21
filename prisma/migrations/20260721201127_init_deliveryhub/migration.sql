-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FichaTecnica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "rendimento" REAL NOT NULL,
    "unidadeRendimento" TEXT NOT NULL DEFAULT 'porções',
    "modoPreparo" TEXT NOT NULL DEFAULT '',
    "validadeHoras" INTEGER NOT NULL DEFAULT 24,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemFicha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fichaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "perdaPercentual" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ItemFicha_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaTecnica" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemFicha_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Precificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fichaId" TEXT NOT NULL,
    "custoEmbalagem" REAL NOT NULL DEFAULT 0,
    "custoMaoDeObra" REAL NOT NULL DEFAULT 0,
    "custoOperacional" REAL NOT NULL DEFAULT 0,
    "margemPercentual" REAL NOT NULL DEFAULT 30,
    "impostosPercentual" REAL NOT NULL DEFAULT 0,
    "taxaDelivery" REAL NOT NULL DEFAULT 0,
    "precoSugerido" REAL NOT NULL DEFAULT 0,
    "precoPraticado" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Precificacao_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaTecnica" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EtiquetaValidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fichaId" TEXT,
    "nomeProduto" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "dataProducao" DATETIME NOT NULL,
    "dataValidade" DATETIME NOT NULL,
    "responsavel" TEXT NOT NULL,
    "armazenamento" TEXT NOT NULL DEFAULT 'Refrigerado',
    "observacoes" TEXT NOT NULL DEFAULT '',
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EtiquetaValidade_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaTecnica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Precificacao_fichaId_key" ON "Precificacao"("fichaId");
