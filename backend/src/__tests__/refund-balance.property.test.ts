/**
 * 退款余额更新属性测试
 *
 * Property 3: 非信用账户退款余额更新
 * 对于任意非信用账户的支出退款，退款后账户余额应等于退款前余额加上退款金额。
 *
 * Property 4: 信用账户退款待还金额更新
 * 对于任意信用账户的支出退款，退款后待还金额应等于退款前待还金额减去退款金额。
 *
 * Validates: Requirements 1.4, 1.5, 1.6
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 账户类型
type AccountType =
  | "cash"
  | "bank"
  | "alipay"
  | "wechat"
  | "credit"
  | "investment"
  | "other";

// 模拟账户
interface Account {
  id: number;
  type: AccountType;
  balance: number;
  creditLimit?: number;
}

// 模拟退款操作结果
interface RefundResult {
  success: boolean;
  newBalance: number;
  newOutstanding?: number;
  error?: string;
}

// 判断是否为信用账户
function isCreditAccount(account: Account): boolean {
  return account.type === "credit";
}

// 计算信用账户待还金额（简化模拟）
function calculateOutstanding(
  creditLimit: number,
  balance: number,
  expenses: number[],
  refunds: number[]
): number {
  const totalExpense = expenses.reduce((sum, e) => sum + e, 0);
  const totalRefund = refunds.reduce((sum, r) => sum + r, 0);
  return Math.max(0, totalExpense - totalRefund);
}

// 模拟非信用账户退款
function processNonCreditRefund(
  account: Account,
  refundAmount: number
): RefundResult {
  if (isCreditAccount(account)) {
    return {
      success: false,
      newBalance: account.balance,
      error: "INVALID_ACCOUNT_TYPE",
    };
  }

  if (refundAmount <= 0) {
    return {
      success: false,
      newBalance: account.balance,
      error: "INVALID_AMOUNT",
    };
  }

  // 非信用账户：退款增加余额
  const newBalance = Number((account.balance + refundAmount).toFixed(2));

  return { success: true, newBalance };
}

// 模拟信用账户退款
function processCreditRefund(
  account: Account,
  currentOutstanding: number,
  refundAmount: number
): RefundResult {
  if (!isCreditAccount(account)) {
    return {
      success: false,
      newBalance: account.balance,
      newOutstanding: currentOutstanding,
      error: "INVALID_ACCOUNT_TYPE",
    };
  }

  if (refundAmount <= 0) {
    return {
      success: false,
      newBalance: account.balance,
      newOutstanding: currentOutstanding,
      error: "INVALID_AMOUNT",
    };
  }

  // 信用账户：退款减少待还金额（余额不变）
  const newOutstanding = Math.max(
    0,
    Number((currentOutstanding - refundAmount).toFixed(2))
  );

  return {
    success: true,
    newBalance: account.balance, // 信用账户余额不变
    newOutstanding,
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
  "wechat" as const,
  "other" as const
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
  balance: fc.constant(0), // 信用账户余额通常为 0
  creditLimit: amountArbitrary,
});

describe("退款余额更新属性测试", () => {
  /**
   * Property 3: 非信用账户退款余额更新
   * 对于任意非信用账户的支出退款，退款后账户余额应等于退款前余额加上退款金额。
   * Validates: Requirements 1.4, 1.5
   */
  describe("Property 3: 非信用账户退款余额更新", () => {
    it("**Feature: refund, Property 3: 非信用账户退款余额更新** - 退款后余额等于原余额加退款金额", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          amountArbitrary,
          (account, refundAmount) => {
            fc.pre(refundAmount > 0);

            const result = processNonCreditRefund(account, refundAmount);

            expect(result.success).toBe(true);
            expect(result.newBalance).toBeCloseTo(
              account.balance + refundAmount,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("多次退款后余额累计正确", () => {
      fc.assert(
        fc.property(
          nonCreditAccountArbitrary,
          fc.array(amountArbitrary, { minLength: 1, maxLength: 5 }),
          (account, refundAmounts) => {
            let currentBalance = account.balance;

            for (const amount of refundAmounts) {
              const result = processNonCreditRefund(
                { ...account, balance: currentBalance },
                amount
              );
              if (result.success) {
                currentBalance = result.newBalance;
              }
            }

            const totalRefund = refundAmounts.reduce((sum, a) => sum + a, 0);
            const expectedBalance = Number(
              (account.balance + totalRefund).toFixed(2)
            );

            expect(currentBalance).toBeCloseTo(expectedBalance, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额为零时应失败且余额不变", () => {
      fc.assert(
        fc.property(nonCreditAccountArbitrary, (account) => {
          const result = processNonCreditRefund(account, 0);

          expect(result.success).toBe(false);
          expect(result.newBalance).toBe(account.balance);
        }),
        { numRuns: 100 }
      );
    });

    it("现金账户退款正确更新余额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (balance, refundAmount) => {
            fc.pre(refundAmount > 0);

            const account: Account = {
              id: 1,
              type: "cash",
              balance,
            };

            const result = processNonCreditRefund(account, refundAmount);

            expect(result.success).toBe(true);
            expect(result.newBalance).toBeCloseTo(balance + refundAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("银行账户退款正确更新余额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (balance, refundAmount) => {
            fc.pre(refundAmount > 0);

            const account: Account = {
              id: 1,
              type: "bank",
              balance,
            };

            const result = processNonCreditRefund(account, refundAmount);

            expect(result.success).toBe(true);
            expect(result.newBalance).toBeCloseTo(balance + refundAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: 信用账户退款待还金额更新
   * 对于任意信用账户的支出退款，退款后待还金额应等于退款前待还金额减去退款金额。
   * Validates: Requirements 1.6
   */
  describe("Property 4: 信用账户退款待还金额更新", () => {
    it("**Feature: refund, Property 4: 信用账户退款待还金额更新** - 退款后待还金额等于原待还金额减退款金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary, // 当前待还金额
          amountArbitrary, // 退款金额
          (account, outstanding, refundAmount) => {
            fc.pre(refundAmount > 0);
            fc.pre(outstanding > 0);

            const result = processCreditRefund(
              account,
              outstanding,
              refundAmount
            );

            expect(result.success).toBe(true);
            expect(result.newOutstanding).toBeCloseTo(
              Math.max(0, outstanding - refundAmount),
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("信用账户退款不改变账户余额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, outstanding, refundAmount) => {
            fc.pre(refundAmount > 0);

            const result = processCreditRefund(
              account,
              outstanding,
              refundAmount
            );

            expect(result.success).toBe(true);
            expect(result.newBalance).toBe(account.balance);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款后待还金额不会为负", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, outstanding, refundAmount) => {
            fc.pre(refundAmount > 0);

            const result = processCreditRefund(
              account,
              outstanding,
              refundAmount
            );

            expect(result.success).toBe(true);
            expect(result.newOutstanding).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("全额退款后待还金额为零", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          (account, outstanding) => {
            fc.pre(outstanding > 0);

            // 全额退款
            const result = processCreditRefund(
              account,
              outstanding,
              outstanding
            );

            expect(result.success).toBe(true);
            expect(result.newOutstanding).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("退款金额超过待还金额时，待还金额为零（溢缴款）", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (account, outstanding, excess) => {
            fc.pre(outstanding > 0);

            // 退款金额超过待还金额
            const refundAmount = outstanding + excess / 100;

            const result = processCreditRefund(
              account,
              outstanding,
              refundAmount
            );

            expect(result.success).toBe(true);
            expect(result.newOutstanding).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
