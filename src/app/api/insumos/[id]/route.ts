import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recalcularPrecificacaoFicha } from "@/lib/recalc";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const insumo = await prisma.insumo.findUnique({
      where: { id },
      include: {
        _count: { select: { itensFicha: true } },
        itensFicha: {
          include: {
            ficha: { select: { id: true, nome: true, ativo: true } },
          },
        },
      },
    });

    if (!insumo || !insumo.ativo || insumo.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(insumo);
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

    const existente = await prisma.insumo.findUnique({ where: { id } });
    if (
      !existente ||
      !existente.ativo ||
      existente.organizationId !== user.organizationId
    ) {
      return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
    }

    const custoUnitario = Number(body.custoUnitario);
    if (Number.isNaN(custoUnitario) || custoUnitario < 0) {
      return NextResponse.json({ error: "Custo inválido." }, { status: 400 });
    }

    const custoMudou = existente.custoUnitario !== custoUnitario;

    const insumo = await prisma.insumo.update({
      where: { id },
      data: {
        nome: String(body.nome || "").trim(),
        unidade: String(body.unidade || "").trim(),
        custoUnitario,
        categoria: String(body.categoria || "Geral").trim() || "Geral",
      },
    });

    // DeliveryHub — ao mudar o custo, recalcula precificação das fichas vinculadas
    if (custoMudou) {
      const vinculos = await prisma.itemFicha.findMany({
        where: {
          insumoId: id,
          ficha: { organizationId: user.organizationId },
        },
        select: { fichaId: true },
        distinct: ["fichaId"],
      });
      for (const v of vinculos) {
        await recalcularPrecificacaoFicha(v.fichaId);
      }
    }

    return NextResponse.json(insumo);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const existente = await prisma.insumo.findUnique({ where: { id } });
    if (!existente || existente.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
    }

    const usado = await prisma.itemFicha.count({ where: { insumoId: id } });
    if (usado > 0) {
      // Soft-delete para não quebrar fichas existentes
      await prisma.insumo.update({
        where: { id },
        data: { ativo: false },
      });
    } else {
      await prisma.insumo.delete({ where: { id } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
