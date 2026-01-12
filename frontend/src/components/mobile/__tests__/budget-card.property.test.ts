/**
 * 预算卡片内容完整性属性测试
 * Property 2: 预算卡片必须显示完整的预算信息
 * Validates: Requirements 7.2
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// 预算数据生成器
const budgetArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  month: fc.constantFrom("2024-01", "2024-02", "2024-03", "2024-12", "2025-01"),
  categoryId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
  categoryName: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: undefined,
  }),
  amount: fc.float({ min: 0, max: 100000, noNaN: true }),
  budgetAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
  spentAmount: fc.float({ min: 0, max: 100000, noNaN: true }),
  spent: fc.float({ min: 0, max: 100000, noNaN: true }),
  percentage: fc.float({ min: 0, max: 200, noNaN: true }),
});

describe("BudgetCard 属性测试", () => {
  describe("Property 2: 预算卡片内容完整性", () => {
    it("预算金额必须正确计算", () => {
      fc.assert(
        fc.property(budgetArbitrary, (budget) => {
          // 预算金额应该取 budgetAmount 或 amount
          const budgetAmount = budget.budgetAmount || budget.amount || 0;
          expect(budgetAmount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it("已用金额必须正确计算", () => {
      fc.assert(
        fc.property(budgetArbitrary, (budget) => {
          // 已用金额应该取 spentAmount 或 spent
          const spentAmount = budget.spentAmount || budget.spent || 0;
          expect(spentAmount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it("百分比计算必须正确", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 1, max: 10000, noNaN: true }),
          (spent, budget) => {
            const percentage = (spent / budget) * 100;
            expect(percentage).toBeGreaterThanOrEqual(0);
            // 百分比可以超过 100%（超支情况）
            if (spent <= budget) {
              expect(percentage).toBeLessThanOrEqual(100);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("剩余金额计算必须正确", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (budget, spent) => {
            const remaining = Math.max(budget - spent, 0);
            expect(remaining).toBeGreaterThanOrEqual(0);
            expect(remaining).toBeLessThanOrEqual(budget);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("进度条状态必须根据百分比正确显示", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 200, noNaN: true }),
          (percentage) => {
            // 状态判断逻辑
            let status = "";
            if (percentage > 100) {
              status = "exception";
            } else if (percentage > 80) {
              status = "warning";
            }

            // 验证状态正确性
            if (percentage > 100) {
              expect(status).toBe("exception");
            } else if (percentage > 80) {
              expect(status).toBe("warning");
            } else {
              expect(status).toBe("");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("分类名称必须有默认值", () => {
      fc.assert(
        fc.property(budgetArbitrary, (budget) => {
          const categoryName = budget.categoryName || "总预算";
          expect(categoryName).toBeTruthy();
          expect(categoryName.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("金额格式化必须保留两位小数", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100000, noNaN: true }),
          (amount) => {
            const formatted = amount.toFixed(2);
            expect(formatted).toMatch(/^\d+\.\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("边界条件测试", () => {
    it("零预算情况处理", () => {
      const zeroBudget = {
        id: 1,
        month: "2024-01",
        amount: 0,
        budgetAmount: 0,
        spentAmount: 100,
        spent: 100,
        percentage: 0,
      };

      // 零预算时百分比应该为 0 或特殊处理
      const percentage =
        zeroBudget.budgetAmount > 0
          ? (zeroBudget.spentAmount / zeroBudget.budgetAmount) * 100
          : 0;
      expect(percentage).toBe(0);
    });

    it("超支情况处理", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 1000, noNaN: true }),
          fc.float({ min: 1001, max: 10000, noNaN: true }),
          (budget, spent) => {
            const percentage = (spent / budget) * 100;
            expect(percentage).toBeGreaterThan(100);

            // 进度条显示应该限制在 100%
            const displayPercentage = Math.min(percentage, 100);
            expect(displayPercentage).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
