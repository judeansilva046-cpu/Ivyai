import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const categoria = searchParams.get("categoria")?.trim();

  const insumos = await prisma.insumo.findMany({
    where: {
      ativo: true,
      ...(q
        ? {
            OR: [
              { nome: { contains: q } },
              { categoria: { contains: q } },
            ],
          }
        : {}),
      ...(categoria ? { categoria } : {}),
    },
    include: {
      _count: { select: { itensFicha: true } },
    },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  return NextResponse.json(insumos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const nome = String(body.nome || "").trim();
  const unidade = String(body.unidade || "").trim();
  const custoUnitario = Number(body.custoUnitario);

  if (!nome || !unidade || Number.isNaN(custoUnitario) || custoUnitario < 0) {
    return NextResponse.json(
      { error: "Informe nome, unidade e custo válido." },
      { status: 400 }
    );
  }

  const insumo = await prisma.insumo.create({
    data: {
      nome,
      unidade,
      custoUnitario,
      categoria: String(body.categoria || "Geral").trim() || "Geral",
    },
  });

  return NextResponse.json(insumo, { status: 201 });
}
