/**
 * 删除退款恢复属性测试
 *
 * Property 8: 删除退款恢复
 * 对于任意退款交易被删除时，账户余额应恢复（减少之前增加的退款金额），
 * 且原交易的可退款金额应相应增加。
 *
 * Validates: Requirements 5.3, 5.4
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 账户类型
type AccountType = "cash" | "bank" | "alipay" | "wechat" | "credit";

// 模拟账户
interface Account {
  id: number;
  type: AccountType;
  balance: number;
}

// 模拟退款记录
interface Refund {
  id: number;
  amount: number;
  originalTransactionId: number;
}

// 模拟删除退款结果
interface DeleteRefundResult {
  success: boolean;
  newBalance: number;
  newRefundableAmount: number;
  error?: string;
}

// 判断是否为信用账户
function isCreditAccount(account: Account): boolean {
  return account.type === "credit";
}

// 模拟删除退款逻辑（纯函数）
function deleteRefund(
  account: Account,
  refund: Refund,
  originalAmount: number,
  currentRefundedAmount: number
): DeleteRefundResult {
  // 计算新的账户余额
  let newBalance: number;
  if (isCreditAccount(account)) {
    // 信用账户：删除退款不改变余额（待还金额通过交易记录计算）
    newBalance = account.balance;
  } else {
    // 非信用账户：删除退款减少余额
    newBalance = Number((account.balance - refund.amount).toFixed(2));
  }

  // 计算新的可退款金额
  const newRefundedAmount = currentRefundedAmount - refund.amount;
  const newRefundableAmount = Number(
    (originalAmount - newRefundedAmount).toFixed(2)
  );

  return {
    success: true,
    newBalance,
    newRefundableAmount,
  };
}

// 生成有效的金额（精确到分）
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成非信用账户类型
const nonCreditAccountTypeArbitrary = fc.constantFrom(
  "cash" as const,
  "bank" as const,
  "alipay" as const,
  "wechat" as const
);

// 生成非信用账户
const nonCreditAccountArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  type: nonCreditAccountTypeArbitrary,
  balance: amountArbitrary,
});

// 生成信用账户
const creditAccountArbitrary = fc.record({
  id: fc.integer({ min: 1001, max: 2000 }),
  type: fc.constant("credit" as const),
  balance: fc.constant(0),
});

describe("删除退款恢复属性测试", () => {
  /**
   * Property 8: 删除退款恢复
   * 对于任意退款交易被删除时，账户余额应恢复，且原交易的可退款金额应相应增加。
   * Validates: Requirements 5.3, 5.4
   */
  describe("Property 8: 删除退款恢复", () => {
    it("**Feature: refund, Property 8: 删除退款恢复** - 非信用账户删除退款后余额减少", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary, // 原交易金额
          amountArbitrary, // 退款金额
          (account, originalAmount, refundAmount) => {
            // 确保退款金额不超过原交易金额
            const validRefundAmount = Math.min(refundAmount, originalAmount);
            fc.pre(validRefundAmount > 0);

            // 模拟退款后的账户余额（已增加退款金额）
            const accountAfterRefund: Account = {
              ...account,
              balance: Number((account.balance + validRefundAmount).toFixed(2)),
            };

            const refund: Refund = {
              id: 1,
              amount: validRefundAmount,
              originalTransactionId: 100,
            };

            const result = deleteRefund(
              accountAfterRefund,
              refund,
              originalAmount,
              validRefundAmount
            );

            expect(result.success).toBe(true);
            // 删除退款后，余额应恢复到退款前
            expect(result.newBalance).toBeCloseTo(account.balance, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除退款后可退款金额增加", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, originalAmount, refundAmount) => {
            const validRefundAmount = Math.min(refundAmount, originalAmount);
            fc.pre(validRefundAmount > 0);

            const refund: Refund = {
              id: 1,
              amount: validRefundAmount,
              originalTransactionId: 100,
            };

            // 删除退款前的可退款金额
            const refundableBeforeDelete = originalAmount - validRefundAmount;

            const result = deleteRefund(
              account,
              refund,
              originalAmount,
              validRefundAmount
            );

            expect(result.success).toBe(true);
            // 删除退款后，可退款金额应增加
            expect(result.newRefundableAmount).toBeCloseTo(originalAmount, 2);
            expect(result.newRefundableAmount).toBeGreaterThan(
              refundableBeforeDelete - 0.01
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除全额退款后，可退款金额恢复为原交易金额", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary,
          (account, originalAmount) => {
            fc.pre(originalAmount > 0);

            // 全额退款
            const refund: Refund = {
              id: 1,
              amount: originalAmount,
              originalTransactionId: 100,
            };

            const result = deleteRefund(
              account,
              refund,
              originalAmount,
              originalAmount
            );

            expect(result.success).toBe(true);
            expect(result.newRefundableAmount).toBeCloseTo(originalAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除部分退款后，可退款金额正确增加", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary,
          fc.integer({ min: 2, max: 10 }),
          (account, originalAmount, refundCount) => {
            fc.pre(originalAmount > refundCount);

            // 每次退款金额
            const refundAmount = Number(
              (originalAmount / (refundCount + 1)).toFixed(2)
            );
            const totalRefunded = refundAmount * refundCount;

            // 删除一笔退款
            const refund: Refund = {
              id: 1,
              amount: refundAmount,
              originalTransactionId: 100,
            };

            const result = deleteRefund(
              account,
              refund,
              originalAmount,
              totalRefunded
            );

            expect(result.success).toBe(true);
            // 可退款金额应增加一笔退款的金额
            const expectedRefundable =
              originalAmount - (totalRefunded - refundAmount);
            expect(result.newRefundableAmount).toBeCloseTo(
              expectedRefundable,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("信用账户删除退款不改变余额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, originalAmount, refundAmount) => {
            const validRefundAmount = Math.min(refundAmount, originalAmount);
            fc.pre(validRefundAmount > 0);

            const refund: Refund = {
              id: 1,
              amount: validRefundAmount,
              originalTransactionId: 100,
            };

            const result = deleteRefund(
              account,
              refund,
              originalAmount,
              validRefundAmount
            );

            expect(result.success).toBe(true);
            // 信用账户余额不变
            expect(result.newBalance).toBe(account.balance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除退款是创建退款的逆操作（余额守恒）", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (initialAccount, originalAmount, refundAmount) => {
            const validRefundAmount = Math.min(refundAmount, originalAmount);
            fc.pre(validRefundAmount > 0);

            // 步骤 1: 创建退款（余额增加）
            const balanceAfterRefund = Number(
              (initialAccount.balance + validRefundAmount).toFixed(2)
            );

            // 步骤 2: 删除退款（余额减少）
            const accountAfterRefund: Account = {
              ...initialAccount,
              balance: balanceAfterRefund,
            };

            const refund: Refund = {
              id: 1,
              amount: validRefundAmount,
              originalTransactionId: 100,
            };

            const result = deleteRefund(
              accountAfterRefund,
              refund,
              originalAmount,
              validRefundAmount
            );

            expect(result.success).toBe(true);
            // 删除退款后，余额应恢复到初始值
            expect(result.newBalance).toBeCloseTo(initialAccount.balance, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
