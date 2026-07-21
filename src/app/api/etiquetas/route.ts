import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireSession();
    const etiquetas = await prisma.etiquetaValidade.findMany({
      where: { organizationId: user.organizationId },
      include: { ficha: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(etiquetas);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = await request.json();

    let nomeProduto = String(body.nomeProduto || "").trim();
    let validadeHoras = Number(body.validadeHoras) || 24;
    const fichaId = body.fichaId ? String(body.fichaId) : null;

    if (fichaId) {
      const ficha = await prisma.fichaTecnica.findUnique({
        where: { id: fichaId },
      });
      if (!ficha || ficha.organizationId !== user.organizationId) {
        return NextResponse.json(
          { error: "Ficha não encontrada" },
          { status: 400 }
        );
      }
      if (!nomeProduto) nomeProduto = ficha.nome;
      validadeHoras = ficha.validadeHoras;
    }

    const dataProducao = body.dataProducao
      ? new Date(body.dataProducao)
      : new Date();

    const dataValidade = body.dataValidade
      ? new Date(body.dataValidade)
      : new Date(dataProducao.getTime() + validadeHoras * 60 * 60 * 1000);

    const etiqueta = await prisma.etiquetaValidade.create({
      data: {
        organizationId: user.organizationId,
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
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
