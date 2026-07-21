"use client";

import { useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SearchField, useSearchFilter } from "@/components/SearchField";
import { formatCurrency } from "@/lib/format";

export type InsumoRow = {
  id: string;
  nome: string;
  unidade: string;
  custoUnitario: number;
  categoria: string;
  _count?: { itensFicha: number };
};

const UNIDADES = ["g", "kg", "ml", "L", "un", "cx"];

const emptyForm = {
  nome: "",
  unidade: "kg",
  custoUnitario: "",
  categoria: "Geral",
};

export default function InsumosClient({
  initialInsumos,
}: {
  initialInsumos: InsumoRow[];
}) {
  const router = useRouter();
  const [insumos, setInsumos] = useState(initialInsumos);
  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const categorias = useMemo(() => {
    const set = new Set(insumos.map((i) => i.categoria));
    return ["Todas", ...Array.from(set).sort()];
  }, [insumos]);

  const getText = useMemo(
    () => (i: InsumoRow) => `${i.nome} ${i.categoria} ${i.unidade}`,
    []
  );

  const filtradosBusca = useSearchFilter(insumos, query, getText);
  const filtrados =
    categoriaFiltro === "Todas"
      ? filtradosBusca
      : filtradosBusca.filter((i) => i.categoria === categoriaFiltro);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function startEdit(insumo: InsumoRow) {
    setEditingId(insumo.id);
    setForm({
      nome: insumo.nome,
      unidade: insumo.unidade,
      custoUnitario: String(insumo.custoUnitario),
      categoria: insumo.categoria,
    });
    setError("");
    setMessage("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      nome: form.nome.trim(),
      unidade: form.unidade,
      custoUnitario: Number(form.custoUnitario),
      categoria: form.categoria.trim() || "Geral",
    };

    const res = await fetch(
      editingId ? `/api/insumos/${editingId}` : "/api/insumos",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível salvar o insumo.");
      return;
    }

    const saved = await res.json();
    startTransition(() => {
      if (editingId) {
        setInsumos((prev) =>
          prev
            .map((i) =>
              i.id === editingId
                ? { ...i, ...saved, _count: i._count }
                : i
            )
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
        setMessage(
          "Insumo atualizado. Precificações vinculadas foram recalculadas."
        );
      } else {
        setInsumos((prev) =>
          [...prev, { ...saved, _count: { itensFicha: 0 } }].sort((a, b) =>
            a.nome.localeCompare(b.nome)
          )
        );
        setMessage("Insumo cadastrado.");
      }
      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    });
  }

  async function onDelete(insumo: InsumoRow) {
    const usado = insumo._count?.itensFicha ?? 0;
    const ok = confirm(
      usado > 0
        ? `"${insumo.nome}" está em ${usado} ficha(s). Desativar mesmo assim?`
        : `Excluir o insumo "${insumo.nome}"?`
    );
    if (!ok) return;

    const res = await fetch(`/api/insumos/${insumo.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Não foi possível remover o insumo.");
      return;
    }

    startTransition(() => {
      setInsumos((prev) => prev.filter((i) => i.id !== insumo.id));
      if (editingId === insumo.id) startCreate();
      setMessage(usado > 0 ? "Insumo desativado." : "Insumo excluído.");
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader
        title="Insumos"
        description="Cadastre matérias-primas e atualize custos. Mudanças recalculam a precificação das fichas."
      />

      <div className="dh-animate-in-delay-1 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          className="flex-1"
          placeholder="Buscar por nome ou categoria..."
          value={query}
          onChange={setQuery}
        />
        <select
          className="select sm:w-48"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="dh-animate-in-delay-2 lg:col-span-3">
          {filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dh-line bg-white/70 px-6 py-12 text-center text-sm text-dh-muted">
              Nenhum insumo encontrado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-dh-line bg-dh-elevated">
              <div className="hidden grid-cols-12 gap-2 border-b border-dh-line bg-dh-surface/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dh-muted sm:grid">
                <div className="col-span-4">Nome</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-2">Unidade</div>
                <div className="col-span-2">Custo</div>
                <div className="col-span-2">Uso</div>
              </div>
              <ul>
                {filtrados.map((insumo) => (
                  <li
                    key={insumo.id}
                    className={`border-b border-dh-line last:border-0 ${
                      editingId === insumo.id ? "bg-dh-accent-soft/40" : ""
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-12 sm:items-center sm:gap-2">
                      <div className="sm:col-span-4">
                        <p className="font-medium text-dh-ink">{insumo.nome}</p>
                        <p className="text-xs text-dh-muted sm:hidden">
                          {insumo.categoria} · {insumo.unidade}
                        </p>
                      </div>
                      <div className="hidden text-sm text-dh-ink-soft sm:col-span-2 sm:block">
                        {insumo.categoria}
                      </div>
                      <div className="hidden text-sm sm:col-span-2 sm:block">
                        {insumo.unidade}
                      </div>
                      <div className="text-sm font-semibold text-dh-accent-deep sm:col-span-2">
                        {formatCurrency(insumo.custoUnitario)}
                      </div>
                      <div className="flex items-center gap-2 text-sm sm:col-span-2">
                        <span className="text-dh-muted">
                          {insumo._count?.itensFicha ?? 0} ficha(s)
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost ml-auto px-2 py-1 text-xs"
                          onClick={() => startEdit(insumo)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost px-2 py-1 text-xs text-dh-danger"
                          onClick={() => onDelete(insumo)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="dh-scale lg:col-span-2">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-dh-line bg-dh-elevated p-5"
          >
            <h2 className="font-display mb-4 text-lg font-semibold">
              {editingId ? "Editar insumo" : "Novo insumo"}
            </h2>

            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {message && (
              <p className="mb-3 text-sm text-dh-sage">{message}</p>
            )}

            <div className="space-y-3">
              <div className="field">
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nome: e.target.value }))
                  }
                  required
                  placeholder="Ex.: Farinha de trigo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label className="label">Unidade</label>
                  <select
                    className="select"
                    value={form.unidade}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unidade: e.target.value }))
                    }
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={form.custoUnitario}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        custoUnitario: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Categoria</label>
                <input
                  className="input"
                  value={form.categoria}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoria: e.target.value }))
                  }
                  placeholder="Secos, Frescos, Embalagens..."
                  list="categorias-insumo"
                />
                <datalist id="categorias-insumo">
                  {categorias
                    .filter((c) => c !== "Todas")
                    .map((c) => (
                      <option key={c} value={c} />
                    ))}
                </datalist>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Atualizar"
                    : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={startCreate}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
