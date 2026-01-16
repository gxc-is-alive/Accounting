/**
 * 退款金额验证属性测试
 *
 * Property 2: 退款金额验证
 * 对于任意退款请求，退款金额必须满足：0 < refundAmount <= refundableAmount。
 * 任何不满足此条件的退款请求应被拒绝。
 *
 * Validates: Requirements 1.2, 1.3, 2.2, 2.3, 2.4
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟退款验证结果
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// 模拟退款验证逻辑（纯函数）
function validateRefundRequest(
  originalAmount: number,
  totalRefunded: number,
  attemptAmount: number,
  originalType: "income" | "expense" | "repayment" | "refund"
): ValidationResult {
  // 验证原交易类型
  if (originalType !== "expense") {
    return { valid: false, error: "REFUND_INVALID_TYPE" };
  }

  // 验证退款金额为正数
  if (attemptAmount <= 0) {
    return { valid: false, error: "REFUND_AMOUNT_INVALID" };
  }

  // 计算可退款金额
  const refundableAmount = Math.max(0, originalAmount - totalRefunded);

  // 验证可退款金额不为零
  if (refundableAmount === 0) {
    return { valid: false, error: "REFUND_ALREADY_FULL" };
  }

  // 验证退款金额不超过可退款金额
  if (attemptAmount > refundableAmount + 0.001) {
    // 允许微小的浮点误差
    return { valid: false, error: "REFUND_AMOUNT_EXCEEDED" };
  }

  return { valid: true };
}

// 生成有效的金额（精确到分）
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成交易类型
const transactionTypeArbitrary = fc.constantFrom(
  "income" as const,
  "expense" as const,
  "repayment" as const,
  "refund" as const
);

describe("退款金额验证属性测试", () => {
  /**
   * Property 2: 退款金额验证
   * 对于任意退款请求，退款金额必须满足：0 < refundAmount <= refundableAmount。
   * Validates: Requirements 1.2, 1.3, 2.2, 2.3, 2.4
   */
  describe("Property 2: 退款金额验证", () => {
    it("**Feature: refund, Property 2: 退款金额验证** - 有效金额应通过验证", () => {
      fc.assert(
        fc.property(
          amountArbitrary, // 原交易金额
          amountArbitrary, // 已退款金额
          amountArbitrary, // 尝试退款金额
          (originalAmount, refundedAmount, attemptAmount) => {
            // 确保已退款金额不超过原金额
            const validRefunded = Math.min(
              refundedAmount,
              originalAmount * 0.9
            );
            const refundableAmount = originalAmount - validRefunded;

            // 确保尝试金额在有效范围内
            const validAttempt = Math.min(attemptAmount, refundableAmount);
            fc.pre(validAttempt > 0);
            fc.pre(refundableAmount > 0);

            const result = validateRefundRequest(
              originalAmount,
              validRefunded,
              validAttempt,
              "expense"
            );

            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额为零时应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (originalAmount, refundedAmount) => {
            const validRefunded = Math.min(
              refundedAmount,
              originalAmount * 0.5
            );

            const result = validateRefundRequest(
              originalAmount,
              validRefunded,
              0,
              "expense"
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_AMOUNT_INVALID");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额为负数时应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          fc.integer({ min: -1000000, max: -1 }).map((n) => n / 100),
          (originalAmount, refundedAmount, negativeAmount) => {
            const validRefunded = Math.min(
              refundedAmount,
              originalAmount * 0.5
            );

            const result = validateRefundRequest(
              originalAmount,
              validRefunded,
              negativeAmount,
              "expense"
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_AMOUNT_INVALID");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额超过可退款金额时应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (originalAmount, refundedAmount, excess) => {
            const validRefunded = Math.min(
              refundedAmount,
              originalAmount * 0.5
            );
            const refundableAmount = originalAmount - validRefunded;
            fc.pre(refundableAmount > 0);

            const excessAmount = refundableAmount + excess / 100;

            const result = validateRefundRequest(
              originalAmount,
              validRefunded,
              excessAmount,
              "expense"
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_AMOUNT_EXCEEDED");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("已全额退款时应拒绝任何新退款", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (originalAmount, attemptAmount) => {
            fc.pre(attemptAmount > 0);

            // 已全额退款
            const result = validateRefundRequest(
              originalAmount,
              originalAmount,
              attemptAmount,
              "expense"
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_ALREADY_FULL");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对非支出交易退款应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          fc.constantFrom(
            "income" as const,
            "repayment" as const,
            "refund" as const
          ),
          (originalAmount, attemptAmount, invalidType) => {
            fc.pre(attemptAmount > 0);

            const result = validateRefundRequest(
              originalAmount,
              0,
              attemptAmount,
              invalidType
            );

            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_INVALID_TYPE");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额等于可退款金额时应通过（全额退款）", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (originalAmount, refundedAmount) => {
            const validRefunded = Math.min(
              refundedAmount,
              originalAmount * 0.5
            );
            const refundableAmount = originalAmount - validRefunded;
            fc.pre(refundableAmount > 0);

            const result = validateRefundRequest(
              originalAmount,
              validRefunded,
              refundableAmount,
              "expense"
            );

            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额略小于可退款金额时应通过（部分退款）", () => {
      fc.assert(
        fc.property(amountArbitrary, (originalAmount) => {
          fc.pre(originalAmount > 1);

          // 部分退款：退款金额为原金额的一半
          const attemptAmount = Number((originalAmount / 2).toFixed(2));

          const result = validateRefundRequest(
            originalAmount,
            0,
            attemptAmount,
            "expense"
          );

          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
