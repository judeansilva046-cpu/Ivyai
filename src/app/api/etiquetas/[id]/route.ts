import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requireSession, unauthorized } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;
    const etiqueta = await prisma.etiquetaValidade.findUnique({
      where: { id },
      include: { ficha: true },
    });

    if (!etiqueta || etiqueta.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Etiqueta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(etiqueta);
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const existente = await prisma.etiquetaValidade.findUnique({ where: { id } });
    if (!existente || existente.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Etiqueta não encontrada" },
        { status: 404 }
      );
    }

    await prisma.etiquetaValidade.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return unauthorized(e.message);
    throw e;
  }
}
