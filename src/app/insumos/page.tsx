import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import InsumosClient from "./InsumosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insumos",
};

export default async function InsumosPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const insumos = await prisma.insumo.findMany({
    where: { ativo: true, organizationId: session.user.organizationId },
    include: { _count: { select: { itensFicha: true } } },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  return <InsumosClient initialInsumos={insumos} />;
}
