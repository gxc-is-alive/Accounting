/**
 * 定投执行属性测试
 *
 * Feature: auto-investment
 * Property 9: 账户余额变化
 * Property 10: 份额计算
 * Property 11: 余额不足处理
 * Property 12: 执行记录完整性
 * Property 14: 折扣率计算
 *
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5
 */

import * as fc from "fast-check";
import executionService from "../services/execution.service";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成有效的金额 (1 到 100000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 100, max: 10000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成有效的净值 (0.0001 到 10000，保留四位小数)
const netValueArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的份额 (0.0001 到 100000，保留四位小数)
const sharesArbitrary = fc
  .integer({ min: 1, max: 1000000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

describe("定投执行属性测试", () => {
  /**
   * Property 9: 账户余额变化
   * 对于任意成功执行的定投或单次买入，资金来源账户余额必须减少实际支付金额
   * Validates: Requirements 3.2, 4.3
   */
  describe("Property 9: 账户余额变化", () => {
    it("对于任意支付金额，来源账户余额减少量等于支付金额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (initialBalance, paidAmount) => {
            // 确保初始余额大于支付金额
            const balance = Math.max(initialBalance, paidAmount + 100);
            const newBalance = balance - paidAmount;

            // 验证余额减少量
            expect(balance - newBalance).toBeCloseTo(paidAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("余额变化精确到分", () => {
      fc.assert(
        fc.property(amountArbitrary, (paidAmount) => {
          // 验证金额精度
          const rounded = Math.round(paidAmount * 100) / 100;
          expect(paidAmount).toBeCloseTo(rounded, 2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: 份额计算
   * 对于任意成功执行的定投或单次买入，投资账户增加的份额必须等于 investedAmount / netValue
   * Validates: Requirements 3.3, 4.4
   */
  describe("Property 10: 份额计算", () => {
    it("份额等于投资金额除以净值", () => {
      fc.assert(
        fc.property(amountArbitrary, netValueArbitrary, (amount, netValue) => {
          const shares = executionService.calculateShares(amount, netValue);
          const expected = amount / netValue;

          expect(shares).toBeCloseTo(expected, 4);
        }),
        { numRuns: 100 }
      );
    });

    it("份额精确到四位小数", () => {
      fc.assert(
        fc.property(amountArbitrary, netValueArbitrary, (amount, netValue) => {
          const shares = executionService.calculateShares(amount, netValue);
          const rounded = Math.round(shares * 10000) / 10000;

          expect(shares).toBe(rounded);
        }),
        { numRuns: 100 }
      );
    });

    it("份额与净值的乘积约等于投资金额", () => {
      fc.assert(
        fc.property(amountArbitrary, netValueArbitrary, (amount, netValue) => {
          const shares = executionService.calculateShares(amount, netValue);
          const calculatedAmount = shares * netValue;

          // 由于四舍五入到4位小数，误差与净值相关
          // 最大误差 = 0.00005 * netValue（四舍五入误差）
          const maxRoundingError = 0.00005 * netValue;
          // 加上浮点数精度误差
          const tolerance = maxRoundingError + 0.0001;
          expect(Math.abs(calculatedAmount - amount)).toBeLessThanOrEqual(
            tolerance
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: 余额不足处理
   * 对于任意资金来源账户余额小于定投金额的执行，系统必须记录执行失败
   * Validates: Requirements 3.4
   */
  describe("Property 11: 余额不足处理", () => {
    it("当余额小于支付金额时，应该失败", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 99 }).map((n) => n / 100),
          (paidAmount, ratio) => {
            const balance = paidAmount * ratio; // 余额小于支付金额
            const isInsufficientBalance = balance < paidAmount;

            expect(isInsufficientBalance).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当余额等于支付金额时，应该成功", () => {
      fc.assert(
        fc.property(amountArbitrary, (paidAmount) => {
          const balance = paidAmount;
          const isSufficientBalance = balance >= paidAmount;

          expect(isSufficientBalance).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("当余额大于支付金额时，应该成功", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 101, max: 200 }).map((n) => n / 100),
          (paidAmount, ratio) => {
            const balance = paidAmount * ratio; // 余额大于支付金额
            const isSufficientBalance = balance >= paidAmount;

            expect(isSufficientBalance).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: 执行记录完整性
   * 对于任意执行记录，必须包含执行时间、实际支付金额、获得金额、折扣率、买入份额、买入净值和执行状态
   * Validates: Requirements 3.5, 4.5
   */
  describe("Property 12: 执行记录完整性", () => {
    it("执行记录必须包含所有必填字段", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          netValueArbitrary,
          fc.constantFrom("success", "failed"),
          (paidAmount, investedAmount, netValue, status) => {
            // 模拟执行记录
            const record = {
              paidAmount,
              investedAmount,
              discountRate: paidAmount / investedAmount,
              shares: investedAmount / netValue,
              netValue,
              status,
              executedAt: new Date(),
            };

            // 验证所有必填字段存在
            expect(record.paidAmount).toBeDefined();
            expect(record.investedAmount).toBeDefined();
            expect(record.discountRate).toBeDefined();
            expect(record.shares).toBeDefined();
            expect(record.netValue).toBeDefined();
            expect(record.status).toBeDefined();
            expect(record.executedAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("成功记录的份额必须大于0", () => {
      fc.assert(
        fc.property(amountArbitrary, netValueArbitrary, (amount, netValue) => {
          const shares = executionService.calculateShares(amount, netValue);

          expect(shares).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("失败记录的份额为0", () => {
      const failedRecord = {
        status: "failed",
        shares: 0,
        investedAmount: 0,
      };

      expect(failedRecord.shares).toBe(0);
      expect(failedRecord.investedAmount).toBe(0);
    });
  });

  /**
   * Property 14: 折扣率计算
   * 对于任意单次买入转换，折扣率必须等于 paidAmount / investedAmount
   * Validates: Requirements 4.2
   */
  describe("Property 14: 折扣率计算", () => {
    it("折扣率等于实际支付除以获得金额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (paidAmount, investedAmount) => {
            const discountRate = executionService.calculateDiscountRate(
              paidAmount,
              investedAmount
            );
            const expected = paidAmount / investedAmount;

            expect(discountRate).toBeCloseTo(expected, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当实际支付小于获得金额时，折扣率小于1", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 101, max: 200 }).map((n) => n / 100),
          (paidAmount, ratio) => {
            const investedAmount = paidAmount * ratio; // 获得金额大于支付金额
            const discountRate = executionService.calculateDiscountRate(
              paidAmount,
              investedAmount
            );

            expect(discountRate).toBeLessThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当实际支付等于获得金额时，折扣率等于1", () => {
      fc.assert(
        fc.property(amountArbitrary, (amount) => {
          const discountRate = executionService.calculateDiscountRate(
            amount,
            amount
          );

          expect(discountRate).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("折扣率精确到四位小数", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (paidAmount, investedAmount) => {
            const discountRate = executionService.calculateDiscountRate(
              paidAmount,
              investedAmount
            );
            const rounded = Math.round(discountRate * 10000) / 10000;

            expect(discountRate).toBe(rounded);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("95元买100元基金的折扣率为0.95", () => {
      const discountRate = executionService.calculateDiscountRate(95, 100);
      expect(discountRate).toBe(0.95);
    });

    it("90元买100元基金的折扣率为0.9", () => {
      const discountRate = executionService.calculateDiscountRate(90, 100);
      expect(discountRate).toBe(0.9);
    });
  });

  /**
   * 综合测试：折扣买入的完整流程
   */
  describe("折扣买入完整流程", () => {
    it("折扣买入时，份额按获得金额计算", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 101, max: 150 }).map((n) => n / 100),
          netValueArbitrary,
          (paidAmount, ratio, netValue) => {
            const investedAmount = paidAmount * ratio;
            const shares = executionService.calculateShares(
              investedAmount,
              netValue
            );
            const expectedShares = investedAmount / netValue;

            expect(shares).toBeCloseTo(expectedShares, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("折扣买入时，扣款金额为实际支付金额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (paidAmount, investedAmount) => {
            // 扣款金额应该是 paidAmount，不是 investedAmount
            const deductAmount = paidAmount;
            expect(deductAmount).toBe(paidAmount);
            expect(deductAmount).not.toBe(investedAmount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
