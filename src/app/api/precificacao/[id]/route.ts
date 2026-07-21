import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = await request.json();

    const atual = await prisma.precificacao.findUnique({
      where: { id },
      include: {
        ficha: { include: { itens: { include: { insumo: true } } } },
      },
    });

    if (!atual || atual.ficha.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Precificação não encontrada" },
        { status: 404 }
      );
    }

    const paramsPrec = {
      custoEmbalagem: Number(body.custoEmbalagem) || 0,
      custoMaoDeObra: Number(body.custoMaoDeObra) || 0,
      custoOperacional: Number(body.custoOperacional) || 0,
      margemPercentual: Number(body.margemPercentual) || 0,
      impostosPercentual: Number(body.impostosPercentual) || 0,
      taxaDelivery: Number(body.taxaDelivery) || 0,
    };

    const itens = atual.ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));

    const calculo = calcularPrecificacao(
      itens,
      atual.ficha.rendimento,
      paramsPrec
    );
    const precoSugerido = Math.round(calculo.precoSugerido * 100) / 100;

    const updated = await prisma.precificacao.update({
      where: { id },
      data: {
        ...paramsPrec,
        precoSugerido,
        precoPraticado:
          Number(body.precoPraticado) || precoSugerido,
      },
      include: {
        ficha: { include: { itens: { include: { insumo: true } } } },
      },
    });

    return NextResponse.json({ ...updated, calculo });
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
