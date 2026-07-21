import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { EtiquetasList } from "@/components/EtiquetasList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Etiqueta de Validade" };

export default async function EtiquetasPage() {
  const etiquetas = await prisma.etiquetaValidade.findMany({
    include: { ficha: true },
    orderBy: { createdAt: "desc" },
  });

  const agora = new Date();
  const items = etiquetas.map((et) => ({
    id: et.id,
    nomeProduto: et.nomeProduto,
    lote: et.lote,
    dataProducao: et.dataProducao.toISOString(),
    dataValidade: et.dataValidade.toISOString(),
    responsavel: et.responsavel,
    quantidade: et.quantidade,
    vencida: et.dataValidade < agora,
  }));

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
        <EtiquetasList items={items} />
      )}
    </div>
  );
}
