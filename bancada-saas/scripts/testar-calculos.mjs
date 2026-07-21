/**
 * Smoke test da fonte única de verdade — lib/calculos.js
 * Rode: npm run test:calculos
 */
import assert from "node:assert/strict";
import {
  calcularPreco,
  custoIngrediente,
  custoPorPorcao,
  custoReceita,
  dataValidade,
  resumoFicha,
} from "../lib/calculos.js";

let passou = 0;
function ok(nome) {
  passou += 1;
  console.log(`  ✓ ${nome}`);
}

console.log("BANCADA — testes de cálculo\n");

{
  const r = custoIngrediente({
    nome: "Farinha",
    qtdCompra: 1,
    unidadeCompra: "kg",
    precoCompra: 10,
    qtdUso: 500,
    unidadeUso: "g",
  });
  assert.equal(r.aviso, null);
  assert.ok(Math.abs(r.custo - 5) < 1e-9);
  ok("kg↔g: 500g de 1kg/R$10 = R$5");
}

{
  const r = custoIngrediente({
    nome: "Leite",
    qtdCompra: 1,
    unidadeCompra: "L",
    precoCompra: 8,
    qtdUso: 250,
    unidadeUso: "ml",
  });
  assert.equal(r.aviso, null);
  assert.ok(Math.abs(r.custo - 2) < 1e-9);
  ok("L↔ml: 250ml de 1L/R$8 = R$2");
}

{
  const r = custoIngrediente({
    nome: "Erro",
    qtdCompra: 1,
    unidadeCompra: "kg",
    precoCompra: 10,
    qtdUso: 100,
    unidadeUso: "ml",
  });
  assert.equal(r.custo, 0);
  assert.ok(r.aviso);
  ok("bases incompatíveis → custo 0 + aviso");
}

{
  const { total } = custoReceita([
    {
      nome: "A",
      qtdCompra: 1,
      unidadeCompra: "kg",
      precoCompra: 10,
      qtdUso: 500,
      unidadeUso: "g",
    },
    {
      nome: "B",
      qtdCompra: 1,
      unidadeCompra: "un",
      precoCompra: 2,
      qtdUso: 3,
      unidadeUso: "un",
    },
  ]);
  assert.ok(Math.abs(total - 11) < 1e-9);
  assert.ok(Math.abs(custoPorPorcao(total, 2) - 5.5) < 1e-9);
  ok("custo receita + por porção");
}

{
  const p = calcularPreco({
    custoPorcao: 5,
    embalagem: 1,
    taxasPct: 10,
    fixosPct: 10,
    lucroPct: 30,
  });
  assert.equal(p.impossivel, false);
  // (5+1)/(1-0.5) = 12
  assert.ok(Math.abs(p.precoVenda - 12) < 1e-9);
  assert.ok(Math.abs(p.lucroUn - 3.6) < 1e-9);
  ok("preço = (custo+emb)/(1-somaPct/100)");
}

{
  const p = calcularPreco({
    custoPorcao: 5,
    embalagem: 0,
    taxasPct: 40,
    fixosPct: 30,
    lucroPct: 30,
  });
  assert.equal(p.impossivel, true);
  assert.ok(p.alerta);
  ok("somaPct ≥ 100 → alerta de preço impossível");
}

{
  const val = dataValidade("2026-07-21", 3);
  assert.equal(val.toISOString().slice(0, 10), "2026-07-24");
  ok("validade = fabricação + dias");
}

{
  const r = resumoFicha({
    rendimento: 10,
    unidade: "porções",
    validadeDias: 2,
    ingredientes: [
      {
        nome: "Açúcar",
        qtdCompra: 1,
        unidadeCompra: "kg",
        precoCompra: 5,
        qtdUso: 200,
        unidadeUso: "g",
      },
    ],
    preco: { embalagem: 0.5, taxasPct: 0, fixosPct: 0, lucroPct: 50 },
  });
  assert.ok(Math.abs(r.custoTotal - 1) < 1e-9);
  assert.ok(Math.abs(r.custoPorcao - 0.1) < 1e-9);
  assert.equal(r.precificacao.impossivel, false);
  // (0.1+0.5)/(1-0.5) = 1.2
  assert.ok(Math.abs(r.precificacao.precoVenda - 1.2) < 1e-9);
  ok("resumoFicha integra custo + precificação");
}

console.log(`\n${passou} testes ok.`);
