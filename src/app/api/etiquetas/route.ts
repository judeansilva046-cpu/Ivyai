import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const etiquetas = await prisma.etiquetaValidade.findMany({
    include: { ficha: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(etiquetas);
}

export async function POST(request: Request) {
  const body = await request.json();

  let nomeProduto = String(body.nomeProduto || "").trim();
  let validadeHoras = Number(body.validadeHoras) || 24;
  const fichaId = body.fichaId ? String(body.fichaId) : null;

  if (fichaId) {
    const ficha = await prisma.fichaTecnica.findUnique({
      where: { id: fichaId },
    });
    if (ficha) {
      if (!nomeProduto) nomeProduto = ficha.nome;
      validadeHoras = ficha.validadeHoras;
    }
  }

  const dataProducao = body.dataProducao
    ? new Date(body.dataProducao)
    : new Date();

  const dataValidade = body.dataValidade
    ? new Date(body.dataValidade)
    : new Date(dataProducao.getTime() + validadeHoras * 60 * 60 * 1000);

  const etiqueta = await prisma.etiquetaValidade.create({
    data: {
      fichaId,
      nomeProduto,
      lote: String(body.lote || "").trim(),
      dataProducao,
      dataValidade,
      responsavel: String(body.responsavel || "").trim(),
      armazenamento: String(body.armazenamento || "Refrigerado").trim(),
      observacoes: String(body.observacoes || ""),
      quantidade: Number(body.quantidade) || 1,
    },
    include: { ficha: true },
  });

  return NextResponse.json(etiqueta, { status: 201 });
}
