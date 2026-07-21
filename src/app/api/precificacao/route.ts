import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";

export async function GET() {
  const precos = await prisma.precificacao.findMany({
    include: {
      ficha: {
        include: {
          itens: { include: { insumo: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const comCalculo = precos
    .filter((p) => p.ficha.ativo)
    .map((p) => {
      const itens = p.ficha.itens.map((i) => ({
        quantidade: i.quantidade,
        perdaPercentual: i.perdaPercentual,
        custoUnitario: i.insumo.custoUnitario,
      }));
      const calculo = calcularPrecificacao(itens, p.ficha.rendimento, {
        custoEmbalagem: p.custoEmbalagem,
        custoMaoDeObra: p.custoMaoDeObra,
        custoOperacional: p.custoOperacional,
        margemPercentual: p.margemPercentual,
        impostosPercentual: p.impostosPercentual,
        taxaDelivery: p.taxaDelivery,
      });
      return { ...p, calculo };
    });

  return NextResponse.json(comCalculo);
}
