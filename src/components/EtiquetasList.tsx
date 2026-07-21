"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchField, useSearchFilter } from "@/components/SearchField";
import { formatDateTime } from "@/lib/format";

export type EtiquetaListItem = {
  id: string;
  nomeProduto: string;
  lote: string;
  dataProducao: string;
  dataValidade: string;
  responsavel: string;
  quantidade: number;
  vencida: boolean;
};

export function EtiquetasList({ items }: { items: EtiquetaListItem[] }) {
  const [query, setQuery] = useState("");
  const getText = useMemo(
    () => (e: EtiquetaListItem) =>
      `${e.nomeProduto} ${e.lote} ${e.responsavel}`,
    []
  );
  const filtradas = useSearchFilter(items, query, getText);

  return (
    <div className="dh-animate-in-delay-1 space-y-4">
      <SearchField
        placeholder="Buscar por produto, lote ou responsável..."
        value={query}
        onChange={setQuery}
      />

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-12 text-center text-sm text-dh-muted">
          Nenhuma etiqueta encontrada para “{query}”.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map((et) => (
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
                    et.vencida
                      ? "bg-red-50 text-red-700"
                      : "bg-dh-sage-soft text-dh-sage"
                  }`}
                >
                  {et.vencida ? "Vencida" : "Válida"}
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
          ))}
        </div>
      )}
    </div>
  );
}
