/**
 * BANCADA — fonte única da verdade para cálculos de custo e precificação.
 * Variáveis sem acento; UI/mensagens em português.
 */

export const UNIDADES = ["g", "kg", "ml", "L", "un"];

/** Fator para converter para unidade-base (g, ml ou un). */
export function fatorBase(unidade) {
  const u = String(unidade || "").trim();
  if (u === "kg") return { base: "g", fator: 1000 };
  if (u === "g") return { base: "g", fator: 1 };
  if (u === "L") return { base: "ml", fator: 1000 };
  if (u === "ml") return { base: "ml", fator: 1 };
  if (u === "un") return { base: "un", fator: 1 };
  return null;
}

/**
 * Converte quantidade para unidade-base.
 * Retorna null se a unidade for desconhecida.
 */
export function paraBase(quantidade, unidade) {
  const info = fatorBase(unidade);
  if (!info) return null;
  const q = Number(quantidade);
  if (!Number.isFinite(q) || q < 0) return null;
  return { base: info.base, quantidade: q * info.fator };
}

/**
 * Custo de um ingrediente:
 * precoCompra × (qtdUso ÷ qtdCompra), com conversão kg↔g e L↔ml.
 * Bases incompatíveis → custo 0 + aviso.
 */
export function custoIngrediente(ing) {
  const avisoIncompativel =
    "Unidades incompatíveis entre compra e uso (ex.: kg com ml). Custo zerado.";

  const compra = paraBase(ing.qtdCompra, ing.unidadeCompra);
  const uso = paraBase(ing.qtdUso, ing.unidadeUso);
  const preco = Number(ing.precoCompra);

  if (!compra || !uso || !Number.isFinite(preco) || preco < 0) {
    return { custo: 0, aviso: "Dados incompletos ou inválidos para este ingrediente." };
  }

  if (compra.base !== uso.base) {
    return { custo: 0, aviso: avisoIncompativel };
  }

  if (compra.quantidade <= 0) {
    return { custo: 0, aviso: "Quantidade de compra deve ser maior que zero." };
  }

  const custo = preco * (uso.quantidade / compra.quantidade);
  return { custo, aviso: null };
}

/** Soma custos dos ingredientes da ficha. */
export function custoReceita(ingredientes) {
  const lista = Array.isArray(ingredientes) ? ingredientes : [];
  let total = 0;
  const avisos = [];

  lista.forEach((ing, index) => {
    const { custo, aviso } = custoIngrediente(ing);
    total += custo;
    if (aviso) {
      avisos.push({
        index,
        nome: ing.nome || `Ingrediente ${index + 1}`,
        aviso,
      });
    }
  });

  return { total, avisos };
}

/** Custo por porção = custo total ÷ rendimento. */
export function custoPorPorcao(custoTotal, rendimento) {
  const r = Number(rendimento);
  if (!Number.isFinite(r) || r <= 0) return 0;
  return custoTotal / r;
}

/**
 * Precificação: percentuais SOBRE O PREÇO DE VENDA.
 * precoVenda = (custoPorcao + embalagem) / (1 − somaPct/100)
 */
export function calcularPreco({
  custoPorcao,
  embalagem = 0,
  taxasPct = 0,
  fixosPct = 0,
  lucroPct = 0,
}) {
  const custo = Number(custoPorcao) || 0;
  const emb = Number(embalagem) || 0;
  const taxas = Number(taxasPct) || 0;
  const fixos = Number(fixosPct) || 0;
  const lucro = Number(lucroPct) || 0;
  const somaPct = taxas + fixos + lucro;
  const base = custo + emb;

  if (somaPct >= 100) {
    return {
      impossivel: true,
      somaPct,
      precoVenda: 0,
      lucroUn: 0,
      markup: 0,
      alerta: "Soma dos percentuais ≥ 100%. Preço de venda impossível.",
    };
  }

  const denominador = 1 - somaPct / 100;
  const precoVenda = denominador > 0 ? base / denominador : 0;
  const lucroUn = precoVenda * (lucro / 100);
  const markup = base > 0 ? (precoVenda / base - 1) * 100 : 0;

  return {
    impossivel: false,
    somaPct,
    precoVenda,
    lucroUn,
    markup,
    alerta: null,
  };
}

/** Resumo completo da ficha (custo + preço). */
export function resumoFicha(dados) {
  const d = dados || {};
  const { total, avisos } = custoReceita(d.ingredientes || []);
  const porcao = custoPorPorcao(total, d.rendimento);
  const preco = d.preco || {};
  const precificacao = calcularPreco({
    custoPorcao: porcao,
    embalagem: preco.embalagem,
    taxasPct: preco.taxasPct,
    fixosPct: preco.fixosPct,
    lucroPct: preco.lucroPct,
  });

  return {
    custoTotal: total,
    custoPorcao: porcao,
    avisos,
    precificacao,
  };
}

/** Validade = fabricação + validadeDias. */
export function dataValidade(dataFabricacao, validadeDias) {
  const base = dataFabricacao ? new Date(dataFabricacao) : new Date();
  const dias = Number(validadeDias) || 0;
  const val = new Date(base);
  val.setHours(12, 0, 0, 0);
  val.setDate(val.getDate() + dias);
  return val;
}

export function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarNumero(valor, casas = 2) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarDataBR(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("pt-BR");
}

/** Estado inicial de uma ficha nova. */
export function fichaVazia() {
  return {
    rendimento: 1,
    unidade: "porções",
    validadeDias: 3,
    conservacao: "Manter refrigerado entre 0°C e 5°C",
    ingredientes: [ingredienteVazio()],
    preco: {
      embalagem: 0,
      taxasPct: 0,
      fixosPct: 0,
      lucroPct: 30,
    },
  };
}

export function ingredienteVazio() {
  return {
    nome: "",
    qtdCompra: 1,
    unidadeCompra: "kg",
    precoCompra: 0,
    qtdUso: 0,
    unidadeUso: "g",
  };
}
