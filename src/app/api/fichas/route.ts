import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcularPrecificacao } from "@/lib/calculations";
import { AuthError, requireSession, unauthorized } from "@/lib/session";
import { resolverItensFicha } from "@/lib/ficha-itens";

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
      orderBy: { updatedAt: "desc" },
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
    const rawItens = Array.isArray(body.itens) ? body.itens : [];

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
          create: itens.map((item) => ({
            insumoId: item.insumoId,
            quantidade: item.quantidade,
            perdaPercentual: item.perdaPercentual,
          })),
        },
      },
      include: { itens: { include: { insumo: true } } },
    });

    const params = {
      custoEmbalagem: Number(body.custoEmbalagem) || 0,
      custoMaoDeObra: Number(body.custoMaoDeObra) || 0,
      custoOperacional: Number(body.custoOperacional) || 0,
      margemPercentual: Number(body.margemPercentual) || 30,
      impostosPercentual: Number(body.impostosPercentual) || 0,
      taxaDelivery: Number(body.taxaDelivery) || 0,
    };

    const resultado = calcularPrecificacao(
      itens.map((i) => ({
        quantidade: i.quantidade,
        perdaPercentual: i.perdaPercentual,
        custoUnitario: i.custoUnitario,
      })),
      ficha.rendimento,
      params
    );

    const preco = Math.round(resultado.precoSugerido * 100) / 100;

    await prisma.precificacao.create({
      data: {
        fichaId: ficha.id,
        ...params,
        precoSugerido: preco,
        precoPraticado: preco,
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
    console.error("DeliveryHub POST ficha:", e);
    return NextResponse.json(
      { error: "Não foi possível salvar a ficha." },
      { status: 500 }
    );
  }
}
