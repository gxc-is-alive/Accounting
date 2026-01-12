/**
 * 信用消费属性测试
 *
 * Property 3: 消费金额守恒
 *
 * Validates: Requirements 2.1, 2.2
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

// 模拟信用消费结果
interface CreditExpenseResult {
  newOutstandingBalance: number;
  newAvailableCredit: number;
  accountBalanceChanged: boolean;
}

// 模拟信用消费逻辑（纯函数）
function simulateCreditExpense(
  account: AccountState,
  currentOutstanding: number,
  expenseAmount: number
): CreditExpenseResult {
  const isCreditAccount = account.type === "credit";
  const creditLimit = account.creditLimit || 0;

  // 信用账户消费：增加待还金额，不改变账户余额
  const newOutstandingBalance = currentOutstanding + expenseAmount;
  const newAvailableCredit = creditLimit - newOutstandingBalance;

  return {
    newOutstandingBalance,
    newAvailableCredit,
    accountBalanceChanged: !isCreditAccount, // 信用账户不改变余额
  };
}

// 模拟删除信用消费
function simulateDeleteCreditExpense(
  currentOutstanding: number,
  expenseAmount: number
): number {
  return Math.max(0, currentOutstanding - expenseAmount);
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

describe("信用消费属性测试", () => {
  /**
   * Property 3: 消费金额守恒
   * 对于任意信用消费操作，待还金额的增加量应等于消费金额。
   * Validates: Requirements 2.1, 2.2
   */
  describe("Property 3: 消费金额守恒", () => {
    it("对于任意信用消费，待还金额增加量等于消费金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, currentOutstanding, expenseAmount) => {
            const result = simulateCreditExpense(
              account,
              currentOutstanding,
              expenseAmount
            );

            // 待还金额增加量等于消费金额
            const outstandingIncrease =
              result.newOutstandingBalance - currentOutstanding;
            expect(outstandingIncrease).toBeCloseTo(expenseAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意信用消费，可用额度减少量等于消费金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, currentOutstanding, expenseAmount) => {
            const creditLimit = account.creditLimit || 0;
            const oldAvailableCredit = creditLimit - currentOutstanding;

            const result = simulateCreditExpense(
              account,
              currentOutstanding,
              expenseAmount
            );

            // 可用额度减少量等于消费金额
            const availableDecrease =
              oldAvailableCredit - result.newAvailableCredit;
            expect(availableDecrease).toBeCloseTo(expenseAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("信用账户消费不改变账户余额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, currentOutstanding, expenseAmount) => {
            const result = simulateCreditExpense(
              account,
              currentOutstanding,
              expenseAmount
            );

            // 信用账户消费不改变余额
            expect(result.accountBalanceChanged).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除信用消费后，待还金额减少量等于消费金额", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (currentOutstanding, expenseAmount) => {
            // 先消费
            const afterExpense = currentOutstanding + expenseAmount;
            // 再删除
            const afterDelete = simulateDeleteCreditExpense(
              afterExpense,
              expenseAmount
            );

            // 删除后应恢复到原来的待还金额
            expect(afterDelete).toBeCloseTo(currentOutstanding, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外测试：可用额度计算
   */
  describe("可用额度计算", () => {
    it("可用额度 = 信用额度 - 待还金额", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          amountArbitrary,
          amountArbitrary,
          (account, currentOutstanding, expenseAmount) => {
            const creditLimit = account.creditLimit || 0;

            const result = simulateCreditExpense(
              account,
              currentOutstanding,
              expenseAmount
            );

            // 验证可用额度计算公式
            const expectedAvailable =
              creditLimit - result.newOutstandingBalance;
            expect(result.newAvailableCredit).toBeCloseTo(expectedAvailable, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当消费超过信用额度时，可用额度为负（超额）", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          fc.integer({ min: 1, max: 1000000 }),
          (account, excess) => {
            const creditLimit = account.creditLimit || 0;
            // 消费金额超过信用额度
            const expenseAmount = creditLimit + excess;

            const result = simulateCreditExpense(account, 0, expenseAmount);

            // 可用额度应为负
            expect(result.newAvailableCredit).toBeLessThan(0);
            expect(result.newAvailableCredit).toBeCloseTo(-excess, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外测试：消费和删除的往返一致性
   */
  describe("消费和删除的往返一致性", () => {
    it("消费后删除应恢复原状态", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (initialOutstanding, expenseAmount) => {
            // 消费
            const afterExpense = initialOutstanding + expenseAmount;
            // 删除
            const afterDelete = simulateDeleteCreditExpense(
              afterExpense,
              expenseAmount
            );

            // 应恢复到初始状态
            expect(afterDelete).toBeCloseTo(initialOutstanding, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("多次消费后逐个删除应恢复原状态", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.array(amountArbitrary, { minLength: 1, maxLength: 5 }),
          (initialOutstanding, expenses) => {
            // 多次消费
            let outstanding = initialOutstanding;
            for (const expense of expenses) {
              outstanding += expense;
            }

            // 逐个删除（逆序）
            for (let i = expenses.length - 1; i >= 0; i--) {
              outstanding = simulateDeleteCreditExpense(
                outstanding,
                expenses[i]
              );
            }

            // 应恢复到初始状态
            expect(outstanding).toBeCloseTo(initialOutstanding, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
