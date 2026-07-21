import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteFichaButton } from "@/components/DeleteFichaButton";
import { PrintButton } from "@/components/PrintButton";
import {
  calcularPrecificacao,
  custoInsumos,
  custoItem,
} from "@/lib/calculations";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FichaDetalhePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const { id } = await params;
  const ficha = await prisma.fichaTecnica.findFirst({
    where: { id, organizationId: session.user.organizationId, ativo: true },
    include: {
      itens: { include: { insumo: true } },
      precificacao: true,
    },
  });

  if (!ficha) notFound();

  const itensCusto = ficha.itens.map((item) => ({
    quantidade: item.quantidade,
    perdaPercentual: item.perdaPercentual,
    custoUnitario: item.insumo.custoUnitario,
  }));

  const custoIngredientes = custoInsumos(itensCusto);
  const prec = ficha.precificacao;
  const pricing = prec
    ? calcularPrecificacao(itensCusto, ficha.rendimento, {
        custoEmbalagem: prec.custoEmbalagem,
        custoMaoDeObra: prec.custoMaoDeObra,
        custoOperacional: prec.custoOperacional,
        margemPercentual: prec.margemPercentual,
        impostosPercentual: prec.impostosPercentual,
        taxaDelivery: prec.taxaDelivery,
      })
    : null;

  const custoTotal = pricing?.custoTotal ?? custoIngredientes;
  const custoUnitario =
    pricing?.custoPorPorcao ??
    (ficha.rendimento > 0 ? custoTotal / ficha.rendimento : 0);
  const precoUnitario = pricing?.precoSugerido ?? prec?.precoSugerido ?? 0;
  const precoTotal = precoUnitario * (ficha.rendimento || 1);

  // ChefPro: CMV ≈ custo da receita; Lucro = venda − custo
  const custosDir = (prec?.custoEmbalagem ?? 0) + (prec?.custoMaoDeObra ?? 0);
  const lucroTotal = precoTotal - custoTotal;
  const lucroTotalPct = precoTotal > 0 ? (lucroTotal / precoTotal) * 100 : 0;
  const cmvTotalPct = precoTotal > 0 ? (custoTotal / precoTotal) * 100 : 0;
  const dirTotal = custosDir;
  const indirTotal = prec?.custoOperacional ?? 0;
  const dirTotalPct = precoTotal > 0 ? (dirTotal / precoTotal) * 100 : 0;
  const indirTotalPct = precoTotal > 0 ? (indirTotal / precoTotal) * 100 : 0;

  const lucroUnit = precoUnitario - custoUnitario;
  const lucroUnitPct = precoUnitario > 0 ? (lucroUnit / precoUnitario) * 100 : 0;
  const cmvUnitPct = precoUnitario > 0 ? (custoUnitario / precoUnitario) * 100 : 0;
  const dirUnit = ficha.rendimento > 0 ? custosDir / ficha.rendimento : 0;
  const indirUnit =
    ficha.rendimento > 0
      ? (prec?.custoOperacional ?? 0) / ficha.rendimento + (prec?.taxaDelivery ?? 0)
      : 0;
  const dirUnitPct = precoUnitario > 0 ? (dirUnit / precoUnitario) * 100 : 0;
  const indirUnitPct =
    precoUnitario > 0 ? (indirUnit / precoUnitario) * 100 : 0;

  const passos = ficha.modoPreparo
    .split(/\n+/)
    .map((linha) => linha.replace(/^\d+[\).\-\s]+/, "").trim())
    .filter(Boolean);

  const utensilios = ficha.utensilios
    ? ficha.utensilios
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const pesoLabel =
    ficha.pesoTotal > 0
      ? ficha.pesoTotal >= 1000
        ? `${formatNumber(ficha.pesoTotal / 1000, 2)} kg`
        : `${formatNumber(ficha.pesoTotal, 0)} g`
      : "—";

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/fichas"
          className="text-sm font-semibold text-dh-accent hover:underline"
        >
          ← Voltar para fichas
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link
            href={`/fichas/${ficha.id}/editar`}
            className="btn btn-secondary"
          >
            Editar
          </Link>
          <div className="[&_button]:w-auto">
            <DeleteFichaButton id={ficha.id} />
          </div>
        </div>
      </div>

      <article className="ficha-print mx-auto max-w-3xl overflow-hidden rounded-2xl border border-dh-line bg-dh-elevated shadow-sm">
        <header className="border-b border-dh-line px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-dh-sage">
                DeliveryHub · Ficha Técnica
              </p>
              <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-dh-ink sm:text-4xl">
                {ficha.nome}
              </h1>
              {ficha.categoria ? (
                <p className="mt-1 text-sm font-semibold text-dh-muted">
                  {ficha.categoria}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-dh-muted">
              Atualizada em {formatDate(ficha.updatedAt)}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-dh-line py-4 text-center sm:gap-6">
            <Meta
              label="Rendimento"
              value={`${formatNumber(ficha.rendimento, ficha.rendimento % 1 ? 1 : 0)} ${ficha.unidadeRendimento}`}
            />
            <Meta label="Peso Total" value={pesoLabel} />
            <Meta label="Tempo" value={ficha.tempoPreparo || "—"} />
          </div>
        </header>

        <div className="space-y-8 px-6 py-6 sm:px-8">
          {(ficha.descricao || utensilios.length > 0) && (
            <section className="space-y-3">
              {ficha.descricao ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dh-muted">
                    Descrição
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-dh-ink-soft">
                    {ficha.descricao}
                  </p>
                </div>
              ) : null}
              {utensilios.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-dh-muted">
                    Utensílios
                  </p>
                  <p className="mt-1 text-sm text-dh-ink-soft">
                    {utensilios.join(" · ")}
                  </p>
                </div>
              ) : null}
            </section>
          )}

          <section>
            <h2 className="font-display border-b border-dh-line pb-2 text-xl font-bold text-dh-ink">
              Ingredientes
            </h2>
            <ul className="mt-3 divide-y divide-dh-line/70">
              {ficha.itens.map((item) => {
                const custoLinha = custoItem({
                  quantidade: item.quantidade,
                  perdaPercentual: item.perdaPercentual,
                  custoUnitario: item.insumo.custoUnitario,
                });
                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-dh-ink">
                      {item.insumo.nome}
                    </span>
                    <span className="whitespace-nowrap text-right font-semibold text-dh-ink-soft">
                      {formatNumber(
                        item.quantidade,
                        item.quantidade % 1 ? 2 : 0,
                      )}{" "}
                      {item.insumo.unidade}
                    </span>
                    <span className="w-24 whitespace-nowrap text-right font-bold text-dh-ink">
                      {formatCurrency(custoLinha)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {passos.length > 0 ? (
            <section>
              <h2 className="font-display border-b border-dh-line pb-2 text-xl font-bold text-dh-ink">
                Modo de Preparo
              </h2>
              <ol className="mt-4 space-y-3">
                {passos.map((passo, index) => (
                  <li
                    key={`${index}-${passo.slice(0, 24)}`}
                    className="flex gap-3 text-sm leading-relaxed"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dh-ink text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-dh-ink-soft">{passo}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {(ficha.validadeHoras || ficha.observacoes) && (
            <section className="rounded-xl bg-dh-sage-soft/60 px-4 py-3 text-sm text-dh-ink">
              {ficha.validadeHoras ? (
                <p>
                  <span className="font-bold">Validade:</span>{" "}
                  {ficha.validadeHoras} horas
                </p>
              ) : null}
              {ficha.observacoes ? (
                <p className={ficha.validadeHoras ? "mt-1" : undefined}>
                  <span className="font-bold">Observações:</span>{" "}
                  {ficha.observacoes}
                </p>
              ) : null}
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-dh-sage/30 bg-gradient-to-br from-dh-sage-soft/50 to-white">
            <div className="border-b border-dh-sage/20 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-dh-sage">
                Custos diretos
              </p>
            </div>

            <div className="grid gap-0 sm:grid-cols-2">
              <PainelCusto
                titulo={`Custo total (${formatNumber(ficha.rendimento, ficha.rendimento % 1 ? 1 : 0)} ${ficha.unidadeRendimento})`}
                custo={custoTotal}
                preco={precoTotal}
                lucro={lucroTotal}
                lucroPct={lucroTotalPct}
                cmv={custoTotal}
                cmvPct={cmvTotalPct}
                custosDir={dirTotal}
                custosDirPct={dirTotalPct}
                custosIndir={indirTotal}
                custosIndirPct={indirTotalPct}
              />
              <PainelCusto
                titulo="Custo unitário"
                custo={custoUnitario}
                preco={precoUnitario}
                lucro={lucroUnit}
                lucroPct={lucroUnitPct}
                cmv={custoUnitario}
                cmvPct={cmvUnitPct}
                custosDir={dirUnit}
                custosDirPct={dirUnitPct}
                custosIndir={indirUnit}
                custosIndirPct={indirUnitPct}
                className="border-t border-dh-sage/20 sm:border-l sm:border-t-0"
              />
            </div>

            <div className="no-print border-t border-dh-sage/20 px-5 py-3">
              <Link
                href={`/precificacao`}
                className="text-sm font-semibold text-dh-accent hover:underline"
              >
                Ajustar precificação →
              </Link>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-dh-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-dh-ink sm:text-lg">{value}</p>
    </div>
  );
}

function PainelCusto({
  titulo,
  custo,
  preco,
  lucro,
  lucroPct,
  cmv,
  cmvPct,
  custosDir,
  custosDirPct,
  custosIndir,
  custosIndirPct,
  className = "",
}: {
  titulo: string;
  custo: number;
  preco: number;
  lucro: number;
  lucroPct: number;
  cmv: number;
  cmvPct: number;
  custosDir: number;
  custosDirPct: number;
  custosIndir: number;
  custosIndirPct: number;
  className?: string;
}) {
  return (
    <div className={`px-5 py-5 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-dh-muted">
            {titulo}
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-dh-ink">
            {formatCurrency(custo)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-dh-muted">
            Preço de venda
          </p>
          <p className="font-display mt-1 text-xl font-bold text-dh-accent-deep">
            {formatCurrency(preco)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metrico
          label="Lucro"
          valor={formatCurrency(lucro)}
          pct={`${formatNumber(lucroPct, 0)}%`}
        />
        <Metrico
          label="CMV"
          valor={formatCurrency(cmv)}
          pct={`${formatNumber(cmvPct, 0)}%`}
        />
        <Metrico
          label="Custos Dir."
          valor={formatCurrency(custosDir)}
          pct={`${formatNumber(custosDirPct, 0)}%`}
        />
        <Metrico
          label="Custos Indir."
          valor={formatCurrency(custosIndir)}
          pct={`${formatNumber(custosIndirPct, 0)}%`}
        />
      </div>
    </div>
  );
}

function Metrico({
  label,
  valor,
  pct,
}: {
  label: string;
  valor: string;
  pct: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-dh-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-dh-ink">{valor}</p>
      <p className="text-xs font-semibold text-dh-sage">{pct}</p>
    </div>
  );
}
