// DeliveryHub — limpa todos os dados (plataforma pronta para cadastro)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl =
  process.env.DATABASE_URL ??
  `file:${path.join(process.cwd(), "prisma", "deliveryhub.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("DeliveryHub — limpando banco...");
  await prisma.etiquetaValidade.deleteMany();
  await prisma.precificacao.deleteMany();
  await prisma.itemFicha.deleteMany();
  await prisma.fichaTecnica.deleteMany();
  await prisma.insumo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log("DeliveryHub — banco limpo. Pronto para cadastrar em /registro");
}

main()
  .catch((e) => {
    console.error("DeliveryHub — erro ao limpar:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
