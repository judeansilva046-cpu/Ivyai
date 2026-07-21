"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  custoUnitario: number;
  categoria: string;
};

type ItemForm = {
  insumoId: string;
  quantidade: string;
  perdaPercentual: string;
};

type Props = {
  fichaId?: string;
  initial?: {
    nome: string;
    categoria: string;
    rendimento: number;
    unidadeRendimento: string;
    modoPreparo: string;
    validadeHoras: number;
    observacoes: string;
    itens: { insumoId: string; quantidade: number; perdaPercentual: number }[];
    precificacao?: {
      custoEmbalagem: number;
      custoMaoDeObra: number;
      custoOperacional: number;
      margemPercentual: number;
      impostosPercentual: number;
      taxaDelivery: number;
    } | null;
  };
};

const emptyItem = (): ItemForm => ({
  insumoId: "",
  quantidade: "",
  perdaPercentual: "0",
});

export function FichaForm({ fichaId, initial }: Props) {
  const router = useRouter();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showInsumo, setShowInsumo] = useState(false);

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "Geral");
  const [rendimento, setRendimento] = useState(
    String(initial?.rendimento ?? "1")
  );
  const [unidadeRendimento, setUnidadeRendimento] = useState(
    initial?.unidadeRendimento ?? "porções"
  );
  const [modoPreparo, setModoPreparo] = useState(initial?.modoPreparo ?? "");
  const [validadeHoras, setValidadeHoras] = useState(
    String(initial?.validadeHoras ?? "24")
  );
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");
  const [itens, setItens] = useState<ItemForm[]>(
    initial?.itens?.length
      ? initial.itens.map((i) => ({
          insumoId: i.insumoId,
          quantidade: String(i.quantidade),
          perdaPercentual: String(i.perdaPercentual),
        }))
      : [emptyItem()]
  );

  const [custoEmbalagem, setCustoEmbalagem] = useState(
    String(initial?.precificacao?.custoEmbalagem ?? "0")
  );
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(
    String(initial?.precificacao?.custoMaoDeObra ?? "0")
  );
  const [custoOperacional, setCustoOperacional] = useState(
    String(initial?.precificacao?.custoOperacional ?? "0")
  );
  const [margemPercentual, setMargemPercentual] = useState(
    String(initial?.precificacao?.margemPercentual ?? "30")
  );
  const [impostosPercentual, setImpostosPercentual] = useState(
    String(initial?.precificacao?.impostosPercentual ?? "0")
  );
  const [taxaDelivery, setTaxaDelivery] = useState(
    String(initial?.precificacao?.taxaDelivery ?? "0")
  );

  const [novoInsumo, setNovoInsumo] = useState({
    nome: "",
    unidade: "kg",
    custoUnitario: "",
    categoria: "Geral",
  });

  useEffect(() => {
    fetch("/api/insumos")
      .then((r) => r.json())
      .then(setInsumos)
      .catch(() => setError("Não foi possível carregar insumos."));
  }, []);

  function updateItem(index: number, patch: Partial<ItemForm>) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  async function criarInsumo(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/insumos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...novoInsumo,
        custoUnitario: Number(novoInsumo.custoUnitario),
      }),
    });
    if (!res.ok) {
      setError("Erro ao criar insumo.");
      return;
    }
    const criado = await res.json();
    setInsumos((prev) => [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome)));
    setShowInsumo(false);
    setNovoInsumo({ nome: "", unidade: "kg", custoUnitario: "", categoria: "Geral" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      nome,
      categoria,
      rendimento: Number(rendimento),
      unidadeRendimento,
      modoPreparo,
      validadeHoras: Number(validadeHoras),
      observacoes,
      itens: itens
        .filter((i) => i.insumoId && i.quantidade)
        .map((i) => ({
          insumoId: i.insumoId,
          quantidade: Number(i.quantidade),
          perdaPercentual: Number(i.perdaPercentual) || 0,
        })),
      custoEmbalagem: Number(custoEmbalagem) || 0,
      custoMaoDeObra: Number(custoMaoDeObra) || 0,
      custoOperacional: Number(custoOperacional) || 0,
      margemPercentual: Number(margemPercentual) || 0,
      impostosPercentual: Number(impostosPercentual) || 0,
      taxaDelivery: Number(taxaDelivery) || 0,
    };

    if (!payload.nome || payload.itens.length === 0) {
      setError("Informe o nome e ao menos um insumo.");
      setSaving(false);
      return;
    }

    const res = await fetch(fichaId ? `/api/fichas/${fichaId}` : "/api/fichas", {
      method: fichaId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Não foi possível salvar a ficha técnica.");
      return;
    }

    const data = await res.json();
    router.push(`/fichas/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="dh-scale space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
        <h2 className="font-display mb-4 text-lg font-semibold">Identificação</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="nome">
              Nome do produto / preparo
            </label>
            <input
              id="nome"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Ex.: Brownie de chocolate"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="categoria">
              Categoria
            </label>
            <input
              id="categoria"
              className="input"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Delivery, Confeitaria..."
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="validade">
              Validade (horas)
            </label>
            <input
              id="validade"
              type="number"
              min="1"
              className="input"
              value={validadeHoras}
              onChange={(e) => setValidadeHoras(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="rendimento">
              Rendimento
            </label>
            <input
              id="rendimento"
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={rendimento}
              onChange={(e) => setRendimento(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="unidade">
              Unidade de rendimento
            </label>
            <input
              id="unidade"
              className="input"
              value={unidadeRendimento}
              onChange={(e) => setUnidadeRendimento(e.target.value)}
              placeholder="porções, unidades, fatias..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Insumos</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowInsumo((v) => !v)}
          >
            {showInsumo ? "Fechar" : "+ Novo insumo"}
          </button>
        </div>

        {showInsumo && (
          <div className="mb-5 grid gap-3 rounded-xl border border-dh-accent/20 bg-dh-accent-soft/50 p-4 sm:grid-cols-4">
            <div className="field">
              <label className="label">Nome</label>
              <input
                className="input"
                value={novoInsumo.nome}
                onChange={(e) =>
                  setNovoInsumo((p) => ({ ...p, nome: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label className="label">Unidade</label>
              <select
                className="select"
                value={novoInsumo.unidade}
                onChange={(e) =>
                  setNovoInsumo((p) => ({ ...p, unidade: e.target.value }))
                }
              >
                {["g", "kg", "ml", "L", "un", "cx"].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Custo unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={novoInsumo.custoUnitario}
                onChange={(e) =>
                  setNovoInsumo((p) => ({
                    ...p,
                    custoUnitario: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <button type="button" className="btn btn-primary w-full" onClick={criarInsumo}>
                Salvar insumo
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {itens.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-dh-line/80 bg-dh-surface/50 p-3 sm:grid-cols-12"
            >
              <div className="field sm:col-span-5">
                <label className="label">Insumo</label>
                <select
                  className="select"
                  value={item.insumoId}
                  onChange={(e) =>
                    updateItem(index, { insumoId: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {insumos.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nome} ({ins.unidade})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field sm:col-span-3">
                <label className="label">Quantidade</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="input"
                  value={item.quantidade}
                  onChange={(e) =>
                    updateItem(index, { quantidade: e.target.value })
                  }
                  required
                />
              </div>
              <div className="field sm:col-span-3">
                <label className="label">Perda %</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                  value={item.perdaPercentual}
                  onChange={(e) =>
                    updateItem(index, { perdaPercentual: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  className="btn btn-ghost w-full"
                  onClick={() =>
                    setItens((prev) =>
                      prev.length === 1
                        ? [emptyItem()]
                        : prev.filter((_, i) => i !== index)
                    )
                  }
                  aria-label="Remover item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary mt-4"
          onClick={() => setItens((prev) => [...prev, emptyItem()])}
        >
          + Adicionar insumo
        </button>
      </section>

      <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
        <h2 className="font-display mb-4 text-lg font-semibold">
          Preparo e observações
        </h2>
        <div className="grid gap-4">
          <div className="field">
            <label className="label" htmlFor="modo">
              Modo de preparo
            </label>
            <textarea
              id="modo"
              className="textarea"
              value={modoPreparo}
              onChange={(e) => setModoPreparo(e.target.value)}
              placeholder="Descreva as etapas do preparo..."
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="obs">
              Observações
            </label>
            <textarea
              id="obs"
              className="textarea"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
        <h2 className="font-display mb-1 text-lg font-semibold">
          Parâmetros de precificação
        </h2>
        <p className="mb-4 text-sm text-dh-muted">
          Usados no módulo de Precificação para sugerir o preço de venda.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Embalagem (R$)", custoEmbalagem, setCustoEmbalagem],
            ["Mão de obra (R$)", custoMaoDeObra, setCustoMaoDeObra],
            ["Operacional (R$)", custoOperacional, setCustoOperacional],
            ["Margem %", margemPercentual, setMargemPercentual],
            ["Impostos %", impostosPercentual, setImpostosPercentual],
            ["Taxa delivery (R$)", taxaDelivery, setTaxaDelivery],
          ].map(([label, value, setter]) => (
            <div className="field" key={label as string}>
              <label className="label">{label as string}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando..." : fichaId ? "Atualizar ficha" : "Salvar ficha"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
