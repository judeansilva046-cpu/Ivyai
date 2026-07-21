import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { StatBlock } from "@/components/StatBlock";
import { formatCurrency, formatNumber, percent } from "@/lib/format";
import {
  calcularPrecificacao,
  custoItem,
  custoInsumos,
} from "@/lib/calculations";
import { DeleteFichaButton } from "@/components/DeleteFichaButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ficha = await prisma.fichaTecnica.findUnique({ where: { id } });
  return { title: ficha?.nome ?? "Ficha técnica" };
}

export default async function FichaDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const { id } = await params;
  const ficha = await prisma.fichaTecnica.findUnique({
    where: { id },
    include: {
      itens: { include: { insumo: true }, orderBy: { insumo: { nome: "asc" } } },
      precificacao: true,
      etiquetas: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!ficha || !ficha.ativo || ficha.organizationId !== session.user.organizationId) {
    notFound();
  }

  const itensCusto = ficha.itens.map((i) => ({
    quantidade: i.quantidade,
    perdaPercentual: i.perdaPercentual,
    custoUnitario: i.insumo.custoUnitario,
  }));

  const p = ficha.precificacao;
  const calculo = calcularPrecificacao(itensCusto, ficha.rendimento, {
    custoEmbalagem: p?.custoEmbalagem ?? 0,
    custoMaoDeObra: p?.custoMaoDeObra ?? 0,
    custoOperacional: p?.custoOperacional ?? 0,
    margemPercentual: p?.margemPercentual ?? 30,
    impostosPercentual: p?.impostosPercentual ?? 0,
    taxaDelivery: p?.taxaDelivery ?? 0,
  });

  return (
    <div>
      <PageHeader
        title={ficha.nome}
        description={`${ficha.categoria} · validade ${ficha.validadeHoras}h · ${ficha.rendimento} ${ficha.unidadeRendimento}`}
        backHref="/fichas"
        action={{ href: `/fichas/${ficha.id}/editar`, label: "Editar" }}
      />

      <div className="dh-animate-in-delay-1 mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="Custo insumos"
          value={formatCurrency(calculo.custoInsumos)}
        />
        <StatBlock
          label="Custo / porção"
          value={formatCurrency(calculo.custoPorPorcao)}
        />
        <StatBlock
          label="Preço sugerido"
          value={formatCurrency(calculo.precoSugerido)}
          accent
        />
        <StatBlock
          label="Preço praticado"
          value={formatCurrency(p?.precoPraticado ?? 0)}
        />
      </div>

      <div className="dh-animate-in-delay-2 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="font-display mb-3 text-xl font-semibold">Insumos</h2>
          <div className="overflow-hidden rounded-2xl border border-dh-line bg-dh-elevated">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dh-line bg-dh-surface/80 text-xs uppercase tracking-wide text-dh-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Insumo</th>
                  <th className="px-4 py-3 font-semibold">Qtd.</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    Perda
                  </th>
                  <th className="px-4 py-3 font-semibold">Custo</th>
                </tr>
              </thead>
              <tbody>
                {ficha.itens.map((item) => (
                  <tr key={item.id} className="border-b border-dh-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.insumo.nome}</p>
                      <p className="text-xs text-dh-muted">
                        {formatCurrency(item.insumo.custoUnitario)} /{" "}
                        {item.insumo.unidade}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(item.quantidade, 3)} {item.insumo.unidade}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {percent(item.perdaPercentual)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(
                        custoItem({
                          quantidade: item.quantidade,
                          perdaPercentual: item.perdaPercentual,
                          custoUnitario: item.insumo.custoUnitario,
                        })
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-dh-sage-soft/40">
                  <td colSpan={3} className="px-4 py-3 font-semibold">
                    Total insumos
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(custoInsumos(itensCusto))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {ficha.modoPreparo && (
            <div className="mt-6">
              <h2 className="font-display mb-2 text-xl font-semibold">
                Modo de preparo
              </h2>
              <p className="whitespace-pre-wrap rounded-2xl border border-dh-line bg-dh-elevated px-5 py-4 text-sm leading-relaxed text-dh-ink-soft">
                {ficha.modoPreparo}
              </p>
            </div>
          )}

          {ficha.observacoes && (
            <div className="mt-4">
              <h2 className="font-display mb-2 text-lg font-semibold">
                Observações
              </h2>
              <p className="text-sm text-dh-muted">{ficha.observacoes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-dh-line bg-dh-elevated p-5">
            <h2 className="font-display mb-3 text-lg font-semibold">
              Precificação
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Custo adicional</dt>
                <dd className="font-medium">
                  {formatCurrency(calculo.custoAdicional)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Margem</dt>
                <dd className="font-medium">
                  {percent(p?.margemPercentual ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Impostos</dt>
                <dd className="font-medium">
                  {percent(p?.impostosPercentual ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Taxa delivery</dt>
                <dd className="font-medium">
                  {formatCurrency(p?.taxaDelivery ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-dh-line pt-2">
                <dt className="text-dh-muted">Lucro estimado / un.</dt>
                <dd className="font-semibold text-dh-sage">
                  {formatCurrency(calculo.lucroEstimado)}
                </dd>
              </div>
            </dl>
            <Link
              href="/precificacao"
              className="btn btn-secondary mt-4 w-full"
            >
              Ajustar precificação
            </Link>
          </div>

          <div className="rounded-2xl border border-dh-line bg-dh-elevated p-5">
            <h2 className="font-display mb-3 text-lg font-semibold">
              Etiquetas
            </h2>
            {ficha.etiquetas.length === 0 ? (
              <p className="text-sm text-dh-muted">
                Nenhuma etiqueta vinculada a esta ficha.
              </p>
            ) : (
              <ul className="space-y-2">
                {ficha.etiquetas.map((et) => (
                  <li key={et.id}>
                    <Link
                      href={`/etiquetas/${et.id}`}
                      className="block rounded-lg px-2 py-1.5 text-sm hover:bg-dh-surface"
                    >
                      <span className="font-medium">{et.lote}</span>
                      <span className="ml-2 text-dh-muted">
                        {et.quantidade} un.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/etiquetas/nova?fichaId=${ficha.id}`}
              className="btn btn-primary mt-4 w-full"
            >
              Gerar etiqueta
            </Link>
          </div>

          <DeleteFichaButton id={ficha.id} />
        </aside>
      </div>
    </div>
  );
}
