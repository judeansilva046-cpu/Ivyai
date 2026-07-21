import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const etiqueta = await prisma.etiquetaValidade.findUnique({
    where: { id },
    include: { ficha: true },
  });

  if (!etiqueta) {
    return NextResponse.json(
      { error: "Etiqueta não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(etiqueta);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await prisma.etiquetaValidade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
