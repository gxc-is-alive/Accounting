/**
 * 投资计算属性测试
 *
 * Feature: investment-tracking
 * Property 2: 加权平均成本计算
 * Property 5: 盈亏计算一致性
 *
 * Validates: Requirements 2.1, 3.3, 4.1, 4.2
 */

import * as fc from "fast-check";
import {
  calculateNewCostPrice,
  calculateRealizedProfit,
  calculateMarketValue,
  calculateTotalCost,
  calculateProfit,
  calculateProfitRate,
  calculateInvestmentStats,
} from "../utils/investment";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成有效的份额 (0.0001 到 100000，保留四位小数)
const sharesArbitrary = fc
  .integer({ min: 1, max: 1000000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的价格/净值 (0.0001 到 10000，保留四位小数)
const priceArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的金额 (0 到 1000000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 0, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

describe("投资计算属性测试", () => {
  /**
   * Property 2: 加权平均成本计算
   * 对于任意买入操作，新的成本价必须等于 (原份额 × 原成本价 + 买入份额 × 买入价格) / (原份额 + 买入份额)
   * Validates: Requirements 2.1
   */
  describe("Property 2: 加权平均成本计算", () => {
    it("对于任意买入操作，新成本价等于加权平均值", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          sharesArbitrary,
          priceArbitrary,
          (currentShares, currentCostPrice, buyShares, buyPrice) => {
            const newCostPrice = calculateNewCostPrice(
              currentShares,
              currentCostPrice,
              buyShares,
              buyPrice
            );

            // 验证加权平均公式
            const expectedTotalCost =
              currentShares * currentCostPrice + buyShares * buyPrice;
            const expectedTotalShares = currentShares + buyShares;
            const expectedCostPrice = expectedTotalCost / expectedTotalShares;

            expect(newCostPrice).toBeCloseTo(expectedCostPrice, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当原份额为 0 时，新成本价等于买入价格", () => {
      fc.assert(
        fc.property(sharesArbitrary, priceArbitrary, (buyShares, buyPrice) => {
          const newCostPrice = calculateNewCostPrice(0, 0, buyShares, buyPrice);

          expect(newCostPrice).toBeCloseTo(buyPrice, 4);
        }),
        { numRuns: 100 }
      );
    });

    it("当买入份额为 0 时，成本价保持不变", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (currentShares, currentCostPrice, buyPrice) => {
            const newCostPrice = calculateNewCostPrice(
              currentShares,
              currentCostPrice,
              0,
              buyPrice
            );

            expect(newCostPrice).toBeCloseTo(currentCostPrice, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("新成本价介于原成本价和买入价格之间", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          sharesArbitrary,
          priceArbitrary,
          (currentShares, currentCostPrice, buyShares, buyPrice) => {
            const newCostPrice = calculateNewCostPrice(
              currentShares,
              currentCostPrice,
              buyShares,
              buyPrice
            );

            const minPrice = Math.min(currentCostPrice, buyPrice);
            const maxPrice = Math.max(currentCostPrice, buyPrice);

            // 新成本价应该在两个价格之间（包含边界）
            expect(newCostPrice).toBeGreaterThanOrEqual(minPrice - 0.0001);
            expect(newCostPrice).toBeLessThanOrEqual(maxPrice + 0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: 盈亏计算一致性
   * 对于任意投资账户，盈亏金额必须等于 当前市值 - 总成本，收益率必须等于 盈亏金额 / 总成本 × 100%
   * Validates: Requirements 3.3, 4.1, 4.2
   */
  describe("Property 5: 盈亏计算一致性", () => {
    it("盈亏金额等于市值减去总成本", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (marketValue, totalCost) => {
            const profit = calculateProfit(marketValue, totalCost);

            expect(profit).toBeCloseTo(marketValue - totalCost, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("收益率等于盈亏金额除以总成本乘以100", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc
            .integer({ min: 1, max: 100000000 })
            .map((n) => Number((n / 100).toFixed(2))), // 确保总成本大于0
          (profit, totalCost) => {
            const profitRate = calculateProfitRate(profit, totalCost);
            const expectedRate = (profit / totalCost) * 100;

            expect(profitRate).toBeCloseTo(expectedRate, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当总成本为 0 时，收益率为 0", () => {
      fc.assert(
        fc.property(amountArbitrary, (profit) => {
          const profitRate = calculateProfitRate(profit, 0);

          expect(profitRate).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("市值计算等于份额乘以净值", () => {
      fc.assert(
        fc.property(sharesArbitrary, priceArbitrary, (shares, netValue) => {
          const marketValue = calculateMarketValue(shares, netValue);

          expect(marketValue).toBeCloseTo(shares * netValue, 4);
        }),
        { numRuns: 100 }
      );
    });

    it("总成本计算等于份额乘以成本价", () => {
      fc.assert(
        fc.property(sharesArbitrary, priceArbitrary, (shares, costPrice) => {
          const totalCost = calculateTotalCost(shares, costPrice);

          expect(totalCost).toBeCloseTo(shares * costPrice, 4);
        }),
        { numRuns: 100 }
      );
    });

    it("完整统计信息计算一致性", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (shares, costPrice, netValue) => {
            const stats = calculateInvestmentStats(shares, costPrice, netValue);

            // 验证各项计算
            const expectedTotalCost = shares * costPrice;
            const expectedMarketValue = shares * netValue;
            const expectedProfit = expectedMarketValue - expectedTotalCost;
            const expectedProfitRate =
              expectedTotalCost > 0
                ? (expectedProfit / expectedTotalCost) * 100
                : 0;

            expect(stats.totalCost).toBeCloseTo(expectedTotalCost, 0);
            expect(stats.marketValue).toBeCloseTo(expectedMarketValue, 0);
            expect(stats.profit).toBeCloseTo(expectedProfit, 0);
            expect(stats.profitRate).toBeCloseTo(expectedProfitRate, 0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 卖出盈亏计算测试
   * Validates: Requirements 2.2
   */
  describe("卖出盈亏计算", () => {
    it("卖出盈亏等于卖出份额乘以(卖出价格减成本价)", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (sellShares, sellPrice, costPrice) => {
            const realizedProfit = calculateRealizedProfit(
              sellShares,
              sellPrice,
              costPrice
            );

            const expected = sellShares * (sellPrice - costPrice);
            expect(realizedProfit).toBeCloseTo(expected, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当卖出价格等于成本价时，盈亏为 0", () => {
      fc.assert(
        fc.property(sharesArbitrary, priceArbitrary, (sellShares, price) => {
          const realizedProfit = calculateRealizedProfit(
            sellShares,
            price,
            price
          );

          expect(realizedProfit).toBeCloseTo(0, 4);
        }),
        { numRuns: 100 }
      );
    });

    it("当卖出价格高于成本价时，盈亏为正", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          priceArbitrary,
          fc.integer({ min: 1, max: 10000 }).map((n) => n / 10000),
          (sellShares, costPrice, priceIncrease) => {
            const sellPrice = costPrice + priceIncrease;
            const realizedProfit = calculateRealizedProfit(
              sellShares,
              sellPrice,
              costPrice
            );

            expect(realizedProfit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当卖出价格低于成本价时，盈亏为负", () => {
      fc.assert(
        fc.property(
          sharesArbitrary,
          fc
            .integer({ min: 2, max: 100000000 })
            .map((n) => Number((n / 10000).toFixed(4))),
          fc.integer({ min: 1, max: 10000 }).map((n) => n / 10000),
          (sellShares, costPrice, priceDecrease) => {
            const sellPrice = Math.max(0.0001, costPrice - priceDecrease);
            if (sellPrice < costPrice) {
              const realizedProfit = calculateRealizedProfit(
                sellShares,
                sellPrice,
                costPrice
              );

              expect(realizedProfit).toBeLessThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
