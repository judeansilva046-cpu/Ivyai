import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency } from "@/lib/format";
import { custoInsumos, custoPorPorcao } from "@/lib/calculations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha Técnica" };

export default async function FichasPage() {
  const fichas = await prisma.fichaTecnica.findMany({
    where: { ativo: true },
    include: {
      itens: { include: { insumo: true } },
      precificacao: true,
      _count: { select: { etiquetas: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Ficha Técnica"
        description="Cadastre e consulte preparos com insumos, rendimento e validade."
        action={{ href: "/fichas/nova", label: "Nova ficha" }}
      />

      {fichas.length === 0 ? (
        <div className="dh-animate-in-delay-1 rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-16 text-center">
          <p className="font-display text-xl text-dh-ink">Nenhuma ficha ainda</p>
          <p className="mt-2 text-dh-muted">
            Crie a primeira ficha técnica para começar a precificar e etiquetar.
          </p>
          <Link href="/fichas/nova" className="btn btn-primary mt-6">
            Criar ficha
          </Link>
        </div>
      ) : (
        <div className="dh-animate-in-delay-1 overflow-hidden rounded-2xl border border-dh-line bg-dh-elevated">
          <div className="hidden grid-cols-12 gap-2 border-b border-dh-line bg-dh-surface/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dh-muted sm:grid">
            <div className="col-span-4">Produto</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">Rendimento</div>
            <div className="col-span-2">Custo</div>
            <div className="col-span-2">Preço</div>
          </div>
          <ul>
            {fichas.map((ficha) => {
              const itens = ficha.itens.map((i) => ({
                quantidade: i.quantidade,
                perdaPercentual: i.perdaPercentual,
                custoUnitario: i.insumo.custoUnitario,
              }));
              const custo = custoInsumos(itens);
              const porPorcao = custoPorPorcao(custo, ficha.rendimento);
              return (
                <li key={ficha.id} className="border-b border-dh-line last:border-0">
                  <Link
                    href={`/fichas/${ficha.id}`}
                    className="grid grid-cols-1 gap-1 px-4 py-4 transition-colors hover:bg-dh-sage-soft/40 sm:grid-cols-12 sm:items-center sm:gap-2"
                  >
                    <div className="sm:col-span-4">
                      <p className="font-medium text-dh-ink">{ficha.nome}</p>
                      <p className="text-xs text-dh-muted sm:hidden">
                        {ficha.categoria} · {ficha.itens.length} insumos
                      </p>
                    </div>
                    <div className="hidden text-sm text-dh-ink-soft sm:col-span-2 sm:block">
                      {ficha.categoria}
                    </div>
                    <div className="text-sm text-dh-ink-soft sm:col-span-2">
                      {ficha.rendimento} {ficha.unidadeRendimento}
                    </div>
                    <div className="text-sm sm:col-span-2">
                      <span className="font-medium">{formatCurrency(custo)}</span>
                      <span className="block text-xs text-dh-muted">
                        {formatCurrency(porPorcao)} / un.
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-dh-accent-deep sm:col-span-2">
                      {ficha.precificacao
                        ? formatCurrency(ficha.precificacao.precoPraticado)
                        : "—"}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
