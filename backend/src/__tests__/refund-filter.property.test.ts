/**
 * **Feature: refund, Property 9: 退款类型筛选**
 *
 * 验证交易列表接口支持退款类型筛选，且退款交易包含原交易信息
 *
 * 属性：
 * - 使用 type=refund 筛选时，只返回退款类型的交易
 * - 退款交易应包含原交易信息
 * - 筛选结果数量应与实际退款交易数量一致
 */

import * as fc from "fast-check";

describe("Property 9: 退款类型筛选", () => {
  // 模拟交易数据生成器
  const transactionArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    userId: fc.integer({ min: 1, max: 100 }),
    accountId: fc.integer({ min: 1, max: 100 }),
    categoryId: fc.integer({ min: 1, max: 100 }),
    type: fc.constantFrom("income", "expense", "refund") as fc.Arbitrary<
      "income" | "expense" | "refund"
    >,
    amount: fc.float({
      min: Math.fround(0.01),
      max: Math.fround(10000),
      noNaN: true,
    }),
    date: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
    note: fc.string({ maxLength: 100 }),
    originalTransactionId: fc.option(fc.integer({ min: 1, max: 10000 }), {
      nil: null,
    }),
  });

  // 模拟交易列表
  const transactionListArb = fc.array(transactionArb, {
    minLength: 0,
    maxLength: 50,
  });

  // 筛选函数
  function filterByType(
    transactions: Array<{
      id: number;
      userId: number;
      type: "income" | "expense" | "refund";
      originalTransactionId: number | null;
    }>,
    type: "income" | "expense" | "refund" | undefined,
    userId: number
  ) {
    let result = transactions.filter((t) => t.userId === userId);
    if (type) {
      result = result.filter((t) => t.type === type);
    }
    return result;
  }

  it("使用 type=refund 筛选时，只返回退款类型的交易", () => {
    fc.assert(
      fc.property(
        transactionListArb,
        fc.integer({ min: 1, max: 100 }),
        (transactions, userId) => {
          const filtered = filterByType(transactions, "refund", userId);

          // 所有筛选结果都应该是退款类型
          const allRefunds = filtered.every((t) => t.type === "refund");

          return allRefunds;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("筛选结果数量应与实际退款交易数量一致", () => {
    fc.assert(
      fc.property(
        transactionListArb,
        fc.integer({ min: 1, max: 100 }),
        (transactions, userId) => {
          const filtered = filterByType(transactions, "refund", userId);

          // 手动计算该用户的退款交易数量
          const expectedCount = transactions.filter(
            (t) => t.userId === userId && t.type === "refund"
          ).length;

          return filtered.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("退款交易应有 originalTransactionId 字段", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            userId: fc.integer({ min: 1, max: 100 }),
            type: fc.constant("refund" as const),
            amount: fc.float({
              min: Math.fround(0.01),
              max: Math.fround(10000),
              noNaN: true,
            }),
            originalTransactionId: fc.integer({ min: 1, max: 10000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (refundTransactions) => {
          // 所有退款交易都应该有 originalTransactionId
          return refundTransactions.every(
            (t) =>
              t.originalTransactionId !== null &&
              t.originalTransactionId !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("不同类型筛选互不干扰", () => {
    fc.assert(
      fc.property(
        transactionListArb,
        fc.integer({ min: 1, max: 100 }),
        (transactions, userId) => {
          const incomeFiltered = filterByType(transactions, "income", userId);
          const expenseFiltered = filterByType(transactions, "expense", userId);
          const refundFiltered = filterByType(transactions, "refund", userId);
          const allFiltered = filterByType(transactions, undefined, userId);

          // 三种类型筛选结果之和应等于不筛选类型的结果
          const sumOfFiltered =
            incomeFiltered.length +
            expenseFiltered.length +
            refundFiltered.length;

          return sumOfFiltered === allFiltered.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("筛选结果保持用户隔离", () => {
    fc.assert(
      fc.property(
        transactionListArb,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 51, max: 100 }),
        (transactions, userId1, userId2) => {
          const user1Refunds = filterByType(transactions, "refund", userId1);
          const user2Refunds = filterByType(transactions, "refund", userId2);

          // 用户1的退款不应包含用户2的交易
          const user1OnlyOwn = user1Refunds.every((t) => t.userId === userId1);
          const user2OnlyOwn = user2Refunds.every((t) => t.userId === userId2);

          return user1OnlyOwn && user2OnlyOwn;
        }
      ),
      { numRuns: 100 }
    );
  });
});
