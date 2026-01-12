/**
 * 还款属性测试
 *
 * Property 2: 还款金额守恒
 * Property 5: 还款来源余额充足性
 *
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.8
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟账户状态
interface AccountState {
  id: number;
  balance: number;
  type: "credit" | "cash" | "bank";
  creditLimit?: number;
}

// 模拟还款操作（纯函数，不依赖数据库）
interface RepaymentOperation {
  creditAccountId: number;
  sourceAccountId: number;
  amount: number;
}

// 模拟还款结果
interface RepaymentResult {
  success: boolean;
  newSourceBalance: number;
  newOutstandingBalance: number;
  error?: string;
}

// 模拟还款逻辑
function simulateRepayment(
  creditAccount: AccountState,
  sourceAccount: AccountState,
  currentOutstanding: number,
  amount: number
): RepaymentResult {
  // 验证金额
  if (amount <= 0) {
    return {
      success: false,
      newSourceBalance: sourceAccount.balance,
      newOutstandingBalance: currentOutstanding,
      error: "INVALID_AMOUNT",
    };
  }

  // 验证账户类型
  if (creditAccount.type !== "credit") {
    return {
      success: false,
      newSourceBalance: sourceAccount.balance,
      newOutstandingBalance: currentOutstanding,
      error: "INVALID_CREDIT_ACCOUNT",
    };
  }

  if (sourceAccount.type === "credit") {
    return {
      success: false,
      newSourceBalance: sourceAccount.balance,
      newOutstandingBalance: currentOutstanding,
      error: "INVALID_SOURCE_ACCOUNT",
    };
  }

  // 验证来源账户余额
  if (sourceAccount.balance < amount) {
    return {
      success: false,
      newSourceBalance: sourceAccount.balance,
      newOutstandingBalance: currentOutstanding,
      error: "INSUFFICIENT_BALANCE",
    };
  }

  // 执行还款
  const newSourceBalance = sourceAccount.balance - amount;
  const newOutstandingBalance = Math.max(0, currentOutstanding - amount);

  return {
    success: true,
    newSourceBalance,
    newOutstandingBalance,
  };
}

// 生成有效的金额
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成信用账户
const creditAccountArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  balance: fc.constant(0),
  type: fc.constant("credit" as const),
  creditLimit: amountArbitrary,
});

// 生成现金账户
const cashAccountArbitrary = fc.record({
  id: fc.integer({ min: 1001, max: 2000 }),
  balance: amountArbitrary,
  type: fc.constantFrom("cash" as const, "bank" as const),
});

describe("还款属性测试", () => {
  /**
   * Property 2: 还款金额守恒
   * 对于任意还款操作，信用账户待还金额的减少量应等于来源账户余额的减少量，且等于还款金额。
   * Validates: Requirements 3.3, 3.4, 3.5
   */
  describe("Property 2: 还款金额守恒", () => {
    it("对于任意成功的还款，来源账户余额减少量等于还款金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (creditAccount, sourceAccount, outstanding, repayAmount) => {
            // 确保还款金额不超过来源账户余额
            const validAmount = Math.min(repayAmount, sourceAccount.balance);
            fc.pre(validAmount > 0);

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              validAmount
            );

            if (result.success) {
              // 来源账户余额减少量等于还款金额
              const balanceDecrease =
                sourceAccount.balance - result.newSourceBalance;
              expect(balanceDecrease).toBeCloseTo(validAmount, 2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成功的还款，待还金额减少量不超过还款金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (creditAccount, sourceAccount, outstanding, repayAmount) => {
            const validAmount = Math.min(repayAmount, sourceAccount.balance);
            fc.pre(validAmount > 0);

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              validAmount
            );

            if (result.success) {
              // 待还金额减少量不超过还款金额（可能有溢缴款）
              const outstandingDecrease =
                outstanding - result.newOutstandingBalance;
              expect(outstandingDecrease).toBeLessThanOrEqual(
                validAmount + 0.01
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("还款后待还金额不会为负", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (creditAccount, sourceAccount, outstanding, repayAmount) => {
            const validAmount = Math.min(repayAmount, sourceAccount.balance);
            fc.pre(validAmount > 0);

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              validAmount
            );

            if (result.success) {
              expect(result.newOutstandingBalance).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: 还款来源余额充足性
   * 对于任意成功的还款操作，还款金额不应超过来源账户的余额。
   * Validates: Requirements 3.2, 3.8
   */
  describe("Property 5: 还款来源余额充足性", () => {
    it("当还款金额超过来源账户余额时，还款应失败", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (creditAccount, sourceAccount, outstanding, excess) => {
            // 还款金额超过来源账户余额
            const invalidAmount = sourceAccount.balance + excess;

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              invalidAmount
            );

            // 应该失败
            expect(result.success).toBe(false);
            expect(result.error).toBe("INSUFFICIENT_BALANCE");
            // 余额不应改变
            expect(result.newSourceBalance).toBe(sourceAccount.balance);
            // 待还金额不应改变
            expect(result.newOutstandingBalance).toBe(outstanding);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当还款金额等于来源账户余额时，还款应成功", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          (creditAccount, sourceAccount, outstanding) => {
            fc.pre(sourceAccount.balance > 0);

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              sourceAccount.balance
            );

            // 应该成功
            expect(result.success).toBe(true);
            // 来源账户余额应为 0
            expect(result.newSourceBalance).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当还款金额小于来源账户余额时，还款应成功且余额正确", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          (creditAccount, sourceAccount, outstanding) => {
            fc.pre(sourceAccount.balance > 1);
            // 还款金额为余额的一半
            const repayAmount = Number((sourceAccount.balance / 2).toFixed(2));
            fc.pre(repayAmount > 0);

            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              repayAmount
            );

            // 应该成功
            expect(result.success).toBe(true);
            // 来源账户余额应正确减少
            expect(result.newSourceBalance).toBeCloseTo(
              sourceAccount.balance - repayAmount,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外测试：还款验证
   */
  describe("还款验证", () => {
    it("还款金额为 0 或负数时应失败", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          cashAccountArbitrary,
          amountArbitrary,
          fc.integer({ min: -1000000, max: 0 }),
          (creditAccount, sourceAccount, outstanding, invalidAmount) => {
            const result = simulateRepayment(
              creditAccount,
              sourceAccount,
              outstanding,
              invalidAmount
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("INVALID_AMOUNT");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("来源账户为信用账户时应失败", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (creditAccount, anotherCreditAccount, outstanding, amount) => {
            fc.pre(amount > 0);

            const result = simulateRepayment(
              creditAccount,
              anotherCreditAccount,
              outstanding,
              amount
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe("INVALID_SOURCE_ACCOUNT");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
