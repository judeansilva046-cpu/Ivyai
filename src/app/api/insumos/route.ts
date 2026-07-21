import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const insumos = await prisma.insumo.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(insumos);
}

export async function POST(request: Request) {
  const body = await request.json();
  const insumo = await prisma.insumo.create({
    data: {
      nome: String(body.nome).trim(),
      unidade: String(body.unidade).trim(),
      custoUnitario: Number(body.custoUnitario),
      categoria: String(body.categoria || "Geral").trim(),
    },
  });
  return NextResponse.json(insumo, { status: 201 });
}
