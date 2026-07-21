import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { FichaForm } from "@/components/FichaForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Editar ficha técnica" };

export default async function EditarFichaPage({ params }: Props) {
  const { id } = await params;
  const ficha = await prisma.fichaTecnica.findUnique({
    where: { id },
    include: {
      itens: true,
      precificacao: true,
    },
  });

  if (!ficha || !ficha.ativo) notFound();

  return (
    <div>
      <PageHeader
        title="Editar ficha técnica"
        description={ficha.nome}
        backHref={`/fichas/${ficha.id}`}
      />
      <FichaForm
        fichaId={ficha.id}
        initial={{
          nome: ficha.nome,
          categoria: ficha.categoria,
          rendimento: ficha.rendimento,
          unidadeRendimento: ficha.unidadeRendimento,
          modoPreparo: ficha.modoPreparo,
          validadeHoras: ficha.validadeHoras,
          observacoes: ficha.observacoes,
          itens: ficha.itens.map((i) => ({
            insumoId: i.insumoId,
            quantidade: i.quantidade,
            perdaPercentual: i.perdaPercentual,
          })),
          precificacao: ficha.precificacao,
        }}
      />
    </div>
  );
}
