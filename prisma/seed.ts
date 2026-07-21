// DeliveryHub — seed de dados de exemplo para demonstração
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { calcularPrecificacao } from "../src/lib/calculations";

const dbUrl =
  process.env.DATABASE_URL ??
  `file:${path.join(process.cwd(), "prisma", "deliveryhub.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("DeliveryHub — iniciando seed...");

  await prisma.etiquetaValidade.deleteMany();
  await prisma.precificacao.deleteMany();
  await prisma.itemFicha.deleteMany();
  await prisma.fichaTecnica.deleteMany();
  await prisma.insumo.deleteMany();

  const insumos = await Promise.all([
    prisma.insumo.create({
      data: {
        nome: "Farinha de trigo",
        unidade: "kg",
        custoUnitario: 5.9,
        categoria: "Secos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Açúcar cristal",
        unidade: "kg",
        custoUnitario: 4.5,
        categoria: "Secos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Ovos",
        unidade: "un",
        custoUnitario: 0.85,
        categoria: "Frescos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Manteiga sem sal",
        unidade: "kg",
        custoUnitario: 42.0,
        categoria: "Laticínios",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Leite integral",
        unidade: "L",
        custoUnitario: 5.2,
        categoria: "Laticínios",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Chocolate meio amargo",
        unidade: "kg",
        custoUnitario: 68.0,
        categoria: "Secos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Peito de frango",
        unidade: "kg",
        custoUnitario: 22.5,
        categoria: "Proteínas",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Arroz tipo 1",
        unidade: "kg",
        custoUnitario: 6.8,
        categoria: "Secos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Feijão carioca",
        unidade: "kg",
        custoUnitario: 9.2,
        categoria: "Secos",
      },
    }),
    prisma.insumo.create({
      data: {
        nome: "Embalagem marmita 750ml",
        unidade: "un",
        custoUnitario: 1.4,
        categoria: "Embalagens",
      },
    }),
  ]);

  const [
    farinha,
    acucar,
    ovos,
    manteiga,
    leite,
    chocolate,
    frango,
    arroz,
    feijao,
    embalagem,
  ] = insumos;

  const brownie = await prisma.fichaTecnica.create({
    data: {
      nome: "Brownie de chocolate",
      categoria: "Confeitaria",
      rendimento: 12,
      unidadeRendimento: "unidades",
      validadeHoras: 72,
      modoPreparo:
        "Derreta a manteiga com o chocolate. Misture ovos e açúcar. Incorpore a farinha. Asse a 180°C por 25 minutos.",
      observacoes: "Ideal para delivery em embalagens individuais.",
      itens: {
        create: [
          { insumoId: farinha.id, quantidade: 0.2, perdaPercentual: 2 },
          { insumoId: acucar.id, quantidade: 0.25, perdaPercentual: 0 },
          { insumoId: ovos.id, quantidade: 4, perdaPercentual: 0 },
          { insumoId: manteiga.id, quantidade: 0.15, perdaPercentual: 1 },
          { insumoId: chocolate.id, quantidade: 0.2, perdaPercentual: 3 },
        ],
      },
    },
    include: { itens: { include: { insumo: true } } },
  });

  const marmita = await prisma.fichaTecnica.create({
    data: {
      nome: "Marmita frango com arroz e feijão",
      categoria: "Delivery",
      rendimento: 1,
      unidadeRendimento: "porção",
      validadeHoras: 48,
      modoPreparo:
        "Grelhe o frango temperado. Cozinhe arroz e feijão. Monte na embalagem com 180g de frango, 150g de arroz e 100g de feijão.",
      observacoes: "Manter refrigerado até o despacho.",
      itens: {
        create: [
          { insumoId: frango.id, quantidade: 0.18, perdaPercentual: 8 },
          { insumoId: arroz.id, quantidade: 0.08, perdaPercentual: 5 },
          { insumoId: feijao.id, quantidade: 0.05, perdaPercentual: 5 },
          { insumoId: embalagem.id, quantidade: 1, perdaPercentual: 0 },
        ],
      },
    },
    include: { itens: { include: { insumo: true } } },
  });

  const bolo = await prisma.fichaTecnica.create({
    data: {
      nome: "Bolo de leite",
      categoria: "Confeitaria",
      rendimento: 16,
      unidadeRendimento: "fatias",
      validadeHoras: 48,
      modoPreparo:
        "Bata ovos, açúcar e leite. Incorpore farinha e manteiga derretida. Asse a 170°C por 40 minutos.",
      itens: {
        create: [
          { insumoId: farinha.id, quantidade: 0.3, perdaPercentual: 2 },
          { insumoId: acucar.id, quantidade: 0.2, perdaPercentual: 0 },
          { insumoId: ovos.id, quantidade: 3, perdaPercentual: 0 },
          { insumoId: manteiga.id, quantidade: 0.1, perdaPercentual: 1 },
          { insumoId: leite.id, quantidade: 0.25, perdaPercentual: 0 },
        ],
      },
    },
    include: { itens: { include: { insumo: true } } },
  });

  for (const ficha of [brownie, marmita, bolo]) {
    const itens = ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));

    const params = {
      custoEmbalagem: ficha.categoria === "Delivery" ? 0 : 0.5,
      custoMaoDeObra: ficha.categoria === "Delivery" ? 2.5 : 4.0,
      custoOperacional: 1.5,
      margemPercentual: 35,
      impostosPercentual: 8,
      taxaDelivery: ficha.categoria === "Delivery" ? 3.5 : 0,
    };

    const resultado = calcularPrecificacao(itens, ficha.rendimento, params);

    await prisma.precificacao.create({
      data: {
        fichaId: ficha.id,
        ...params,
        precoSugerido: Math.ceil(resultado.precoSugerido * 100) / 100,
        precoPraticado:
          Math.ceil(resultado.precoSugerido * 100) / 100 +
          (ficha.categoria === "Delivery" ? 0.5 : 1),
      },
    });
  }

  const agora = new Date();
  const validadeBrownie = new Date(agora.getTime() + 72 * 60 * 60 * 1000);
  const validadeMarmita = new Date(agora.getTime() + 48 * 60 * 60 * 1000);

  await prisma.etiquetaValidade.create({
    data: {
      fichaId: brownie.id,
      nomeProduto: brownie.nome,
      lote: `BRW-${agora.toISOString().slice(0, 10).replace(/-/g, "")}-01`,
      dataProducao: agora,
      dataValidade: validadeBrownie,
      responsavel: "Ana Cozinha",
      armazenamento: "Temperatura ambiente",
      observacoes: "Proteger da umidade",
      quantidade: 12,
    },
  });

  await prisma.etiquetaValidade.create({
    data: {
      fichaId: marmita.id,
      nomeProduto: marmita.nome,
      lote: `MAR-${agora.toISOString().slice(0, 10).replace(/-/g, "")}-01`,
      dataProducao: agora,
      dataValidade: validadeMarmita,
      responsavel: "Carlos Delivery",
      armazenamento: "Refrigerado (0–4°C)",
      observacoes: "Consumir após aquecimento",
      quantidade: 20,
    },
  });

  console.log("DeliveryHub — seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error("DeliveryHub — erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
