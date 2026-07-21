/**
 * Geração de PDFs — etiquetas A4 e ficha técnica completa.
 */
import { jsPDF } from "jspdf";
import {
  custoIngrediente,
  dataValidade,
  formatarDataBR,
  formatarMoeda,
  formatarNumero,
  resumoFicha,
} from "./calculos";

const MM = {
  pageW: 210,
  pageH: 297,
  labelW: 90,
  labelH: 46,
  cols: 2,
  rows: 5,
  marginX: 15,
  marginY: 12.5,
  gapX: 0,
  gapY: 0,
};

function desenharTracejado(doc, x, y, w, h) {
  doc.setDrawColor(90, 102, 96);
  doc.setLineWidth(0.3);
  if (typeof doc.setLineDash === "function") {
    doc.setLineDash([1.2, 1.2], 0);
  }
  doc.rect(x, y, w, h);
  if (typeof doc.setLineDash === "function") {
    doc.setLineDash([], 0);
  }
}

/**
 * PDF A4: 2 colunas × 5 linhas, etiquetas 90×46mm.
 */
export function gerarPdfEtiquetas({
  nome,
  dataFabricacao,
  validadeDias,
  lote,
  conservacao,
  quantidade,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fab = dataFabricacao ? new Date(dataFabricacao) : new Date();
  fab.setHours(12, 0, 0, 0);
  const val = dataValidade(fab, validadeDias);
  const fabStr = formatarDataBR(fab);
  const valStr = formatarDataBR(val);
  const qtd = Math.max(1, Number(quantidade) || 1);
  const porPagina = MM.cols * MM.rows;

  for (let i = 0; i < qtd; i++) {
    if (i > 0 && i % porPagina === 0) doc.addPage();
    const idx = i % porPagina;
    const col = idx % MM.cols;
    const row = Math.floor(idx / MM.cols);
    const x = MM.marginX + col * (MM.labelW + MM.gapX);
    const y = MM.marginY + row * (MM.labelH + MM.gapY);

    desenharTracejado(doc, x, y, MM.labelW, MM.labelH);

    const px = x + 4;
    let py = y + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(33, 40, 36);
    const titulo = String(nome || "PRODUTO").toUpperCase();
    doc.text(doc.splitTextToSize(titulo, MM.labelW - 8), px, py);

    py += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`FAB: ${fabStr}`, px, py);

    py += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(46, 107, 79);
    doc.text(`VAL: ${valStr}`, px, py);

    doc.setTextColor(33, 40, 36);
    py += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (lote) doc.text(`Lote: ${lote}`, px, py);

    py += 5;
    const cons = String(conservacao || "").trim();
    if (cons) {
      doc.setFontSize(7);
      doc.setTextColor(92, 102, 96);
      doc.text(doc.splitTextToSize(cons, MM.labelW - 8), px, py);
    }
  }

  doc.save(`etiquetas-${(nome || "produto").replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

/** PDF da ficha técnica completa (ingredientes + precificação). */
export function gerarPdfFicha({ nome, dados }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const resumo = resumoFicha(dados);
  const ingredientes = dados?.ingredientes || [];
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(46, 107, 79);
  doc.text("BANCADA — Ficha Técnica", 14, y);

  y += 10;
  doc.setTextColor(33, 40, 36);
  doc.setFontSize(14);
  doc.text(String(nome || "Sem nome"), 14, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(92, 102, 96);
  doc.text(
    `Rendimento: ${formatarNumero(dados?.rendimento, 0)} ${dados?.unidade || ""}  ·  Validade: ${dados?.validadeDias || 0} dias`,
    14,
    y
  );

  y += 6;
  if (dados?.conservacao) {
    doc.text(`Conservação: ${dados.conservacao}`, 14, y);
    y += 8;
  } else {
    y += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(33, 40, 36);
  doc.text("Ingredientes", 14, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(92, 102, 96);
  doc.text("Nome", 14, y);
  doc.text("Uso", 90, y);
  doc.text("Custo", 160, y);
  y += 2;
  doc.setDrawColor(221, 227, 220);
  doc.line(14, y, 196, y);
  y += 5;

  doc.setTextColor(33, 40, 36);
  ingredientes.forEach((ing) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const { custo } = custoIngrediente(ing);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(ing.nome || "—").slice(0, 40), 14, y);
    doc.text(
      `${formatarNumero(ing.qtdUso, 2)} ${ing.unidadeUso || ""}`,
      90,
      y
    );
    doc.text(formatarMoeda(custo), 160, y);
    y += 6;
  });

  y += 6;
  doc.setDrawColor(221, 227, 220);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo de custos e precificação", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const linhas = [
    `Custo total da receita: ${formatarMoeda(resumo.custoTotal)}`,
    `Custo por porção: ${formatarMoeda(resumo.custoPorcao)}`,
    `Embalagem: ${formatarMoeda(dados?.preco?.embalagem)}`,
    `Taxas/impostos: ${formatarNumero(dados?.preco?.taxasPct, 1)}%`,
    `Custos fixos: ${formatarNumero(dados?.preco?.fixosPct, 1)}%`,
    `Lucro: ${formatarNumero(dados?.preco?.lucroPct, 1)}%`,
  ];

  linhas.forEach((linha) => {
    doc.text(linha, 14, y);
    y += 6;
  });

  y += 4;
  const p = resumo.precificacao;
  if (p.impossivel) {
    doc.setTextColor(185, 127, 27);
    doc.text(p.alerta, 14, y);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 107, 79);
    doc.setFontSize(12);
    doc.text(`Preço sugerido: ${formatarMoeda(p.precoVenda)}`, 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(33, 40, 36);
    doc.text(
      `Lucro/un: ${formatarMoeda(p.lucroUn)}  ·  Markup: ${formatarNumero(p.markup, 1)}%`,
      14,
      y
    );
  }

  doc.save(`ficha-${(nome || "receita").replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
