/**
 * 投资计算工具函数
 * 用于计算投资账户的成本、市值、盈亏等
 */

/**
 * 计算加权平均成本价（买入时）
 * @param currentShares 当前持仓份额
 * @param currentCostPrice 当前成本价
 * @param buyShares 买入份额
 * @param buyPrice 买入价格
 * @returns 新的成本价
 */
export function calculateNewCostPrice(
  currentShares: number,
  currentCostPrice: number,
  buyShares: number,
  buyPrice: number
): number {
  const totalCost =
    Number(currentShares) * Number(currentCostPrice) +
    Number(buyShares) * Number(buyPrice);
  const totalShares = Number(currentShares) + Number(buyShares);
  return totalShares > 0 ? totalCost / totalShares : 0;
}

/**
 * 计算卖出实现盈亏
 * @param sellShares 卖出份额
 * @param sellPrice 卖出价格
 * @param costPrice 成本价
 * @returns 实现盈亏金额
 */
export function calculateRealizedProfit(
  sellShares: number,
  sellPrice: number,
  costPrice: number
): number {
  return Number(sellShares) * (Number(sellPrice) - Number(costPrice));
}

/**
 * 计算市值
 * @param shares 持仓份额
 * @param netValue 当前净值
 * @returns 市值
 */
export function calculateMarketValue(shares: number, netValue: number): number {
  return Number(shares) * Number(netValue);
}

/**
 * 计算总成本
 * @param shares 持仓份额
 * @param costPrice 成本价
 * @returns 总成本
 */
export function calculateTotalCost(shares: number, costPrice: number): number {
  return Number(shares) * Number(costPrice);
}

/**
 * 计算盈亏金额
 * @param marketValue 当前市值
 * @param totalCost 总成本
 * @returns 盈亏金额
 */
export function calculateProfit(
  marketValue: number,
  totalCost: number
): number {
  return Number(marketValue) - Number(totalCost);
}

/**
 * 计算收益率（百分比）
 * @param profit 盈亏金额
 * @param totalCost 总成本
 * @returns 收益率（百分比，如 10.5 表示 10.5%）
 */
export function calculateProfitRate(profit: number, totalCost: number): number {
  return Number(totalCost) > 0 ? (Number(profit) / Number(totalCost)) * 100 : 0;
}

/**
 * 计算投资账户完整统计信息
 * @param shares 持仓份额
 * @param costPrice 成本价
 * @param netValue 当前净值
 * @returns 完整统计信息
 */
export function calculateInvestmentStats(
  shares: number,
  costPrice: number,
  netValue: number
): {
  totalCost: number;
  marketValue: number;
  profit: number;
  profitRate: number;
} {
  const totalCost = calculateTotalCost(shares, costPrice);
  const marketValue = calculateMarketValue(shares, netValue);
  const profit = calculateProfit(marketValue, totalCost);
  const profitRate = calculateProfitRate(profit, totalCost);

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    marketValue: Math.round(marketValue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitRate: Math.round(profitRate * 100) / 100,
  };
}
