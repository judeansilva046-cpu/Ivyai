/*
  Warnings:

  - Added the required column `organizationId` to the `EtiquetaValidade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `FichaTecnica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Insumo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EtiquetaValidade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
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
    CONSTRAINT "EtiquetaValidade_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EtiquetaValidade_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaTecnica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EtiquetaValidade" ("armazenamento", "createdAt", "dataProducao", "dataValidade", "fichaId", "id", "lote", "nomeProduto", "observacoes", "quantidade", "responsavel", "updatedAt") SELECT "armazenamento", "createdAt", "dataProducao", "dataValidade", "fichaId", "id", "lote", "nomeProduto", "observacoes", "quantidade", "responsavel", "updatedAt" FROM "EtiquetaValidade";
DROP TABLE "EtiquetaValidade";
ALTER TABLE "new_EtiquetaValidade" RENAME TO "EtiquetaValidade";
CREATE INDEX "EtiquetaValidade_organizationId_idx" ON "EtiquetaValidade"("organizationId");
CREATE TABLE "new_FichaTecnica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "rendimento" REAL NOT NULL,
    "unidadeRendimento" TEXT NOT NULL DEFAULT 'porções',
    "modoPreparo" TEXT NOT NULL DEFAULT '',
    "validadeHoras" INTEGER NOT NULL DEFAULT 24,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FichaTecnica_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FichaTecnica" ("ativo", "categoria", "createdAt", "id", "modoPreparo", "nome", "observacoes", "rendimento", "unidadeRendimento", "updatedAt", "validadeHoras") SELECT "ativo", "categoria", "createdAt", "id", "modoPreparo", "nome", "observacoes", "rendimento", "unidadeRendimento", "updatedAt", "validadeHoras" FROM "FichaTecnica";
DROP TABLE "FichaTecnica";
ALTER TABLE "new_FichaTecnica" RENAME TO "FichaTecnica";
CREATE INDEX "FichaTecnica_organizationId_idx" ON "FichaTecnica"("organizationId");
CREATE TABLE "new_Insumo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Insumo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Insumo" ("ativo", "categoria", "createdAt", "custoUnitario", "id", "nome", "unidade", "updatedAt") SELECT "ativo", "categoria", "createdAt", "custoUnitario", "id", "nome", "unidade", "updatedAt" FROM "Insumo";
DROP TABLE "Insumo";
ALTER TABLE "new_Insumo" RENAME TO "Insumo";
CREATE INDEX "Insumo_organizationId_idx" ON "Insumo"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
