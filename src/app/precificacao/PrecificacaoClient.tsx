"use client";

import { useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, percent } from "@/lib/format";
import { calcularPrecificacao } from "@/lib/calculations";
import { PageHeader } from "@/components/PageHeader";
import { StatBlock } from "@/components/StatBlock";

export type PrecificacaoRow = {
  id: string;
  custoEmbalagem: number;
  custoMaoDeObra: number;
  custoOperacional: number;
  margemPercentual: number;
  impostosPercentual: number;
  taxaDelivery: number;
  precoSugerido: number;
  precoPraticado: number;
  ficha: {
    id: string;
    nome: string;
    categoria: string;
    rendimento: number;
    unidadeRendimento: string;
    itens: {
      quantidade: number;
      perdaPercentual: number;
      insumo: { custoUnitario: number };
    }[];
  };
  calculo: ReturnType<typeof calcularPrecificacao>;
};

function formFromRow(row: PrecificacaoRow) {
  return {
    custoEmbalagem: String(row.custoEmbalagem),
    custoMaoDeObra: String(row.custoMaoDeObra),
    custoOperacional: String(row.custoOperacional),
    margemPercentual: String(row.margemPercentual),
    impostosPercentual: String(row.impostosPercentual),
    taxaDelivery: String(row.taxaDelivery),
    precoPraticado: String(row.precoPraticado),
  };
}

export default function PrecificacaoClient({
  initialRows,
}: {
  initialRows: PrecificacaoRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRows[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(() =>
    initialRows[0] ? formFromRow(initialRows[0]) : {
      custoEmbalagem: "0",
      custoMaoDeObra: "0",
      custoOperacional: "0",
      margemPercentual: "30",
      impostosPercentual: "0",
      taxaDelivery: "0",
      precoPraticado: "0",
    }
  );

  function selectRow(row: PrecificacaoRow) {
    setSelectedId(row.id);
    setForm(formFromRow(row));
    setMessage("");
  }

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const preview = useMemo(() => {
    if (!selected) return null;
    const itens = selected.ficha.itens.map((i) => ({
      quantidade: i.quantidade,
      perdaPercentual: i.perdaPercentual,
      custoUnitario: i.insumo.custoUnitario,
    }));
    return calcularPrecificacao(itens, selected.ficha.rendimento, {
      custoEmbalagem: Number(form.custoEmbalagem) || 0,
      custoMaoDeObra: Number(form.custoMaoDeObra) || 0,
      custoOperacional: Number(form.custoOperacional) || 0,
      margemPercentual: Number(form.margemPercentual) || 0,
      impostosPercentual: Number(form.impostosPercentual) || 0,
      taxaDelivery: Number(form.taxaDelivery) || 0,
    });
  }, [selected, form]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/precificacao/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        custoEmbalagem: Number(form.custoEmbalagem),
        custoMaoDeObra: Number(form.custoMaoDeObra),
        custoOperacional: Number(form.custoOperacional),
        margemPercentual: Number(form.margemPercentual),
        impostosPercentual: Number(form.impostosPercentual),
        taxaDelivery: Number(form.taxaDelivery),
        precoPraticado: Number(form.precoPraticado),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Erro ao salvar precificação.");
      return;
    }
    const updated = await res.json();
    startTransition(() => {
      setRows((prev) =>
        prev.map((r) => (r.id === selectedId ? { ...r, ...updated } : r))
      );
      setMessage("Precificação atualizada.");
      router.refresh();
    });
  }

  function aplicarSugerido() {
    if (preview) {
      setForm((f) => ({
        ...f,
        precoPraticado: String(Math.round(preview.precoSugerido * 100) / 100),
      }));
    }
  }

  return (
    <div>
      <PageHeader
        title="Precificação"
        description="Calcule custo real, margem e preço de venda a partir das fichas técnicas."
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-16 text-center">
          <p className="font-display text-xl">Nenhuma precificação ainda</p>
          <p className="mt-2 text-dh-muted">
            Crie uma ficha técnica para gerar a precificação automaticamente.
          </p>
          <Link href="/fichas/nova" className="btn btn-primary mt-6">
            Nova ficha
          </Link>
        </div>
      ) : (
        <div className="dh-animate-in-delay-1 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-dh-muted">
              Produtos
            </h2>
            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectRow(row)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedId === row.id
                        ? "border-dh-accent bg-dh-accent-soft"
                        : "border-dh-line bg-dh-elevated hover:border-dh-sage/40"
                    }`}
                  >
                    <p className="font-medium text-dh-ink">{row.ficha.nome}</p>
                    <p className="mt-0.5 text-xs text-dh-muted">
                      {row.ficha.categoria} ·{" "}
                      {formatCurrency(row.precoPraticado)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected && preview && (
            <div className="dh-scale space-y-5 lg:col-span-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold">
                    {selected.ficha.nome}
                  </h2>
                  <Link
                    href={`/fichas/${selected.ficha.id}`}
                    className="text-sm font-medium text-dh-accent"
                  >
                    Ver ficha →
                  </Link>
                </div>
                <p className="text-sm text-dh-muted">
                  Rendimento: {selected.ficha.rendimento}{" "}
                  {selected.ficha.unidadeRendimento}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatBlock
                  label="Custo total"
                  value={formatCurrency(preview.custoTotal)}
                />
                <StatBlock
                  label="Custo / porção"
                  value={formatCurrency(preview.custoPorPorcao)}
                />
                <StatBlock
                  label="Preço sugerido"
                  value={formatCurrency(preview.precoSugerido)}
                  accent
                  hint={`Lucro ~ ${formatCurrency(preview.lucroEstimado)}`}
                />
                <StatBlock
                  label="Margem sobre preço"
                  value={percent(preview.margemSobrePreco)}
                />
              </div>

              <form
                onSubmit={onSave}
                className="rounded-2xl border border-dh-line bg-dh-elevated p-5"
              >
                <h3 className="font-display mb-4 text-lg font-semibold">
                  Parâmetros
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["custoEmbalagem", "Embalagem (R$)"],
                      ["custoMaoDeObra", "Mão de obra (R$)"],
                      ["custoOperacional", "Operacional (R$)"],
                      ["margemPercentual", "Margem %"],
                      ["impostosPercentual", "Impostos %"],
                      ["taxaDelivery", "Taxa delivery (R$)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div className="field" key={key}>
                      <label className="label">{label}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={form[key]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div className="field sm:col-span-2">
                    <label className="label">Preço praticado (R$)</label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input flex-1"
                        value={form.precoPraticado}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            precoPraticado: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={aplicarSugerido}
                      >
                        Usar sugerido
                      </button>
                    </div>
                  </div>
                </div>

                {message && (
                  <p className="mt-3 text-sm text-dh-sage">{message}</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary mt-5"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar precificação"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
