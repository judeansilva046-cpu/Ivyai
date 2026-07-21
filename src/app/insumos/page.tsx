import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import InsumosClient from "./InsumosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insumos",
};

export default async function InsumosPage() {
  const insumos = await prisma.insumo.findMany({
    where: { ativo: true },
    include: { _count: { select: { itensFicha: true } } },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  return <InsumosClient initialInsumos={insumos} />;
}
