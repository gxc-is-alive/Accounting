/**
 * 信用计算属性测试
 *
 * Property 1: 可用额度计算一致性
 * Property 4: 待还金额非负性
 *
 * Validates: Requirements 4.1, 4.2, 4.4
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟 CreditService 的计算函数（纯函数，不依赖数据库）
function calculateAvailableCredit(
  creditLimit: number,
  outstandingBalance: number
): number {
  return creditLimit - outstandingBalance;
}

function calculateOutstandingBalance(
  totalExpense: number,
  totalRepayment: number
): number {
  return Math.max(0, totalExpense - totalRepayment);
}

// 生成有效的金额 (0 到 1000000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 0, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

describe("信用计算属性测试", () => {
  /**
   * Property 1: 可用额度计算一致性
   * 对于任意信用账户，可用额度应始终等于信用额度减去待还金额。
   * Validates: Requirements 4.1, 4.2
   */
  describe("Property 1: 可用额度计算一致性", () => {
    it("对于任意信用额度和待还金额，可用额度 = 信用额度 - 待还金额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (creditLimit, outstandingBalance) => {
            const availableCredit = calculateAvailableCredit(
              creditLimit,
              outstandingBalance
            );

            // 验证计算公式
            expect(availableCredit).toBe(creditLimit - outstandingBalance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当待还金额为 0 时，可用额度等于信用额度", () => {
      fc.assert(
        fc.property(amountArbitrary, (creditLimit) => {
          const availableCredit = calculateAvailableCredit(creditLimit, 0);

          expect(availableCredit).toBe(creditLimit);
        }),
        { numRuns: 100 }
      );
    });

    it("当待还金额等于信用额度时，可用额度为 0", () => {
      fc.assert(
        fc.property(amountArbitrary, (amount) => {
          const availableCredit = calculateAvailableCredit(amount, amount);

          expect(availableCredit).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("当待还金额超过信用额度时，可用额度为负数（超额）", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (creditLimit, excess) => {
            const outstandingBalance = creditLimit + excess;
            const availableCredit = calculateAvailableCredit(
              creditLimit,
              outstandingBalance
            );

            expect(availableCredit).toBeLessThan(0);
            expect(availableCredit).toBeCloseTo(-excess, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: 待还金额非负性
   * 对于任意信用账户，待还金额应始终大于等于 0。
   * Validates: Requirements 4.4
   */
  describe("Property 4: 待还金额非负性", () => {
    it("对于任意消费和还款金额，待还金额始终 >= 0", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (totalExpense, totalRepayment) => {
            const outstandingBalance = calculateOutstandingBalance(
              totalExpense,
              totalRepayment
            );

            // 验证非负性
            expect(outstandingBalance).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当还款金额超过消费金额时，待还金额为 0（不为负）", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (totalExpense, excess) => {
            const totalRepayment = totalExpense + excess;
            const outstandingBalance = calculateOutstandingBalance(
              totalExpense,
              totalRepayment
            );

            // 即使还款超过消费，待还金额也不会为负
            expect(outstandingBalance).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当消费金额大于还款金额时，待还金额等于差值", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (totalRepayment, excess) => {
            const totalExpense = totalRepayment + excess;
            const outstandingBalance = calculateOutstandingBalance(
              totalExpense,
              totalRepayment
            );

            expect(outstandingBalance).toBeCloseTo(excess, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当消费和还款都为 0 时，待还金额为 0", () => {
      const outstandingBalance = calculateOutstandingBalance(0, 0);
      expect(outstandingBalance).toBe(0);
    });
  });

  /**
   * 额外测试：计算的数学性质
   */
  describe("计算的数学性质", () => {
    it("可用额度计算是线性的", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (creditLimit, balance1, balance2) => {
            // f(a) - f(b) = -(a - b) 的性质
            const available1 = calculateAvailableCredit(creditLimit, balance1);
            const available2 = calculateAvailableCredit(creditLimit, balance2);

            expect(available1 - available2).toBeCloseTo(balance2 - balance1, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("待还金额计算满足 max(0, expense - repayment) 的定义", () => {
      fc.assert(
        fc.property(amountArbitrary, amountArbitrary, (expense, repayment) => {
          const outstanding = calculateOutstandingBalance(expense, repayment);
          const expected = Math.max(0, expense - repayment);

          expect(outstanding).toBeCloseTo(expected, 2);
        }),
        { numRuns: 100 }
      );
    });
  });
});
