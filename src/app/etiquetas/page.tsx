import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Etiqueta de Validade" };

export default async function EtiquetasPage() {
  const etiquetas = await prisma.etiquetaValidade.findMany({
    include: { ficha: true },
    orderBy: { createdAt: "desc" },
  });

  const agora = new Date();

  return (
    <div>
      <PageHeader
        title="Etiqueta de Validade"
        description="Gere e imprima etiquetas com lote, produção, validade e responsável."
        action={{ href: "/etiquetas/nova", label: "Nova etiqueta" }}
      />

      {etiquetas.length === 0 ? (
        <div className="dh-animate-in-delay-1 rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-16 text-center">
          <p className="font-display text-xl">Nenhuma etiqueta ainda</p>
          <p className="mt-2 text-dh-muted">
            Gere a primeira etiqueta a partir de uma ficha ou manualmente.
          </p>
          <Link href="/etiquetas/nova" className="btn btn-primary mt-6">
            Gerar etiqueta
          </Link>
        </div>
      ) : (
        <div className="dh-animate-in-delay-1 grid gap-3 sm:grid-cols-2">
          {etiquetas.map((et) => {
            const vencida = et.dataValidade < agora;
            return (
              <Link
                key={et.id}
                href={`/etiquetas/${et.id}`}
                className="rounded-2xl border border-dh-line bg-dh-elevated p-5 transition-all hover:-translate-y-0.5 hover:border-dh-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-dh-ink">
                      {et.nomeProduto}
                    </p>
                    <p className="mt-1 text-sm text-dh-muted">Lote {et.lote}</p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${
                      vencida
                        ? "bg-red-50 text-red-700"
                        : "bg-dh-sage-soft text-dh-sage"
                    }`}
                  >
                    {vencida ? "Vencida" : "Válida"}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-dh-muted">Produção</dt>
                    <dd className="font-medium">
                      {formatDateTime(et.dataProducao)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-dh-muted">Validade</dt>
                    <dd className="font-medium">
                      {formatDateTime(et.dataValidade)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-dh-muted">Responsável</dt>
                    <dd className="font-medium">{et.responsavel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-dh-muted">Qtd.</dt>
                    <dd className="font-medium">{et.quantidade}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
