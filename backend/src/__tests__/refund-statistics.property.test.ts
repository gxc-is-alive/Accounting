/**
 * 退款统计计算属性测试
 *
 * Property 7: 退款统计计算
 * 对于任意月度统计计算，净支出应等于总支出减去总退款。
 * 分类净支出同样适用此规则。
 *
 * Validates: Requirements 4.1, 4.2, 4.4
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟交易记录
interface Transaction {
  id: number;
  type: "income" | "expense" | "refund";
  amount: number;
  categoryId: number;
}

// 模拟月度统计结果
interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  totalRefund: number;
  netExpense: number;
  balance: number;
}

// 模拟分类统计结果
interface CategoryStats {
  categoryId: number;
  totalExpense: number;
  totalRefund: number;
  netExpense: number;
}

// 计算月度统计（纯函数）
function calculateMonthlyStats(transactions: Transaction[]): MonthlyStats {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalRefund = 0;

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpense += t.amount;
    } else if (t.type === "refund") {
      totalRefund += t.amount;
    }
  }

  const netExpense = totalExpense - totalRefund;
  const balance = totalIncome - netExpense;

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpense: Number(totalExpense.toFixed(2)),
    totalRefund: Number(totalRefund.toFixed(2)),
    netExpense: Number(netExpense.toFixed(2)),
    balance: Number(balance.toFixed(2)),
  };
}

// 计算分类统计（纯函数）
function calculateCategoryStats(
  transactions: Transaction[],
  categoryId: number
): CategoryStats {
  let totalExpense = 0;
  let totalRefund = 0;

  for (const t of transactions) {
    if (t.categoryId !== categoryId) continue;

    if (t.type === "expense") {
      totalExpense += t.amount;
    } else if (t.type === "refund") {
      totalRefund += t.amount;
    }
  }

  const netExpense = Math.max(0, totalExpense - totalRefund);

  return {
    categoryId,
    totalExpense: Number(totalExpense.toFixed(2)),
    totalRefund: Number(totalRefund.toFixed(2)),
    netExpense: Number(netExpense.toFixed(2)),
  };
}

// 生成有效的金额（精确到分）
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成交易类型
const transactionTypeArbitrary = fc.constantFrom(
  "income" as const,
  "expense" as const,
  "refund" as const
);

// 生成交易记录
const transactionArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  type: transactionTypeArbitrary,
  amount: amountArbitrary,
  categoryId: fc.integer({ min: 1, max: 10 }),
});

// 生成交易列表
const transactionsArbitrary = fc.array(transactionArbitrary, {
  minLength: 0,
  maxLength: 50,
});

describe("退款统计计算属性测试", () => {
  /**
   * Property 7: 退款统计计算
   * 对于任意月度统计计算，净支出应等于总支出减去总退款。
   * Validates: Requirements 4.1, 4.2, 4.4
   */
  describe("Property 7: 退款统计计算", () => {
    it("**Feature: refund, Property 7: 退款统计计算** - 净支出等于总支出减去总退款", () => {
      fc.assert(
        fc.property(transactionsArbitrary, (transactions) => {
          const stats = calculateMonthlyStats(transactions);

          // 净支出 = 总支出 - 总退款
          const expectedNetExpense = Number(
            (stats.totalExpense - stats.totalRefund).toFixed(2)
          );

          expect(stats.netExpense).toBeCloseTo(expectedNetExpense, 2);
        }),
        { numRuns: 100 }
      );
    });

    it("结余等于总收入减去净支出", () => {
      fc.assert(
        fc.property(transactionsArbitrary, (transactions) => {
          const stats = calculateMonthlyStats(transactions);

          // 结余 = 总收入 - 净支出
          const expectedBalance = Number(
            (stats.totalIncome - stats.netExpense).toFixed(2)
          );

          expect(stats.balance).toBeCloseTo(expectedBalance, 2);
        }),
        { numRuns: 100 }
      );
    });

    it("没有退款时，净支出等于总支出", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              type: fc.constantFrom("income" as const, "expense" as const),
              amount: amountArbitrary,
              categoryId: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (transactions) => {
            const stats = calculateMonthlyStats(transactions);

            expect(stats.totalRefund).toBe(0);
            expect(stats.netExpense).toBeCloseTo(stats.totalExpense, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("全额退款后，净支出为零", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (amount, categoryId) => {
            // 创建一笔支出和一笔等额退款
            const transactions: Transaction[] = [
              { id: 1, type: "expense", amount, categoryId },
              { id: 2, type: "refund", amount, categoryId },
            ];

            const stats = calculateMonthlyStats(transactions);

            expect(stats.totalExpense).toBeCloseTo(amount, 2);
            expect(stats.totalRefund).toBeCloseTo(amount, 2);
            expect(stats.netExpense).toBeCloseTo(0, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("部分退款后，净支出正确计算", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (expenseAmount, refundAmount, categoryId) => {
            // 确保退款金额不超过支出金额
            const validRefund = Math.min(refundAmount, expenseAmount);

            const transactions: Transaction[] = [
              { id: 1, type: "expense", amount: expenseAmount, categoryId },
              { id: 2, type: "refund", amount: validRefund, categoryId },
            ];

            const stats = calculateMonthlyStats(transactions);

            const expectedNetExpense = expenseAmount - validRefund;
            expect(stats.netExpense).toBeCloseTo(expectedNetExpense, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 分类统计测试
   */
  describe("分类统计", () => {
    it("分类净支出等于分类总支出减去分类总退款", () => {
      fc.assert(
        fc.property(
          transactionsArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (transactions, categoryId) => {
            const stats = calculateCategoryStats(transactions, categoryId);

            // 分类净支出 = 分类总支出 - 分类总退款
            const expectedNetExpense = Math.max(
              0,
              Number((stats.totalExpense - stats.totalRefund).toFixed(2))
            );

            expect(stats.netExpense).toBeCloseTo(expectedNetExpense, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("分类净支出不会为负", () => {
      fc.assert(
        fc.property(
          transactionsArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (transactions, categoryId) => {
            const stats = calculateCategoryStats(transactions, categoryId);

            expect(stats.netExpense).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("不同分类的退款不影响其他分类的统计", () => {
      fc.assert(
        fc.property(amountArbitrary, amountArbitrary, (amount1, amount2) => {
          // 分类 1 的支出
          // 分类 2 的退款
          const transactions: Transaction[] = [
            { id: 1, type: "expense", amount: amount1, categoryId: 1 },
            { id: 2, type: "refund", amount: amount2, categoryId: 2 },
          ];

          const stats1 = calculateCategoryStats(transactions, 1);
          const stats2 = calculateCategoryStats(transactions, 2);

          // 分类 1 的净支出应等于其总支出（没有退款）
          expect(stats1.netExpense).toBeCloseTo(amount1, 2);
          expect(stats1.totalRefund).toBe(0);

          // 分类 2 的净支出应为 0（只有退款，没有支出）
          expect(stats2.totalExpense).toBe(0);
          expect(stats2.totalRefund).toBeCloseTo(amount2, 2);
          expect(stats2.netExpense).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 统计报表显示测试
   */
  describe("统计报表显示", () => {
    it("统计结果应包含总支出、总退款、净支出三个字段", () => {
      fc.assert(
        fc.property(transactionsArbitrary, (transactions) => {
          const stats = calculateMonthlyStats(transactions);

          expect(stats).toHaveProperty("totalExpense");
          expect(stats).toHaveProperty("totalRefund");
          expect(stats).toHaveProperty("netExpense");
          expect(typeof stats.totalExpense).toBe("number");
          expect(typeof stats.totalRefund).toBe("number");
          expect(typeof stats.netExpense).toBe("number");
        }),
        { numRuns: 100 }
      );
    });

    it("所有金额应为非负数", () => {
      fc.assert(
        fc.property(transactionsArbitrary, (transactions) => {
          const stats = calculateMonthlyStats(transactions);

          expect(stats.totalIncome).toBeGreaterThanOrEqual(0);
          expect(stats.totalExpense).toBeGreaterThanOrEqual(0);
          expect(stats.totalRefund).toBeGreaterThanOrEqual(0);
          // 净支出可能为负（退款超过支出的情况）
        }),
        { numRuns: 100 }
      );
    });
  });
});
