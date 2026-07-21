"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { calcularPrecificacao, custoItem } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";

type ItemForm = {
  key: string;
  insumoId: string;
  nome: string;
  unidade: string;
  custoUnitario: string;
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
    itens: {
      insumoId: string;
      nome?: string;
      unidade?: string;
      custoUnitario?: number;
      quantidade: number;
      perdaPercentual: number;
    }[];
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

const UNIDADES = ["g", "kg", "ml", "L", "un", "cx"];

function newItem(): ItemForm {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    insumoId: "",
    nome: "",
    unidade: "kg",
    custoUnitario: "",
    quantidade: "",
    perdaPercentual: "0",
  };
}

export function FichaForm({ fichaId, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

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
      ? initial.itens.map((i, idx) => ({
          key: `init-${idx}`,
          insumoId: i.insumoId || "",
          nome: i.nome || "",
          unidade: i.unidade || "kg",
          custoUnitario: String(i.custoUnitario ?? ""),
          quantidade: String(i.quantidade),
          perdaPercentual: String(i.perdaPercentual ?? 0),
        }))
      : [newItem()]
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

  function updateItem(key: string, patch: Partial<ItemForm>) {
    setItens((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  const live = useMemo(() => {
    const custoItens = itens
      .filter((i) => i.nome.trim() && i.quantidade && i.custoUnitario !== "")
      .map((i) => ({
        quantidade: Number(i.quantidade) || 0,
        perdaPercentual: Number(i.perdaPercentual) || 0,
        custoUnitario: Number(i.custoUnitario) || 0,
      }));

    return calcularPrecificacao(custoItens, Number(rendimento) || 1, {
      custoEmbalagem: Number(custoEmbalagem) || 0,
      custoMaoDeObra: Number(custoMaoDeObra) || 0,
      custoOperacional: Number(custoOperacional) || 0,
      margemPercentual: Number(margemPercentual) || 0,
      impostosPercentual: Number(impostosPercentual) || 0,
      taxaDelivery: Number(taxaDelivery) || 0,
    });
  }, [
    itens,
    rendimento,
    custoEmbalagem,
    custoMaoDeObra,
    custoOperacional,
    margemPercentual,
    impostosPercentual,
    taxaDelivery,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setSaving(true);

    const payloadItens = itens
      .filter((i) => i.nome.trim() && Number(i.quantidade) > 0)
      .map((i) => ({
        insumoId: i.insumoId || undefined,
        nome: i.nome.trim(),
        unidade: i.unidade,
        custoUnitario: Number(i.custoUnitario),
        quantidade: Number(i.quantidade),
        perdaPercentual: Number(i.perdaPercentual) || 0,
      }));

    if (!nome.trim()) {
      setError("Informe o nome da receita.");
      setSaving(false);
      return;
    }

    if (payloadItens.length === 0) {
      setError("Adicione ao menos um ingrediente com nome, custo e quantidade.");
      setSaving(false);
      return;
    }

    for (const item of payloadItens) {
      if (Number.isNaN(item.custoUnitario) || item.custoUnitario < 0) {
        setError(`Informe o custo válido de "${item.nome}".`);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(fichaId ? `/api/fichas/${fichaId}` : "/api/fichas", {
        method: fichaId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          nome: nome.trim(),
          categoria,
          rendimento: Number(rendimento) || 1,
          unidadeRendimento,
          modoPreparo,
          validadeHoras: Number(validadeHoras) || 24,
          observacoes,
          itens: payloadItens,
          custoEmbalagem: Number(custoEmbalagem) || 0,
          custoMaoDeObra: Number(custoMaoDeObra) || 0,
          custoOperacional: Number(custoOperacional) || 0,
          margemPercentual: Number(margemPercentual) || 0,
          impostosPercentual: Number(impostosPercentual) || 0,
          taxaDelivery: Number(taxaDelivery) || 0,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        setSaving(false);
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Não foi possível salvar a ficha técnica.");
        setSaving(false);
        return;
      }

      setOkMsg("Ficha salva com sucesso!");
      setSaving(false);
      router.push(`/fichas/${data.id}`);
      router.refresh();
    } catch {
      setError("Falha de conexão ao salvar. Tente novamente.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="dh-scale space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {okMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
            <h2 className="font-display mb-4 text-lg font-semibold">Receita</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field sm:col-span-2">
                <label className="label">Nome da receita</label>
                <input
                  className="input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Ex.: Brownie de chocolate"
                />
              </div>
              <div className="field">
                <label className="label">Categoria</label>
                <input
                  className="input"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Confeitaria, Delivery..."
                />
              </div>
              <div className="field">
                <label className="label">Validade (horas)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={validadeHoras}
                  onChange={(e) => setValidadeHoras(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Rendimento</label>
                <input
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
                <label className="label">Unidade</label>
                <input
                  className="input"
                  value={unidadeRendimento}
                  onChange={(e) => setUnidadeRendimento(e.target.value)}
                  placeholder="porções, unidades..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Ingredientes
                </h2>
                <p className="text-sm text-dh-muted">
                  Digite o nome, custo e quantidade — o DeliveryHub salva tudo junto.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {itens.map((item) => {
                const linhaCusto = custoItem({
                  quantidade: Number(item.quantidade) || 0,
                  perdaPercentual: Number(item.perdaPercentual) || 0,
                  custoUnitario: Number(item.custoUnitario) || 0,
                });
                return (
                  <div
                    key={item.key}
                    className="grid gap-2 rounded-xl border border-dh-line/80 bg-dh-surface/40 p-3 sm:grid-cols-12"
                  >
                    <div className="field sm:col-span-4">
                      <label className="label">Ingrediente</label>
                      <input
                        className="input"
                        value={item.nome}
                        onChange={(e) =>
                          updateItem(item.key, { nome: e.target.value })
                        }
                        placeholder="Ex.: Farinha de trigo"
                        required
                      />
                    </div>
                    <div className="field sm:col-span-2">
                      <label className="label">Unidade</label>
                      <select
                        className="select"
                        value={item.unidade}
                        onChange={(e) =>
                          updateItem(item.key, { unidade: e.target.value })
                        }
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field sm:col-span-2">
                      <label className="label">Custo (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        value={item.custoUnitario}
                        onChange={(e) =>
                          updateItem(item.key, {
                            custoUnitario: e.target.value,
                          })
                        }
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div className="field sm:col-span-2">
                      <label className="label">Qtd.</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="input"
                        value={item.quantidade}
                        onChange={(e) =>
                          updateItem(item.key, { quantidade: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="field sm:col-span-1">
                      <label className="label">Perda%</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="input"
                        value={item.perdaPercentual}
                        onChange={(e) =>
                          updateItem(item.key, {
                            perdaPercentual: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-stretch">
                      <p className="text-xs font-medium text-dh-muted sm:order-2">
                        {formatCurrency(linhaCusto)}
                      </p>
                      <button
                        type="button"
                        className="btn btn-ghost px-2 py-2"
                        onClick={() =>
                          setItens((prev) =>
                            prev.length === 1
                              ? [newItem()]
                              : prev.filter((x) => x.key !== item.key)
                          )
                        }
                        aria-label="Remover"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => setItens((prev) => [...prev, newItem()])}
            >
              + Adicionar ingrediente
            </button>
          </section>

          <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
            <h2 className="font-display mb-4 text-lg font-semibold">
              Modo de preparo
            </h2>
            <textarea
              className="textarea"
              value={modoPreparo}
              onChange={(e) => setModoPreparo(e.target.value)}
              placeholder="Etapas do preparo..."
            />
            <div className="field mt-4">
              <label className="label">Observações</label>
              <textarea
                className="textarea"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-dh-accent/30 bg-dh-accent-soft p-5">
            <h2 className="font-display text-lg font-semibold text-dh-ink">
              Custo em tempo real
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Custo ingredientes</dt>
                <dd className="font-semibold">
                  {formatCurrency(live.custoInsumos)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Custo total</dt>
                <dd className="font-semibold">
                  {formatCurrency(live.custoTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Custo / porção</dt>
                <dd className="font-semibold">
                  {formatCurrency(live.custoPorPorcao)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-dh-accent/20 pt-2">
                <dt className="text-dh-muted">Preço sugerido</dt>
                <dd className="font-display text-xl font-bold text-dh-accent-deep">
                  {formatCurrency(live.precoSugerido)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-dh-muted">Lucro estimado</dt>
                <dd className="font-semibold text-dh-sage">
                  {formatCurrency(live.lucroEstimado)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-dh-line bg-dh-elevated p-5">
            <h3 className="font-display mb-3 text-base font-semibold">
              Precificação
            </h3>
            <div className="grid gap-3">
              {(
                [
                  ["Embalagem (R$)", custoEmbalagem, setCustoEmbalagem],
                  ["Mão de obra (R$)", custoMaoDeObra, setCustoMaoDeObra],
                  ["Operacional (R$)", custoOperacional, setCustoOperacional],
                  ["Margem %", margemPercentual, setMargemPercentual],
                  ["Impostos %", impostosPercentual, setImpostosPercentual],
                  ["Taxa delivery (R$)", taxaDelivery, setTaxaDelivery],
                ] as const
              ).map(([label, value, setter]) => (
                <div className="field" key={label}>
                  <label className="label">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving
              ? "Salvando..."
              : fichaId
                ? "Atualizar ficha"
                : "Salvar ficha técnica"}
          </button>
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => router.push("/fichas")}
          >
            Cancelar
          </button>
        </aside>
      </div>
    </form>
  );
}
