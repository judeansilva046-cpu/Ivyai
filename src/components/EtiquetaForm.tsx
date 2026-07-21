"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toInputDate } from "@/lib/format";

type Ficha = {
  id: string;
  nome: string;
  validadeHoras: number;
};

function EtiquetaFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fichaIdParam = searchParams.get("fichaId") || "";

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fichaId, setFichaId] = useState(fichaIdParam);
  const [nomeProduto, setNomeProduto] = useState("");
  const [lote, setLote] = useState("");
  const [dataProducao, setDataProducao] = useState(toInputDate(new Date()));
  const [dataValidade, setDataValidade] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [armazenamento, setArmazenamento] = useState("Refrigerado (0–4°C)");
  const [observacoes, setObservacoes] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [autoValidade, setAutoValidade] = useState(true);

  useEffect(() => {
    fetch("/api/fichas")
      .then((r) => r.json())
      .then((data: Ficha[]) => {
        setFichas(data);
        if (fichaIdParam) {
          const f = data.find((x) => x.id === fichaIdParam);
          if (f) {
            setNomeProduto(f.nome);
            atualizarValidade(dataProducao, f.validadeHoras);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichaIdParam]);

  function atualizarValidade(producao: string, horas: number) {
    const d = new Date(producao);
    if (Number.isNaN(d.getTime())) return;
    const v = new Date(d.getTime() + horas * 60 * 60 * 1000);
    setDataValidade(toInputDate(v));
  }

  function onFichaChange(id: string) {
    setFichaId(id);
    const f = fichas.find((x) => x.id === id);
    if (f) {
      setNomeProduto(f.nome);
      if (autoValidade) atualizarValidade(dataProducao, f.validadeHoras);
      if (!lote) {
        const code = f.nome
          .slice(0, 3)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "X");
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        setLote(`${code}-${stamp}-01`);
      }
    }
  }

  function onProducaoChange(value: string) {
    setDataProducao(value);
    if (autoValidade) {
      const f = fichas.find((x) => x.id === fichaId);
      atualizarValidade(value, f?.validadeHoras ?? 24);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/etiquetas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fichaId: fichaId || null,
        nomeProduto,
        lote,
        dataProducao,
        dataValidade,
        responsavel,
        armazenamento,
        observacoes,
        quantidade: Number(quantidade) || 1,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível gerar a etiqueta.");
      return;
    }
    const data = await res.json();
    router.push(`/etiquetas/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="dh-scale mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-dh-line bg-dh-elevated p-5 sm:p-6">
        <div className="grid gap-4">
          <div className="field">
            <label className="label">Vincular ficha técnica (opcional)</label>
            <select
              className="select"
              value={fichaId}
              onChange={(e) => onFichaChange(e.target.value)}
            >
              <option value="">Sem vínculo</option>
              {fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Nome do produto</label>
            <input
              className="input"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="label">Lote</label>
              <input
                className="input"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                required
                placeholder="Ex.: BRW-20260721-01"
              />
            </div>
            <div className="field">
              <label className="label">Quantidade de etiquetas</label>
              <input
                type="number"
                min="1"
                className="input"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label className="label">Data / hora de produção</label>
              <input
                type="datetime-local"
                className="input"
                value={dataProducao}
                onChange={(e) => onProducaoChange(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label">Data / hora de validade</label>
              <input
                type="datetime-local"
                className="input"
                value={dataValidade}
                onChange={(e) => {
                  setAutoValidade(false);
                  setDataValidade(e.target.value);
                }}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-dh-ink-soft">
            <input
              type="checkbox"
              checked={autoValidade}
              onChange={(e) => {
                setAutoValidade(e.target.checked);
                if (e.target.checked) {
                  const f = fichas.find((x) => x.id === fichaId);
                  atualizarValidade(dataProducao, f?.validadeHoras ?? 24);
                }
              }}
            />
            Calcular validade automaticamente pela ficha
          </label>

          <div className="field">
            <label className="label">Responsável</label>
            <input
              className="input"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              required
              placeholder="Nome de quem produziu"
            />
          </div>

          <div className="field">
            <label className="label">Armazenamento</label>
            <select
              className="select"
              value={armazenamento}
              onChange={(e) => setArmazenamento(e.target.value)}
            >
              <option>Refrigerado (0–4°C)</option>
              <option>Congelado (−18°C)</option>
              <option>Temperatura ambiente</option>
              <option>Ao abrigo da luz</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Observações</label>
            <textarea
              className="textarea"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Gerando..." : "Gerar etiqueta"}
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

export function EtiquetaForm() {
  return (
    <Suspense fallback={<p className="text-dh-muted">Carregando formulário...</p>}>
      <EtiquetaFormInner />
    </Suspense>
  );
}
