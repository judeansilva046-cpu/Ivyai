import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import PrecificacaoClient from "./PrecificacaoClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Precificação",
};

export default async function PrecificacaoPage() {
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

  const initial = precos
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
      return {
        id: p.id,
        custoEmbalagem: p.custoEmbalagem,
        custoMaoDeObra: p.custoMaoDeObra,
        custoOperacional: p.custoOperacional,
        margemPercentual: p.margemPercentual,
        impostosPercentual: p.impostosPercentual,
        taxaDelivery: p.taxaDelivery,
        precoSugerido: p.precoSugerido,
        precoPraticado: p.precoPraticado,
        ficha: {
          id: p.ficha.id,
          nome: p.ficha.nome,
          categoria: p.ficha.categoria,
          rendimento: p.ficha.rendimento,
          unidadeRendimento: p.ficha.unidadeRendimento,
          itens: p.ficha.itens.map((i) => ({
            quantidade: i.quantidade,
            perdaPercentual: i.perdaPercentual,
            insumo: { custoUnitario: i.insumo.custoUnitario },
          })),
        },
        calculo,
      };
    });

  return <PrecificacaoClient initialRows={initial} />;
}
