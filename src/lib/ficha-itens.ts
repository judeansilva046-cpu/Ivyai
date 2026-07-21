// DeliveryHub — resolve itens de ficha (cria insumos sob demanda, estilo ChefPro)
import { prisma } from "@/lib/db";

export type ItemInput = {
  insumoId?: string;
  nome?: string;
  unidade?: string;
  custoUnitario?: number;
  quantidade: number;
  perdaPercentual?: number;
};

export async function resolverItensFicha(
  organizationId: string,
  itens: ItemInput[]
) {
  const resolved: {
    insumoId: string;
    quantidade: number;
    perdaPercentual: number;
    custoUnitario: number;
  }[] = [];

  for (const item of itens) {
    const quantidade = Number(item.quantidade);
    if (!quantidade || quantidade <= 0) continue;

    let insumoId = item.insumoId ? String(item.insumoId) : "";
    let custoUnitario = 0;

    if (insumoId) {
      const existente = await prisma.insumo.findFirst({
        where: { id: insumoId, organizationId, ativo: true },
      });
      if (!existente) {
        throw new Error("Insumo inválido para esta operação.");
      }
      if (
        item.custoUnitario != null &&
        !Number.isNaN(Number(item.custoUnitario)) &&
        Number(item.custoUnitario) >= 0 &&
        Number(item.custoUnitario) !== existente.custoUnitario
      ) {
        await prisma.insumo.update({
          where: { id: existente.id },
          data: { custoUnitario: Number(item.custoUnitario) },
        });
        custoUnitario = Number(item.custoUnitario);
      } else {
        custoUnitario = existente.custoUnitario;
      }
    } else {
      const nome = String(item.nome || "").trim();
      const unidade = String(item.unidade || "kg").trim() || "kg";
      const custo = Number(item.custoUnitario);
      if (!nome || Number.isNaN(custo) || custo < 0) {
        throw new Error(
          "Cada ingrediente precisa de nome, unidade e custo válido."
        );
      }

      const jaExiste = await prisma.insumo.findFirst({
        where: { organizationId, ativo: true, nome },
      });

      if (jaExiste) {
        await prisma.insumo.update({
          where: { id: jaExiste.id },
          data: { custoUnitario: custo, unidade },
        });
        insumoId = jaExiste.id;
      } else {
        const criado = await prisma.insumo.create({
          data: {
            organizationId,
            nome,
            unidade,
            custoUnitario: custo,
            categoria: "Geral",
          },
        });
        insumoId = criado.id;
      }
      custoUnitario = custo;
    }

    resolved.push({
      insumoId,
      quantidade,
      perdaPercentual: Number(item.perdaPercentual) || 0,
      custoUnitario,
    });
  }

  return resolved;
}
