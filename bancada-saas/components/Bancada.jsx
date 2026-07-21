"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  UNIDADES,
  custoIngrediente,
  dataValidade,
  fichaVazia,
  formatarDataBR,
  formatarMoeda,
  formatarNumero,
  ingredienteVazio,
  resumoFicha,
} from "@/lib/calculos";
import { gerarPdfEtiquetas, gerarPdfFicha } from "@/lib/pdf";

const cores = {
  primario: "#2E6B4F",
  fundo: "#F2F4F0",
  tinta: "#212824",
  cinza: "#5C6660",
  borda: "#DDE3DC",
  alerta: "#B97F1B",
  branco: "#FFFFFF",
};

const mono = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: cores.cinza,
};

const inputBase = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${cores.borda}`,
  background: cores.branco,
  color: cores.tinta,
  outline: "none",
};

function Label({ children }) {
  return <span style={mono}>{children}</span>;
}

function Campo({ label, children, style }) {
  return (
    <label style={{ display: "grid", gap: 6, ...style }}>
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function Card({ children, style }) {
  return (
    <section
      style={{
        background: cores.branco,
        border: `1px solid ${cores.borda}`,
        borderRadius: 14,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function Botao({ children, variante = "primario", ...props }) {
  const estilos =
    variante === "primario"
      ? { background: cores.primario, color: "#fff", border: "none" }
      : variante === "perigo"
        ? { background: "#fff", color: "#9b2c2c", border: `1px solid #f0c9c9` }
        : { background: "#fff", color: cores.tinta, border: `1px solid ${cores.borda}` };

  return (
    <button
      type="button"
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        opacity: props.disabled ? 0.6 : 1,
        ...estilos,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export default function Bancada({ usuario, fichasIniciais }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [aba, setAba] = useState("ficha");
  const [fichas, setFichas] = useState(fichasIniciais || []);
  const [fichaId, setFichaId] = useState(fichasIniciais?.[0]?.id || null);
  const [nome, setNome] = useState(fichasIniciais?.[0]?.nome || "");
  const [dados, setDados] = useState(
    fichasIniciais?.[0]?.dados || fichaVazia()
  );
  const [statusSalva, setStatusSalva] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const debounceRef = useRef(null);
  const primeiraCarga = useRef(true);

  // Etiquetas
  const [fab, setFab] = useState(() => new Date().toISOString().slice(0, 10));
  const [lote, setLote] = useState("");
  const [qtdEtiquetas, setQtdEtiquetas] = useState(10);

  const resumo = useMemo(() => resumoFicha(dados), [dados]);
  const fichaAtual = fichas.find((f) => f.id === fichaId) || null;

  function selecionarFicha(id) {
    const f = fichas.find((x) => x.id === id);
    if (!f) return;
    setFichaId(f.id);
    setNome(f.nome || "");
    setDados({ ...fichaVazia(), ...(f.dados || {}) });
    setStatusSalva("");
    setErro("");
  }

  const salvarAgora = useCallback(
    async (id, nomeAtual, dadosAtual) => {
      if (!id) return;
      setSalvando(true);
      setErro("");
      const { error } = await supabase
        .from("fichas")
        .update({ nome: nomeAtual.trim() || "Sem nome", dados: dadosAtual })
        .eq("id", id);

      setSalvando(false);
      if (error) {
        setErro(error.message);
        setStatusSalva("");
        return;
      }

      setFichas((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                nome: nomeAtual.trim() || "Sem nome",
                dados: dadosAtual,
                updated_at: new Date().toISOString(),
              }
            : f
        )
      );
      setStatusSalva("Salvo");
    },
    [supabase]
  );

  // Autosave debounce 600ms
  useEffect(() => {
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }
    if (!fichaId) return;

    setStatusSalva("Salvando...");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      salvarAgora(fichaId, nome, dados);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nome, dados, fichaId, salvarAgora]);

  async function novaFicha() {
    setErro("");
    const payload = {
      user_id: usuario.id,
      nome: "Nova receita",
      dados: fichaVazia(),
    };
    const { data, error } = await supabase
      .from("fichas")
      .insert(payload)
      .select("id, nome, dados, updated_at, created_at")
      .single();

    if (error) {
      setErro(error.message);
      return;
    }

    setFichas((prev) => [data, ...prev]);
    setFichaId(data.id);
    setNome(data.nome);
    setDados(data.dados || fichaVazia());
    setAba("ficha");
    setStatusSalva("Criada");
  }

  async function excluirFicha() {
    if (!fichaId) return;
    if (!confirm("Excluir esta ficha técnica?")) return;
    const { error } = await supabase.from("fichas").delete().eq("id", fichaId);
    if (error) {
      setErro(error.message);
      return;
    }
    const resto = fichas.filter((f) => f.id !== fichaId);
    setFichas(resto);
    if (resto[0]) {
      selecionarFicha(resto[0].id);
    } else {
      setFichaId(null);
      setNome("");
      setDados(fichaVazia());
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function patchDados(patch) {
    setDados((prev) => ({ ...prev, ...patch }));
  }

  function patchPreco(patch) {
    setDados((prev) => ({
      ...prev,
      preco: { ...(prev.preco || {}), ...patch },
    }));
  }

  function patchIngrediente(index, patch) {
    setDados((prev) => {
      const lista = [...(prev.ingredientes || [])];
      lista[index] = { ...lista[index], ...patch };
      return { ...prev, ingredientes: lista };
    });
  }

  function addIngrediente() {
    setDados((prev) => ({
      ...prev,
      ingredientes: [...(prev.ingredientes || []), ingredienteVazio()],
    }));
  }

  function removeIngrediente(index) {
    setDados((prev) => {
      const lista = [...(prev.ingredientes || [])];
      if (lista.length <= 1) return { ...prev, ingredientes: [ingredienteVazio()] };
      lista.splice(index, 1);
      return { ...prev, ingredientes: lista };
    });
  }

  const validadeEtiqueta = dataValidade(fab, dados.validadeDias);
  const abas = [
    { id: "ficha", label: "Ficha técnica" },
    { id: "preco", label: "Precificação" },
    { id: "etiquetas", label: "Etiquetas" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: cores.fundo, color: cores.tinta }}>
      <header
        style={{
          borderBottom: `1px solid ${cores.borda}`,
          background: "rgba(247,249,245,0.92)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 18px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: cores.primario,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 600,
              }}
            >
              B
            </span>
            <div>
              <strong style={{ fontSize: 18 }}>BANCADA</strong>
              <p style={{ margin: 0, fontSize: 12, color: cores.cinza }}>{usuario.email}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: cores.cinza, fontFamily: '"IBM Plex Mono", monospace' }}>
              {salvando ? "SALVANDO..." : statusSalva ? statusSalva.toUpperCase() : "—"}
            </span>
            <Botao variante="secundario" onClick={sair}>
              Sair
            </Botao>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 18px 48px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <select
            value={fichaId || ""}
            onChange={(e) => selecionarFicha(e.target.value)}
            style={{ ...inputBase, maxWidth: 320, fontWeight: 600 }}
          >
            {fichas.length === 0 ? (
              <option value="">Nenhuma ficha ainda</option>
            ) : (
              fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))
            )}
          </select>
          <Botao onClick={novaFicha}>+ Nova ficha</Botao>
          {fichaId ? (
            <Botao variante="perigo" onClick={excluirFicha}>
              Excluir
            </Botao>
          ) : null}
          {fichaId ? (
            <Botao
              variante="secundario"
              onClick={() => gerarPdfFicha({ nome, dados })}
            >
              PDF da ficha
            </Botao>
          ) : null}
        </div>

        {erro ? (
          <p
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#fff7ed",
              color: cores.alerta,
              border: "1px solid #f3e0b8",
              fontSize: 14,
            }}
          >
            {erro}
          </p>
        ) : null}

        {!fichaId ? (
          <Card>
            <h2 style={{ margin: 0 }}>Comece pela ficha técnica</h2>
            <p style={{ color: cores.cinza, marginTop: 8 }}>
              Crie sua primeira receita para precificar e gerar etiquetas.
            </p>
            <div style={{ marginTop: 14 }}>
              <Botao onClick={novaFicha}>Criar primeira ficha</Botao>
            </div>
          </Card>
        ) : (
          <>
            <nav
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {abas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: `1px solid ${aba === a.id ? cores.primario : cores.borda}`,
                    background: aba === a.id ? cores.primario : "#fff",
                    color: aba === a.id ? "#fff" : cores.tinta,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </nav>

            {aba === "ficha" ? (
              <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1fr) 280px" }}>
                <div style={{ display: "grid", gap: 16, gridColumn: "1 / -1" }}>
                  <style>{`
                    @media (min-width: 900px) {
                      .bancada-grid { display: grid !important; grid-template-columns: minmax(0,1fr) 300px; gap: 16px; align-items: start; }
                    }
                  `}</style>
                  <div className="bancada-grid" style={{ display: "grid", gap: 16 }}>
                    <div style={{ display: "grid", gap: 16 }}>
                      <Card>
                        <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Produto</h2>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          }}
                        >
                          <Campo label="Nome" style={{ gridColumn: "1 / -1" }}>
                            <input
                              style={inputBase}
                              value={nome}
                              onChange={(e) => setNome(e.target.value)}
                              placeholder="Ex.: Brownie de chocolate"
                            />
                          </Campo>
                          <Campo label="Rendimento">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              style={inputBase}
                              value={dados.rendimento ?? 1}
                              onChange={(e) =>
                                patchDados({ rendimento: Number(e.target.value) || 0 })
                              }
                            />
                          </Campo>
                          <Campo label="Unidade">
                            <input
                              style={inputBase}
                              value={dados.unidade || ""}
                              onChange={(e) => patchDados({ unidade: e.target.value })}
                              placeholder="porções, unidades..."
                            />
                          </Campo>
                          <Campo label="Validade (dias)">
                            <input
                              type="number"
                              min="0"
                              style={inputBase}
                              value={dados.validadeDias ?? 0}
                              onChange={(e) =>
                                patchDados({ validadeDias: Number(e.target.value) || 0 })
                              }
                            />
                          </Campo>
                          <Campo label="Conservação" style={{ gridColumn: "1 / -1" }}>
                            <textarea
                              style={{ ...inputBase, minHeight: 72, resize: "vertical" }}
                              value={dados.conservacao || ""}
                              onChange={(e) => patchDados({ conservacao: e.target.value })}
                            />
                          </Campo>
                        </div>
                      </Card>

                      <Card>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <h2 style={{ margin: 0, fontSize: 18 }}>Ingredientes</h2>
                          <Botao variante="secundario" onClick={addIngrediente}>
                            + Ingrediente
                          </Botao>
                        </div>
                        <p style={{ margin: "0 0 12px", color: cores.cinza, fontSize: 13 }}>
                          Informe como você compra e quanto usa na receita. O custo calcula sozinho
                          (kg↔g, L↔ml).
                        </p>

                        <div style={{ display: "grid", gap: 12 }}>
                          {(dados.ingredientes || []).map((ing, index) => {
                            const { custo, aviso } = custoIngrediente(ing);
                            return (
                              <div
                                key={index}
                                style={{
                                  border: `1px solid ${cores.borda}`,
                                  borderRadius: 12,
                                  padding: 12,
                                  background: "#fafbf9",
                                }}
                              >
                                <div
                                  style={{
                                    display: "grid",
                                    gap: 10,
                                    gridTemplateColumns: "minmax(0, 1.4fr) repeat(5, minmax(70px, 1fr)) auto",
                                  }}
                                >
                                  <Campo label="Ingrediente">
                                    <input
                                      style={inputBase}
                                      value={ing.nome || ""}
                                      onChange={(e) =>
                                        patchIngrediente(index, { nome: e.target.value })
                                      }
                                      placeholder="Farinha"
                                    />
                                  </Campo>
                                  <Campo label="Qtd compra">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      style={inputBase}
                                      value={ing.qtdCompra ?? ""}
                                      onChange={(e) =>
                                        patchIngrediente(index, {
                                          qtdCompra: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </Campo>
                                  <Campo label="Un. compra">
                                    <select
                                      style={inputBase}
                                      value={ing.unidadeCompra || "kg"}
                                      onChange={(e) =>
                                        patchIngrediente(index, {
                                          unidadeCompra: e.target.value,
                                        })
                                      }
                                    >
                                      {UNIDADES.map((u) => (
                                        <option key={u} value={u}>
                                          {u}
                                        </option>
                                      ))}
                                    </select>
                                  </Campo>
                                  <Campo label="Preço pago">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      style={inputBase}
                                      value={ing.precoCompra ?? ""}
                                      onChange={(e) =>
                                        patchIngrediente(index, {
                                          precoCompra: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </Campo>
                                  <Campo label="Qtd uso">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      style={inputBase}
                                      value={ing.qtdUso ?? ""}
                                      onChange={(e) =>
                                        patchIngrediente(index, {
                                          qtdUso: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </Campo>
                                  <Campo label="Un. uso">
                                    <select
                                      style={inputBase}
                                      value={ing.unidadeUso || "g"}
                                      onChange={(e) =>
                                        patchIngrediente(index, {
                                          unidadeUso: e.target.value,
                                        })
                                      }
                                    >
                                      {UNIDADES.map((u) => (
                                        <option key={u} value={u}>
                                          {u}
                                        </option>
                                      ))}
                                    </select>
                                  </Campo>
                                  <div style={{ alignSelf: "end" }}>
                                    <Botao
                                      variante="secundario"
                                      onClick={() => removeIngrediente(index)}
                                      style={{ padding: "10px 12px" }}
                                      aria-label="Remover"
                                    >
                                      ✕
                                    </Botao>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    marginTop: 8,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontFamily: '"IBM Plex Mono", monospace',
                                      fontWeight: 600,
                                      color: cores.primario,
                                    }}
                                  >
                                    Custo: {formatarMoeda(custo)}
                                  </span>
                                  {aviso ? (
                                    <span style={{ color: cores.alerta, fontSize: 12 }}>{aviso}</span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>

                    <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
                      <Card style={{ background: "#eef5f0", borderColor: "#cfe0d5" }}>
                        <p style={mono}>Custo em tempo real</p>
                        <p style={{ margin: "10px 0 0", fontSize: 13, color: cores.cinza }}>
                          Total da receita
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 28,
                            fontWeight: 700,
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          {formatarMoeda(resumo.custoTotal)}
                        </p>
                        <p style={{ margin: "14px 0 0", fontSize: 13, color: cores.cinza }}>
                          Por {dados.unidade || "porção"}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 22,
                            fontWeight: 700,
                            color: cores.primario,
                            fontFamily: '"IBM Plex Mono", monospace',
                          }}
                        >
                          {formatarMoeda(resumo.custoPorcao)}
                        </p>
                        {resumo.avisos?.length ? (
                          <ul style={{ margin: "14px 0 0", paddingLeft: 18, color: cores.alerta, fontSize: 12 }}>
                            {resumo.avisos.map((a) => (
                              <li key={`${a.index}-${a.nome}`}>{a.nome}: {a.aviso}</li>
                            ))}
                          </ul>
                        ) : null}
                      </Card>
                    </aside>
                  </div>
                </div>
              </div>
            ) : null}

            {aba === "preco" ? (
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
              >
                <Card>
                  <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Precificação</h2>
                  <p style={{ margin: "0 0 14px", color: cores.cinza, fontSize: 13 }}>
                    Percentuais são sobre o <strong>preço de venda</strong>. Alterações salvam
                    automaticamente.
                  </p>
                  <p style={{ margin: "0 0 14px", fontFamily: '"IBM Plex Mono", monospace' }}>
                    Custo/porção: {formatarMoeda(resumo.custoPorcao)}
                  </p>
                  <div style={{ display: "grid", gap: 12 }}>
                    <Campo label="Embalagem (R$)">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        style={inputBase}
                        value={dados.preco?.embalagem ?? 0}
                        onChange={(e) =>
                          patchPreco({ embalagem: Number(e.target.value) || 0 })
                        }
                      />
                    </Campo>
                    <Campo label="Taxas / impostos (%)">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        style={inputBase}
                        value={dados.preco?.taxasPct ?? 0}
                        onChange={(e) =>
                          patchPreco({ taxasPct: Number(e.target.value) || 0 })
                        }
                      />
                    </Campo>
                    <Campo label="Custos fixos (%)">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        style={inputBase}
                        value={dados.preco?.fixosPct ?? 0}
                        onChange={(e) =>
                          patchPreco({ fixosPct: Number(e.target.value) || 0 })
                        }
                      />
                    </Campo>
                    <Campo label="Lucro (%)">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        style={inputBase}
                        value={dados.preco?.lucroPct ?? 0}
                        onChange={(e) =>
                          patchPreco({ lucroPct: Number(e.target.value) || 0 })
                        }
                      />
                    </Campo>
                  </div>
                </Card>

                <Card style={{ background: "#eef5f0", borderColor: "#cfe0d5" }}>
                  <p style={mono}>Resultado</p>
                  {resumo.precificacao.impossivel ? (
                    <p style={{ marginTop: 12, color: cores.alerta, fontWeight: 600 }}>
                      {resumo.precificacao.alerta}
                    </p>
                  ) : (
                    <>
                      <p style={{ margin: "12px 0 0", fontSize: 13, color: cores.cinza }}>
                        Preço sugerido
                      </p>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 32,
                          fontWeight: 700,
                          color: cores.primario,
                          fontFamily: '"IBM Plex Mono", monospace',
                        }}
                      >
                        {formatarMoeda(resumo.precificacao.precoVenda)}
                      </p>
                      <dl style={{ margin: "18px 0 0", display: "grid", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <dt style={{ color: cores.cinza }}>Lucro / un</dt>
                          <dd style={{ margin: 0, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
                            {formatarMoeda(resumo.precificacao.lucroUn)}
                          </dd>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <dt style={{ color: cores.cinza }}>Markup</dt>
                          <dd style={{ margin: 0, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
                            {formatarNumero(resumo.precificacao.markup, 1)}%
                          </dd>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <dt style={{ color: cores.cinza }}>Soma %</dt>
                          <dd style={{ margin: 0, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
                            {formatarNumero(resumo.precificacao.somaPct, 1)}%
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </Card>
              </div>
            ) : null}

            {aba === "etiquetas" ? (
              <div style={{ display: "grid", gap: 16 }}>
                <Card>
                  <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Etiquetas de validade</h2>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    }}
                  >
                    <Campo label="Ficha">
                      <input style={inputBase} value={nome} disabled />
                    </Campo>
                    <Campo label="Fabricação">
                      <input
                        type="date"
                        style={inputBase}
                        value={fab}
                        onChange={(e) => setFab(e.target.value)}
                      />
                    </Campo>
                    <Campo label="Validade (calc.)">
                      <input
                        style={inputBase}
                        value={formatarDataBR(validadeEtiqueta)}
                        disabled
                      />
                    </Campo>
                    <Campo label="Lote (opcional)">
                      <input
                        style={inputBase}
                        value={lote}
                        onChange={(e) => setLote(e.target.value)}
                        placeholder="Lote 001"
                      />
                    </Campo>
                    <Campo label="Quantidade">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        style={inputBase}
                        value={qtdEtiquetas}
                        onChange={(e) =>
                          setQtdEtiquetas(Math.max(1, Number(e.target.value) || 1))
                        }
                      />
                    </Campo>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Botao
                      onClick={() =>
                        gerarPdfEtiquetas({
                          nome,
                          dataFabricacao: fab,
                          validadeDias: dados.validadeDias,
                          lote,
                          conservacao: dados.conservacao,
                          quantidade: qtdEtiquetas,
                        })
                      }
                    >
                      Baixar PDF A4
                    </Botao>
                  </div>
                </Card>

                <Card>
                  <p style={{ ...mono, marginBottom: 12 }}>Pré-visualização</p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {Array.from({ length: Math.min(qtdEtiquetas, 10) }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          border: `1.5px dashed ${cores.cinza}`,
                          borderRadius: 4,
                          padding: 12,
                          minHeight: 110,
                          background: "#fff",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {nome || "PRODUTO"}
                        </p>
                        <p style={{ margin: "10px 0 0", fontSize: 12 }}>
                          FAB: {formatarDataBR(fab)}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 14,
                            fontWeight: 700,
                            color: cores.primario,
                          }}
                        >
                          VAL: {formatarDataBR(validadeEtiqueta)}
                        </p>
                        {lote ? (
                          <p style={{ margin: "6px 0 0", fontSize: 11, color: cores.cinza }}>
                            Lote: {lote}
                          </p>
                        ) : null}
                        {dados.conservacao ? (
                          <p style={{ margin: "6px 0 0", fontSize: 10, color: cores.cinza }}>
                            {dados.conservacao}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {qtdEtiquetas > 10 ? (
                    <p style={{ marginTop: 10, fontSize: 12, color: cores.cinza }}>
                      Mostrando 10 de {qtdEtiquetas} — o PDF inclui todas.
                    </p>
                  ) : null}
                </Card>
              </div>
            ) : null}
          </>
        )}

        {fichaAtual ? (
          <p style={{ marginTop: 24, fontSize: 12, color: cores.cinza }}>
            Última atualização:{" "}
            {new Date(fichaAtual.updated_at).toLocaleString("pt-BR")}
          </p>
        ) : null}
      </main>
    </div>
  );
}
