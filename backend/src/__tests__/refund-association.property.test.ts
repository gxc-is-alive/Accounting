/**
 * 退款创建关联性属性测试
 *
 * Property 1: 退款创建关联性
 * 对于任意支出交易，当创建退款时，退款交易的类型应为 refund，
 * 且 originalTransactionId 应等于原始支出交易的 ID。
 *
 * Validates: Requirements 1.1, 3.1
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟交易记录
interface Transaction {
  id: number;
  type: "income" | "expense" | "repayment" | "refund";
  amount: number;
  accountId: number;
  categoryId: number;
  originalTransactionId?: number | null;
}

// 模拟创建退款的结果
interface CreateRefundResult {
  success: boolean;
  refund?: Transaction;
  error?: string;
}

// 模拟创建退款逻辑（纯函数）
function createRefund(
  originalTransaction: Transaction,
  refundAmount: number,
  nextId: number
): CreateRefundResult {
  // 验证原交易类型
  if (originalTransaction.type !== "expense") {
    return { success: false, error: "REFUND_INVALID_TYPE" };
  }

  // 验证退款金额
  if (refundAmount <= 0) {
    return { success: false, error: "REFUND_AMOUNT_INVALID" };
  }

  if (refundAmount > originalTransaction.amount) {
    return { success: false, error: "REFUND_AMOUNT_EXCEEDED" };
  }

  // 创建退款交易
  const refund: Transaction = {
    id: nextId,
    type: "refund",
    amount: refundAmount,
    accountId: originalTransaction.accountId,
    categoryId: originalTransaction.categoryId,
    originalTransactionId: originalTransaction.id,
  };

  return { success: true, refund };
}

// 生成有效的金额（精确到分）
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成支出交易
const expenseTransactionArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  type: fc.constant("expense" as const),
  amount: amountArbitrary,
  accountId: fc.integer({ min: 1, max: 100 }),
  categoryId: fc.integer({ min: 1, max: 100 }),
  originalTransactionId: fc.constant(null),
});

describe("退款创建关联性属性测试", () => {
  /**
   * Property 1: 退款创建关联性
   * 对于任意支出交易，当创建退款时，退款交易的类型应为 refund，
   * 且 originalTransactionId 应等于原始支出交易的 ID。
   * Validates: Requirements 1.1, 3.1
   */
  describe("Property 1: 退款创建关联性", () => {
    it("**Feature: refund, Property 1: 退款创建关联性** - 退款类型应为 refund", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            // 确保退款金额有效
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund).toBeDefined();
            expect(result.refund!.type).toBe("refund");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款的 originalTransactionId 应等于原交易 ID", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund!.originalTransactionId).toBe(originalTx.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款应继承原交易的账户 ID", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund!.accountId).toBe(originalTx.accountId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款应继承原交易的分类 ID", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund!.categoryId).toBe(originalTx.categoryId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额应等于请求的金额", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund!.amount).toBeCloseTo(validAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款 ID 应与原交易 ID 不同", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          amountArbitrary,
          fc.integer({ min: 10001, max: 20000 }),
          (originalTx, refundAmount, nextId) => {
            const validAmount = Math.min(refundAmount, originalTx.amount);
            fc.pre(validAmount > 0);
            fc.pre(nextId !== originalTx.id);

            const result = createRefund(originalTx, validAmount, nextId);

            expect(result.success).toBe(true);
            expect(result.refund!.id).not.toBe(originalTx.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 多次退款关联测试
   */
  describe("多次退款关联", () => {
    it("多次退款都应关联到同一原交易", () => {
      fc.assert(
        fc.property(
          expenseTransactionArbitrary,
          fc.integer({ min: 2, max: 5 }),
          (originalTx, refundCount) => {
            fc.pre(originalTx.amount > refundCount);

            const refundAmount = Number(
              (originalTx.amount / (refundCount + 1)).toFixed(2)
            );
            const refunds: Transaction[] = [];

            for (let i = 0; i < refundCount; i++) {
              const result = createRefund(originalTx, refundAmount, 10000 + i);
              if (result.success && result.refund) {
                refunds.push(result.refund);
              }
            }

            // 所有退款都应关联到同一原交易
            for (const refund of refunds) {
              expect(refund.originalTransactionId).toBe(originalTx.id);
              expect(refund.type).toBe("refund");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
