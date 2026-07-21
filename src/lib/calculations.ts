// DeliveryHub — cálculos de custo e precificação

export type ItemCusto = {
  quantidade: number;
  perdaPercentual: number;
  custoUnitario: number;
};

export type ParametrosPrecificacao = {
  custoEmbalagem: number;
  custoMaoDeObra: number;
  custoOperacional: number;
  margemPercentual: number;
  impostosPercentual: number;
  taxaDelivery: number;
};

/** Custo efetivo de um item considerando perda/quebra */
export function custoItem(item: ItemCusto): number {
  const fator = 1 + (item.perdaPercentual || 0) / 100;
  return item.quantidade * fator * item.custoUnitario;
}

/** Custo total dos insumos de uma ficha */
export function custoInsumos(itens: ItemCusto[]): number {
  return itens.reduce((acc, item) => acc + custoItem(item), 0);
}

/** Custo por porção / unidade de rendimento */
export function custoPorPorcao(custoTotal: number, rendimento: number): number {
  if (!rendimento || rendimento <= 0) return 0;
  return custoTotal / rendimento;
}

export type ResultadoPrecificacao = {
  custoInsumos: number;
  custoAdicional: number;
  custoTotal: number;
  custoPorPorcao: number;
  precoSugerido: number;
  margemSobrePreco: number;
  lucroEstimado: number;
};

/** Calcula precificação completa a partir dos insumos e parâmetros */
export function calcularPrecificacao(
  itens: ItemCusto[],
  rendimento: number,
  params: ParametrosPrecificacao
): ResultadoPrecificacao {
  const insumos = custoInsumos(itens);
  const adicional =
    (params.custoEmbalagem || 0) +
    (params.custoMaoDeObra || 0) +
    (params.custoOperacional || 0);
  const total = insumos + adicional;
  const porPorcao = custoPorPorcao(total, rendimento);

  const margem = (params.margemPercentual || 0) / 100;
  const impostos = (params.impostosPercentual || 0) / 100;
  const taxa = params.taxaDelivery || 0;

  // Preço = (custo / (1 - margem - impostos)) + taxa delivery
  const denominador = 1 - margem - impostos;
  const base =
    denominador > 0.01 ? porPorcao / denominador : porPorcao * (1 + margem);
  const sugerido = base + taxa;
  const lucro = sugerido - porPorcao - taxa;
  const margemSobrePreco = sugerido > 0 ? (lucro / sugerido) * 100 : 0;

  return {
    custoInsumos: insumos,
    custoAdicional: adicional,
    custoTotal: total,
    custoPorPorcao: porPorcao,
    precoSugerido: sugerido,
    margemSobrePreco,
    lucroEstimado: lucro,
  };
}
