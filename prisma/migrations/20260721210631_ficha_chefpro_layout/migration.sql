-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FichaTecnica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "rendimento" REAL NOT NULL,
    "unidadeRendimento" TEXT NOT NULL DEFAULT 'porções',
    "descricao" TEXT NOT NULL DEFAULT '',
    "tempoPreparo" TEXT NOT NULL DEFAULT '',
    "pesoTotal" REAL NOT NULL DEFAULT 0,
    "utensilios" TEXT NOT NULL DEFAULT '',
    "modoPreparo" TEXT NOT NULL DEFAULT '',
    "validadeHoras" INTEGER NOT NULL DEFAULT 24,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FichaTecnica_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FichaTecnica" ("ativo", "categoria", "createdAt", "id", "modoPreparo", "nome", "observacoes", "organizationId", "rendimento", "unidadeRendimento", "updatedAt", "validadeHoras") SELECT "ativo", "categoria", "createdAt", "id", "modoPreparo", "nome", "observacoes", "organizationId", "rendimento", "unidadeRendimento", "updatedAt", "validadeHoras" FROM "FichaTecnica";
DROP TABLE "FichaTecnica";
ALTER TABLE "new_FichaTecnica" RENAME TO "FichaTecnica";
CREATE INDEX "FichaTecnica_organizationId_idx" ON "FichaTecnica"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
