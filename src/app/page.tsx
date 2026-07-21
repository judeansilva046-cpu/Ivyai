import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { custoInsumos } from "@/lib/calculations";
import { StatBlock } from "@/components/StatBlock";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [fichas, etiquetas, insumosCount, totalFichas, totalEtiquetas] =
    await Promise.all([
      prisma.fichaTecnica.findMany({
        where: { ativo: true, organizationId: orgId },
        include: {
          itens: { include: { insumo: true } },
          precificacao: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.etiquetaValidade.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.insumo.count({ where: { ativo: true, organizationId: orgId } }),
      prisma.fichaTecnica.count({ where: { ativo: true, organizationId: orgId } }),
      prisma.etiquetaValidade.count({ where: { organizationId: orgId } }),
    ]);

  const comPreco = fichas.filter((f) => f.precificacao);
  const ticketMedio =
    comPreco.length > 0
      ? comPreco.reduce(
          (acc, f) => acc + (f.precificacao?.precoPraticado || 0),
          0
        ) / comPreco.length
      : 0;

  const isEmpty = insumosCount === 0 && totalFichas === 0 && totalEtiquetas === 0;

  const modules = [
    {
      href: "/fichas",
      title: "Ficha Técnica",
      description: "Crie receitas, calcule custos e preço sugerido.",
      cta: "Abrir fichas",
      step: "1",
    },
    {
      href: "/insumos",
      title: "Insumos",
      description: "Atualize preços das matérias-primas.",
      cta: "Gerenciar insumos",
      step: "2",
    },
    {
      href: "/precificacao",
      title: "Precificação",
      description: "Ajuste margem, impostos e preço praticado.",
      cta: "Precificar",
      step: "3",
    },
    {
      href: "/etiquetas",
      title: "Etiqueta de Validade",
      description: "Gere etiquetas para impressão.",
      cta: "Gerar etiqueta",
      step: "4",
    },
  ];

  return (
    <div>
      <section className="dh-animate-in mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-dh-sage">
          {session.user.organizationName}
        </p>
        <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight text-dh-ink sm:text-5xl">
          Olá, {session.user.name.split(" ")[0]}
        </h1>
          <p className="mt-2 text-dh-muted">
            {isEmpty
              ? "Comece criando sua primeira ficha técnica — digite os ingredientes e o custo sai na hora."
              : "Insumos, fichas técnicas, precificação e etiquetas da sua operação."}
          </p>
        </section>

      {isEmpty && (
        <section className="dh-animate-in-delay-1 mb-10 rounded-2xl border border-dh-accent/25 bg-dh-accent-soft/60 px-5 py-6 sm:px-8">
          <h2 className="font-display text-xl font-semibold text-dh-ink">
            Crie sua ficha técnica agora
          </h2>
          <p className="mt-2 max-w-xl text-sm text-dh-ink-soft">
            Como no fluxo profissional de cozinha: monte a receita, informe
            custo dos ingredientes e veja o preço sugerido em tempo real.
          </p>
          <Link href="/fichas/nova" className="btn btn-primary mt-5">
            Nova ficha técnica
          </Link>
        </section>
      )}

      <section className="dh-animate-in-delay-1 mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Fichas técnicas" value={String(totalFichas)} />
        <StatBlock label="Insumos cadastrados" value={String(insumosCount)} />
        <StatBlock label="Etiquetas geradas" value={String(totalEtiquetas)} />
        <StatBlock
          label="Ticket médio"
          value={formatCurrency(ticketMedio || 0)}
          accent
        />
      </section>

      <section className="dh-animate-in-delay-2 mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group rounded-2xl border border-dh-line bg-dh-elevated p-6 transition-all hover:-translate-y-0.5 hover:border-dh-accent/40 hover:shadow-[0_12px_40px_-20px_rgba(28,36,32,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-dh-muted">
              Passo {mod.step}
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold text-dh-ink">
              {mod.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-dh-muted">
              {mod.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-semibold text-dh-accent transition-colors group-hover:text-dh-accent-deep">
              {mod.cta} →
            </span>
          </Link>
        ))}
      </section>

      {!isEmpty && (
        <section className="dh-animate-in-delay-3 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                Fichas recentes
              </h2>
              <Link href="/fichas" className="text-sm font-medium text-dh-accent">
                Ver todas
              </Link>
            </div>
            <div className="space-y-2">
              {fichas.length === 0 && (
                <p className="rounded-xl border border-dashed border-dh-line bg-white/60 px-4 py-8 text-center text-sm text-dh-muted">
                  Nenhuma ficha ainda.
                </p>
              )}
              {fichas.map((ficha) => {
                const itens = ficha.itens.map((i) => ({
                  quantidade: i.quantidade,
                  perdaPercentual: i.perdaPercentual,
                  custoUnitario: i.insumo.custoUnitario,
                }));
                const custo = custoInsumos(itens);
                const preco = ficha.precificacao?.precoPraticado;
                return (
                  <Link
                    key={ficha.id}
                    href={`/fichas/${ficha.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-dh-line bg-dh-elevated px-4 py-3 transition-colors hover:border-dh-sage/40"
                  >
                    <div>
                      <p className="font-medium text-dh-ink">{ficha.nome}</p>
                      <p className="text-xs text-dh-muted">
                        {ficha.categoria} · {ficha.rendimento}{" "}
                        {ficha.unidadeRendimento}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-dh-ink">
                        {preco != null ? formatCurrency(preco) : "—"}
                      </p>
                      <p className="text-xs text-dh-muted">
                        custo {formatCurrency(custo)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                Últimas etiquetas
              </h2>
              <Link
                href="/etiquetas"
                className="text-sm font-medium text-dh-accent"
              >
                Ver todas
              </Link>
            </div>
            <div className="space-y-2">
              {etiquetas.length === 0 && (
                <p className="rounded-xl border border-dashed border-dh-line bg-white/60 px-4 py-8 text-center text-sm text-dh-muted">
                  Nenhuma etiqueta gerada ainda.
                </p>
              )}
              {etiquetas.map((et) => (
                <Link
                  key={et.id}
                  href={`/etiquetas/${et.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dh-line bg-dh-elevated px-4 py-3 transition-colors hover:border-dh-sage/40"
                >
                  <div>
                    <p className="font-medium text-dh-ink">{et.nomeProduto}</p>
                    <p className="text-xs text-dh-muted">Lote {et.lote}</p>
                  </div>
                  <p className="text-xs font-medium text-dh-muted">
                    {et.quantidade} un.
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
