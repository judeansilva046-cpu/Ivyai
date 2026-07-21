// DeliveryHub — recalcula precificação de uma ficha após mudança de custo
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";

export async function recalcularPrecificacaoFicha(fichaId: string) {
  const ficha = await prisma.fichaTecnica.findUnique({
    where: { id: fichaId },
    include: {
      itens: { include: { insumo: true } },
      precificacao: true,
    },
  });

  if (!ficha || !ficha.precificacao) return null;

  const itens = ficha.itens.map((i) => ({
    quantidade: i.quantidade,
    perdaPercentual: i.perdaPercentual,
    custoUnitario: i.insumo.custoUnitario,
  }));

  const p = ficha.precificacao;
  const resultado = calcularPrecificacao(itens, ficha.rendimento, {
    custoEmbalagem: p.custoEmbalagem,
    custoMaoDeObra: p.custoMaoDeObra,
    custoOperacional: p.custoOperacional,
    margemPercentual: p.margemPercentual,
    impostosPercentual: p.impostosPercentual,
    taxaDelivery: p.taxaDelivery,
  });

  const precoSugerido = Math.round(resultado.precoSugerido * 100) / 100;

  return prisma.precificacao.update({
    where: { id: p.id },
    data: { precoSugerido },
  });
}
