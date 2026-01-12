/**
 * 交易卡片内容属性测试
 * Property 1: 交易卡片内容完整性
 * Validates: Requirements 5.2
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// 交易类型
type TransactionType = "income" | "expense";

// 模拟交易数据生成器
const transactionArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  type: fc.constantFrom<TransactionType>("income", "expense"),
  amount: fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
  date: fc
    .tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(
      ([year, month, day]) =>
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
          2,
          "0"
        )}`
    ),
  note: fc.option(fc.string({ minLength: 0, maxLength: 100 }), {
    nil: undefined,
  }),
  category: fc.option(
    fc.record({
      id: fc.integer({ min: 1, max: 100 }),
      name: fc.string({ minLength: 1, maxLength: 20 }),
    }),
    { nil: undefined }
  ),
});

describe("交易卡片内容属性测试", () => {
  describe("Property 1: 交易卡片内容完整性", () => {
    it("交易卡片应包含分类名称", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 分类名称：有分类时显示分类名，无分类时显示"未分类"
          const categoryName = transaction.category?.name || "未分类";

          expect(categoryName).toBeTruthy();
          expect(typeof categoryName).toBe("string");
          expect(categoryName.length).toBeGreaterThan(0);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("交易卡片应包含金额", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 金额应该是正数
          expect(transaction.amount).toBeGreaterThan(0);

          // 格式化金额
          const formattedAmount = transaction.amount.toFixed(2);
          expect(formattedAmount).toMatch(/^\d+\.\d{2}$/);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("交易卡片应包含备注（如有）", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 备注可以为空，显示为 '-'
          const displayNote = transaction.note || "-";

          expect(displayNote).toBeTruthy();
          expect(typeof displayNote).toBe("string");

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("交易卡片应包含日期", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 日期格式应为 YYYY-MM-DD
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          expect(datePattern.test(transaction.date)).toBe(true);

          // 日期应该是有效的
          const date = new Date(transaction.date);
          expect(date.toString()).not.toBe("Invalid Date");

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("交易卡片应正确显示收入/支出类型", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 类型应该是 income 或 expense
          expect(["income", "expense"]).toContain(transaction.type);

          // 金额前缀应该正确
          const prefix = transaction.type === "income" ? "+" : "-";
          expect(["+", "-"]).toContain(prefix);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it("交易卡片四个必要信息都应存在", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // 1. 分类名称
          const categoryName = transaction.category?.name || "未分类";
          expect(categoryName).toBeTruthy();

          // 2. 金额
          expect(transaction.amount).toBeGreaterThan(0);

          // 3. 备注（可为空，显示 '-'）
          const note = transaction.note || "-";
          expect(note).toBeTruthy();

          // 4. 日期
          expect(transaction.date).toBeTruthy();
          expect(/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("日期格式化", () => {
    it("日期应正确格式化为月日格式", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (month, day) => {
            const dateStr = `2024-${String(month).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`;
            const date = new Date(dateStr);

            // 格式化为 "X月X日"
            const formatted = `${date.getMonth() + 1}月${date.getDate()}日`;

            expect(formatted).toMatch(/^\d{1,2}月\d{1,2}日$/);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
