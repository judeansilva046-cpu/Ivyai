"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchField, useSearchFilter } from "@/components/SearchField";
import { formatCurrency } from "@/lib/format";

export type FichaListItem = {
  id: string;
  nome: string;
  categoria: string;
  rendimento: number;
  unidadeRendimento: string;
  itensCount: number;
  custo: number;
  custoPorPorcao: number;
  preco: number | null;
};

export function FichasList({ items }: { items: FichaListItem[] }) {
  const [query, setQuery] = useState("");
  const getText = useMemo(
    () => (f: FichaListItem) => `${f.nome} ${f.categoria}`,
    []
  );
  const filtradas = useSearchFilter(items, query, getText);

  return (
    <div className="dh-animate-in-delay-1 space-y-4">
      <SearchField
        placeholder="Buscar ficha por nome ou categoria..."
        value={query}
        onChange={setQuery}
      />

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-12 text-center text-sm text-dh-muted">
          Nenhuma ficha encontrada para “{query}”.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-dh-line bg-dh-elevated">
          <div className="hidden grid-cols-12 gap-2 border-b border-dh-line bg-dh-surface/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dh-muted sm:grid">
            <div className="col-span-4">Produto</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">Rendimento</div>
            <div className="col-span-2">Custo</div>
            <div className="col-span-2">Preço</div>
          </div>
          <ul>
            {filtradas.map((ficha) => (
              <li key={ficha.id} className="border-b border-dh-line last:border-0">
                <Link
                  href={`/fichas/${ficha.id}`}
                  className="grid grid-cols-1 gap-1 px-4 py-4 transition-colors hover:bg-dh-sage-soft/40 sm:grid-cols-12 sm:items-center sm:gap-2"
                >
                  <div className="sm:col-span-4">
                    <p className="font-medium text-dh-ink">{ficha.nome}</p>
                    <p className="text-xs text-dh-muted sm:hidden">
                      {ficha.categoria} · {ficha.itensCount} insumos
                    </p>
                  </div>
                  <div className="hidden text-sm text-dh-ink-soft sm:col-span-2 sm:block">
                    {ficha.categoria}
                  </div>
                  <div className="text-sm text-dh-ink-soft sm:col-span-2">
                    {ficha.rendimento} {ficha.unidadeRendimento}
                  </div>
                  <div className="text-sm sm:col-span-2">
                    <span className="font-medium">
                      {formatCurrency(ficha.custo)}
                    </span>
                    <span className="block text-xs text-dh-muted">
                      {formatCurrency(ficha.custoPorPorcao)} / un.
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-dh-accent-deep sm:col-span-2">
                    {ficha.preco != null ? formatCurrency(ficha.preco) : "—"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
