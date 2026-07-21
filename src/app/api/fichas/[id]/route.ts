import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import { AuthError, requireSession, unauthorized } from "@/lib/session";
import { resolverItensFicha } from "@/lib/ficha-itens";

type Params = { params: Promise<{ id: string }> };

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
    const rawItens = Array.isArray(body.itens) ? body.itens : [];

    const existente = await prisma.fichaTecnica.findUnique({ where: { id } });
    if (!existente || existente.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
    }

    let itens;
    try {
      itens = await resolverItensFicha(user.organizationId, rawItens);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Itens inválidos." },
        { status: 400 }
      );
    }

    if (!String(body.nome || "").trim()) {
      return NextResponse.json(
        { error: "Informe o nome da receita." },
        { status: 400 }
      );
    }

    if (itens.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um ingrediente com quantidade." },
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
          create: itens.map((item) => ({
            insumoId: item.insumoId,
            quantidade: item.quantidade,
            perdaPercentual: item.perdaPercentual,
          })),
        },
      },
      include: { itens: { include: { insumo: true } }, precificacao: true },
    });

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

    const resultado = calcularPrecificacao(
      itens.map((i) => ({
        quantidade: i.quantidade,
        perdaPercentual: i.perdaPercentual,
        custoUnitario: i.custoUnitario,
      })),
      ficha.rendimento,
      paramsPrec
    );
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
    console.error("DeliveryHub PUT ficha:", e);
    return NextResponse.json(
      { error: "Não foi possível atualizar a ficha." },
      { status: 500 }
    );
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
