import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { FichasList } from "@/components/FichasList";
import { custoInsumos, custoPorPorcao } from "@/lib/calculations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha Técnica" };

export default async function FichasPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const fichas = await prisma.fichaTecnica.findMany({
    where: { ativo: true, organizationId: orgId },
    include: {
      itens: { include: { insumo: true } },
      precificacao: true,
    },
    orderBy: { nome: "asc" },
  });

  const items = fichas.map((ficha) => {
    const itens = ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));
    const custo = custoInsumos(itens);
    return {
      id: ficha.id,
      nome: ficha.nome,
      categoria: ficha.categoria,
      rendimento: ficha.rendimento,
      unidadeRendimento: ficha.unidadeRendimento,
      itensCount: ficha.itens.length,
      custo,
      custoPorPorcao: custoPorPorcao(custo, ficha.rendimento),
      preco: ficha.precificacao?.precoPraticado ?? null,
    };
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
            Cadastre insumos e depois crie a primeira ficha técnica.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/insumos" className="btn btn-secondary">
              Gerenciar insumos
            </Link>
            <Link href="/fichas/nova" className="btn btn-primary">
              Criar ficha
            </Link>
          </div>
        </div>
      ) : (
        <FichasList items={items} />
      )}
    </div>
  );
}
