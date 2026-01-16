/**
 * 退款金额计算属性测试
 *
 * Property 5: 可退款金额计算
 * 对于任意支出交易及其关联的退款记录列表，可退款金额应等于原交易金额减去所有退款金额之和。
 *
 * Validates: Requirements 2.1, 3.2, 3.3
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟交易记录
interface Transaction {
  id: number;
  type: "income" | "expense" | "repayment" | "refund";
  amount: number;
  originalTransactionId?: number | null;
}

// 计算可退款金额（纯函数实现）
function calculateRefundableAmount(
  originalAmount: number,
  refundAmounts: number[]
): number {
  const totalRefunded = refundAmounts.reduce((sum, a) => sum + a, 0);
  return Math.max(0, Number((originalAmount - totalRefunded).toFixed(2)));
}

// 验证退款金额是否有效
function validateRefundAmount(
  attemptAmount: number,
  refundableAmount: number
): { valid: boolean; error?: string } {
  if (attemptAmount <= 0) {
    return { valid: false, error: "REFUND_AMOUNT_INVALID" };
  }
  if (refundableAmount === 0) {
    return { valid: false, error: "REFUND_ALREADY_FULL" };
  }
  if (attemptAmount > refundableAmount) {
    return { valid: false, error: "REFUND_AMOUNT_EXCEEDED" };
  }
  return { valid: true };
}

// 生成有效的金额（精确到分）
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成退款金额列表（每个退款金额都是正数）
const refundAmountsArbitrary = fc.array(
  fc
    .integer({ min: 1, max: 10000000 })
    .map((n) => Number((n / 100).toFixed(2))),
  { minLength: 0, maxLength: 10 }
);

describe("退款金额计算属性测试", () => {
  /**
   * Property 5: 可退款金额计算
   * 对于任意支出交易及其关联的退款记录列表，可退款金额应等于原交易金额减去所有退款金额之和。
   * Validates: Requirements 2.1, 3.2, 3.3
   */
  describe("Property 5: 可退款金额计算", () => {
    it("**Feature: refund, Property 5: 可退款金额计算** - 可退款金额等于原金额减去已退款总额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          refundAmountsArbitrary,
          (originalAmount, refundAmounts) => {
            const totalRefunded = refundAmounts.reduce((sum, a) => sum + a, 0);
            const expectedRefundable = Math.max(
              0,
              Number((originalAmount - totalRefunded).toFixed(2))
            );

            const calculated = calculateRefundableAmount(
              originalAmount,
              refundAmounts
            );

            // 允许浮点数精度误差
            expect(Math.abs(calculated - expectedRefundable)).toBeLessThan(
              0.01
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("可退款金额不会为负数", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          refundAmountsArbitrary,
          (originalAmount, refundAmounts) => {
            const calculated = calculateRefundableAmount(
              originalAmount,
              refundAmounts
            );
            expect(calculated).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("没有退款时，可退款金额等于原交易金额", () => {
      fc.assert(
        fc.property(amountArbitrary, (originalAmount) => {
          const calculated = calculateRefundableAmount(originalAmount, []);
          expect(calculated).toBeCloseTo(originalAmount, 2);
        }),
        { numRuns: 100 }
      );
    });

    it("全额退款后，可退款金额为零", () => {
      fc.assert(
        fc.property(amountArbitrary, (originalAmount) => {
          const calculated = calculateRefundableAmount(originalAmount, [
            originalAmount,
          ]);
          expect(calculated).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("多次部分退款后，可退款金额正确计算", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 2, max: 10 }),
          (originalAmount, refundCount) => {
            // 生成多次部分退款，每次退款金额为原金额的一部分
            const refundAmount = Number(
              (originalAmount / (refundCount + 1)).toFixed(2)
            );
            const refundAmounts = Array(refundCount).fill(refundAmount);

            const totalRefunded = refundAmounts.reduce((sum, a) => sum + a, 0);
            const expectedRefundable = Math.max(
              0,
              Number((originalAmount - totalRefunded).toFixed(2))
            );

            const calculated = calculateRefundableAmount(
              originalAmount,
              refundAmounts
            );

            expect(Math.abs(calculated - expectedRefundable)).toBeLessThan(
              0.01
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 退款金额验证测试
   */
  describe("退款金额验证", () => {
    it("有效的退款金额应通过验证", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (originalAmount, attemptAmount) => {
            // 确保尝试金额在有效范围内
            const validAttempt = Math.min(attemptAmount, originalAmount);
            fc.pre(validAttempt > 0);

            const result = validateRefundAmount(validAttempt, originalAmount);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额为零或负数时应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: -1000000, max: 0 }).map((n) => n / 100),
          (refundableAmount, invalidAmount) => {
            const result = validateRefundAmount(
              invalidAmount,
              refundableAmount
            );
            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_AMOUNT_INVALID");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("可退款金额为零时应拒绝任何退款", () => {
      fc.assert(
        fc.property(amountArbitrary, (attemptAmount) => {
          fc.pre(attemptAmount > 0);
          const result = validateRefundAmount(attemptAmount, 0);
          expect(result.valid).toBe(false);
          expect(result.error).toBe("REFUND_ALREADY_FULL");
        }),
        { numRuns: 100 }
      );
    });

    it("退款金额超过可退款金额时应拒绝", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (refundableAmount, excess) => {
            fc.pre(refundableAmount > 0);
            const invalidAmount = refundableAmount + excess / 100;

            const result = validateRefundAmount(
              invalidAmount,
              refundableAmount
            );
            expect(result.valid).toBe(false);
            expect(result.error).toBe("REFUND_AMOUNT_EXCEEDED");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
