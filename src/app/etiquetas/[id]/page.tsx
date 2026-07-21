import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { DeleteEtiquetaButton } from "@/components/DeleteEtiquetaButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const et = await prisma.etiquetaValidade.findUnique({ where: { id } });
  return { title: et ? `Etiqueta · ${et.nomeProduto}` : "Etiqueta" };
}

export default async function EtiquetaDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const { id } = await params;
  const etiqueta = await prisma.etiquetaValidade.findUnique({
    where: { id },
    include: { ficha: true },
  });

  if (!etiqueta || etiqueta.organizationId !== session.user.organizationId) {
    notFound();
  }

  const copies = Array.from({ length: Math.min(etiqueta.quantidade, 12) });

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Etiqueta de validade"
          description={etiqueta.nomeProduto}
          backHref="/etiquetas"
        />
        <div className="mb-8 flex flex-wrap gap-3">
          <PrintButton />
          {etiqueta.fichaId && (
            <Link
              href={`/fichas/${etiqueta.fichaId}`}
              className="btn btn-secondary"
            >
              Ver ficha técnica
            </Link>
          )}
          <DeleteEtiquetaButton id={etiqueta.id} />
        </div>
      </div>

      <div className="etiqueta-print">
        <div className="grid gap-4 sm:grid-cols-2">
          {copies.map((_, i) => (
            <article
              key={i}
              className="dh-scale break-inside-avoid rounded-xl border-2 border-dh-ink bg-white p-5"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <header className="mb-3 flex items-start justify-between gap-2 border-b-2 border-dh-ink pb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-dh-muted">
                    DeliveryHub
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight text-dh-ink">
                    {etiqueta.nomeProduto}
                  </h2>
                </div>
                <span className="rounded border border-dh-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                  Validade
                </span>
              </header>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-dh-muted">Lote</dt>
                  <dd className="font-bold">{etiqueta.lote}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-dh-muted">Produção</dt>
                  <dd className="font-medium">
                    {formatDateTime(etiqueta.dataProducao)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 rounded-md bg-dh-accent-soft px-2 py-1.5">
                  <dt className="font-semibold text-dh-accent-deep">Validade</dt>
                  <dd className="font-bold text-dh-accent-deep">
                    {formatDateTime(etiqueta.dataValidade)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-dh-muted">Responsável</dt>
                  <dd className="font-medium">{etiqueta.responsavel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-dh-muted">Armazenamento</dt>
                  <dd className="text-right font-medium">
                    {etiqueta.armazenamento}
                  </dd>
                </div>
                {etiqueta.observacoes && (
                  <div className="border-t border-dh-line pt-2">
                    <dt className="font-semibold text-dh-muted">Obs.</dt>
                    <dd className="mt-0.5 text-dh-ink-soft">
                      {etiqueta.observacoes}
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
        {etiqueta.quantidade > 12 && (
          <p className="no-print mt-4 text-center text-sm text-dh-muted">
            Exibindo 12 de {etiqueta.quantidade} etiquetas. Use imprimir várias
            vezes se necessário.
          </p>
        )}
      </div>
    </div>
  );
}
