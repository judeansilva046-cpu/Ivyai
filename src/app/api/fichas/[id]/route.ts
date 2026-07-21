import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const ficha = await prisma.fichaTecnica.findUnique({
      where: { id },
      include: {
        itens: { include: { insumo: true } },
        precificacao: true,
        etiquetas: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!ficha || ficha.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    return NextResponse.json(ficha);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const itens = Array.isArray(body.itens) ? body.itens : [];

    const existente = await prisma.fichaTecnica.findUnique({ where: { id } });
    if (!existente || existente.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    if (!(await validarInsumosDaOrganizacao(user.organizationId, itens))) {
      return NextResponse.json(
        { error: "Um ou mais insumos são inválidos ou pertencem a outra organização." },
        { status: 400 }
      );
    }

    await prisma.itemFicha.deleteMany({ where: { fichaId: id } });

    const ficha = await prisma.fichaTecnica.update({
      where: { id },
      data: {
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
      include: { itens: { include: { insumo: true } }, precificacao: true },
    });

    const itensCusto = ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));

    const atual = ficha.precificacao;
    const paramsPrec = {
      custoEmbalagem: Number(body.custoEmbalagem ?? atual?.custoEmbalagem) || 0,
      custoMaoDeObra: Number(body.custoMaoDeObra ?? atual?.custoMaoDeObra) || 0,
      custoOperacional:
        Number(body.custoOperacional ?? atual?.custoOperacional) || 0,
      margemPercentual:
        Number(body.margemPercentual ?? atual?.margemPercentual) || 30,
      impostosPercentual:
        Number(body.impostosPercentual ?? atual?.impostosPercentual) || 0,
      taxaDelivery: Number(body.taxaDelivery ?? atual?.taxaDelivery) || 0,
    };

    const resultado = calcularPrecificacao(itensCusto, ficha.rendimento, paramsPrec);
    const precoSugerido = Math.round(resultado.precoSugerido * 100) / 100;

    if (atual) {
      await prisma.precificacao.update({
        where: { id: atual.id },
        data: {
          ...paramsPrec,
          precoSugerido,
          precoPraticado:
            Number(body.precoPraticado ?? atual.precoPraticado) || precoSugerido,
        },
      });
    } else {
      await prisma.precificacao.create({
        data: {
          fichaId: id,
          ...paramsPrec,
          precoSugerido,
          precoPraticado: precoSugerido,
        },
      });
    }

    const completa = await prisma.fichaTecnica.findUnique({
      where: { id },
      include: {
        itens: { include: { insumo: true } },
        precificacao: true,
      },
    });

    return NextResponse.json(completa);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const existente = await prisma.fichaTecnica.findUnique({ where: { id } });
    if (!existente || existente.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    await prisma.fichaTecnica.update({
      where: { id },
      data: { ativo: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
