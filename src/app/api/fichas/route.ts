import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

async function validarInsumosDaOrganizacao(
  organizationId: string,
  itens: { insumoId: string }[]
) {
  const insumoIds = itens.map((item) => item.insumoId).filter(Boolean);
  if (insumoIds.length === 0) return true;

  const count = await prisma.insumo.count({
    where: {
      id: { in: insumoIds },
      organizationId,
      ativo: true,
    },
  });

  return count === insumoIds.length;
}

export async function GET() {
  try {
    const user = await requireSession();
    const fichas = await prisma.fichaTecnica.findMany({
      where: { organizationId: user.organizationId, ativo: true },
      include: {
        itens: { include: { insumo: true } },
        precificacao: true,
        _count: { select: { etiquetas: true } },
      },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(fichas);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = await request.json();
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (!(await validarInsumosDaOrganizacao(user.organizationId, itens))) {
      return NextResponse.json(
        { error: "Um ou mais insumos são inválidos ou pertencem a outra organização." },
        { status: 400 }
      );
    }

    const ficha = await prisma.fichaTecnica.create({
      data: {
        organizationId: user.organizationId,
        nome: String(body.nome).trim(),
        categoria: String(body.categoria || "Geral").trim(),
        rendimento: Number(body.rendimento) || 1,
        unidadeRendimento: String(body.unidadeRendimento || "porções").trim(),
        modoPreparo: String(body.modoPreparo || ""),
        validadeHoras: Number(body.validadeHoras) || 24,
        observacoes: String(body.observacoes || ""),
        itens: {
          create: itens.map(
            (item: {
              insumoId: string;
              quantidade: number;
              perdaPercentual?: number;
            }) => ({
              insumoId: item.insumoId,
              quantidade: Number(item.quantidade),
              perdaPercentual: Number(item.perdaPercentual) || 0,
            })
          ),
        },
      },
      include: { itens: { include: { insumo: true } } },
    });

    const itensCusto = ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));

    const params = {
      custoEmbalagem: Number(body.custoEmbalagem) || 0,
      custoMaoDeObra: Number(body.custoMaoDeObra) || 0,
      custoOperacional: Number(body.custoOperacional) || 0,
      margemPercentual: Number(body.margemPercentual) || 30,
      impostosPercentual: Number(body.impostosPercentual) || 0,
      taxaDelivery: Number(body.taxaDelivery) || 0,
    };

    const resultado = calcularPrecificacao(itensCusto, ficha.rendimento, params);

    await prisma.precificacao.create({
      data: {
        fichaId: ficha.id,
        ...params,
        precoSugerido: Math.round(resultado.precoSugerido * 100) / 100,
        precoPraticado: Math.round(resultado.precoSugerido * 100) / 100,
      },
    });

    const completa = await prisma.fichaTecnica.findUnique({
      where: { id: ficha.id },
      include: {
        itens: { include: { insumo: true } },
        precificacao: true,
      },
    });

    return NextResponse.json(completa, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
