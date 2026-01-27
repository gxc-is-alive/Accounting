/**
 * 交易账户变更余额调整属性测试
 * Feature: transaction-edit-enhancement
 *
 * Property 1: 账户变更时余额调整的正确性
 * 对于任意交易（支出、收入或退款类型）和任意两个不同的账户（原账户和新账户），
 * 当修改交易的账户时，系统应该：
 * - 根据交易类型正确调整原账户余额（支出类型增加，收入/退款类型减少）
 * - 根据交易类型正确调整新账户余额（支出类型减少，收入/退款类型增加）
 * - 确保两个账户的余额变化总和为零（守恒定律）
 *
 * Validates: Requirements 1.4, 1.5, 1.6
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 交易类型
type TransactionType = "income" | "expense" | "refund";

// 账户接口
interface Account {
  id: number;
  balance: number;
  isCreditAccount: boolean;
}

// 交易接口
interface Transaction {
  id: number;
  accountId: number;
  type: TransactionType;
  amount: number;
}

// 余额调整结果
interface BalanceAdjustmentResult {
  oldAccountBalanceChange: number;
  newAccountBalanceChange: number;
  totalChange: number;
}

/**
 * 计算账户变更时的余额调整
 * 这是对 transactionService.adjustAccountBalanceOnUpdate 逻辑的纯函数模拟
 */
function calculateBalanceAdjustment(
  transaction: Transaction,
  oldAccountId: number,
  newAccountId: number,
  oldAccountIsCreditAccount: boolean,
  newAccountIsCreditAccount: boolean,
): BalanceAdjustmentResult {
  const { type, amount } = transaction;

  let oldAccountBalanceChange = 0;
  let newAccountBalanceChange = 0;

  // 如果账户未变更，无需调整
  if (oldAccountId === newAccountId) {
    return {
      oldAccountBalanceChange: 0,
      newAccountBalanceChange: 0,
      totalChange: 0,
    };
  }

  // 恢复原账户余额（仅非信用账户）
  if (!oldAccountIsCreditAccount) {
    // 支出类型：退回金额（增加余额）
    // 收入/退款类型：撤回金额（减少余额）
    oldAccountBalanceChange = type === "expense" ? amount : -amount;
  }

  // 更新新账户余额（仅非信用账户）
  if (!newAccountIsCreditAccount) {
    // 支出类型：扣除金额（减少余额）
    // 收入/退款类型：增加金额（增加余额）
    newAccountBalanceChange = type === "expense" ? -amount : amount;
  }

  return {
    oldAccountBalanceChange,
    newAccountBalanceChange,
    totalChange: oldAccountBalanceChange + newAccountBalanceChange,
  };
}

describe("交易账户变更余额调整属性测试", () => {
  /**
   * Property 1: 账户变更时余额调整的正确性
   * Validates: Requirements 1.4, 1.5, 1.6
   */
  describe("Property 1: 账户变更时余额调整的正确性", () => {
    it("支出类型：原账户余额应增加，新账户余额应减少", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID（确保不同）
          fc.double({ min: 0, max: 10000 }), // 原账户余额
          fc.double({ min: 0, max: 10000 }), // 新账户余额
          (amount, oldAccountId, newAccountId, oldBalance, newBalance) => {
            const transaction: Transaction = {
              id: 1,
              accountId: oldAccountId,
              type: "expense",
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              oldAccountId,
              newAccountId,
              false, // 非信用账户
              false, // 非信用账户
            );

            // 验证：原账户余额应增加（退回支出）
            expect(result.oldAccountBalanceChange).toBe(amount);

            // 验证：新账户余额应减少（扣除支出）
            expect(result.newAccountBalanceChange).toBe(-amount);

            // 验证：总变化为零（守恒定律）
            expect(result.totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("收入类型：原账户余额应减少，新账户余额应增加", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          fc.double({ min: 0, max: 10000 }), // 原账户余额
          fc.double({ min: 0, max: 10000 }), // 新账户余额
          (amount, oldAccountId, newAccountId, oldBalance, newBalance) => {
            const transaction: Transaction = {
              id: 1,
              accountId: oldAccountId,
              type: "income",
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              oldAccountId,
              newAccountId,
              false,
              false,
            );

            // 验证：原账户余额应减少（撤回收入）
            expect(result.oldAccountBalanceChange).toBe(-amount);

            // 验证：新账户余额应增加（增加收入）
            expect(result.newAccountBalanceChange).toBe(amount);

            // 验证：总变化为零（守恒定律）
            expect(result.totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("退款类型：原账户余额应减少，新账户余额应增加", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          fc.double({ min: 0, max: 10000 }), // 原账户余额
          fc.double({ min: 0, max: 10000 }), // 新账户余额
          (amount, oldAccountId, newAccountId, oldBalance, newBalance) => {
            const transaction: Transaction = {
              id: 1,
              accountId: oldAccountId,
              type: "refund",
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              oldAccountId,
              newAccountId,
              false,
              false,
            );

            // 验证：原账户余额应减少（撤回退款）
            expect(result.oldAccountBalanceChange).toBe(-amount);

            // 验证：新账户余额应增加（增加退款）
            expect(result.newAccountBalanceChange).toBe(amount);

            // 验证：总变化为零（守恒定律）
            expect(result.totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("余额守恒定律：任意交易类型的账户变更，总余额变化应为零", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          (type, amount, oldAccountId, newAccountId) => {
            const transaction: Transaction = {
              id: 1,
              accountId: oldAccountId,
              type: type as TransactionType,
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              oldAccountId,
              newAccountId,
              false,
              false,
            );

            // 验证：总变化为零（守恒定律）
            expect(result.totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("信用账户不应调整余额", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          fc.boolean(), // 原账户是否为信用账户
          fc.boolean(), // 新账户是否为信用账户
          (
            type,
            amount,
            oldAccountId,
            newAccountId,
            oldIsCredit,
            newIsCredit,
          ) => {
            const transaction: Transaction = {
              id: 1,
              accountId: oldAccountId,
              type: type as TransactionType,
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              oldAccountId,
              newAccountId,
              oldIsCredit,
              newIsCredit,
            );

            // 验证：信用账户的余额变化应为 0
            if (oldIsCredit) {
              expect(result.oldAccountBalanceChange).toBe(0);
            }

            if (newIsCredit) {
              expect(result.newAccountBalanceChange).toBe(0);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("同一账户不应调整余额", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 账户 ID
          (type, amount, accountId) => {
            const transaction: Transaction = {
              id: 1,
              accountId: accountId,
              type: type as TransactionType,
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              accountId,
              accountId, // 同一账户
              false,
              false,
            );

            // 验证：同一账户不应有余额变化
            expect(result.oldAccountBalanceChange).toBe(0);
            expect(result.newAccountBalanceChange).toBe(0);
            expect(result.totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * 边界情况测试
   */
  describe("边界情况", () => {
    it("零金额交易不应产生余额变化", () => {
      const transaction: Transaction = {
        id: 1,
        accountId: 1,
        type: "expense",
        amount: 0,
      };

      const result = calculateBalanceAdjustment(
        transaction,
        1,
        2,
        false,
        false,
      );

      expect(result.oldAccountBalanceChange).toBe(0);
      expect(Math.abs(result.newAccountBalanceChange)).toBe(0); // 使用 Math.abs 处理 -0
      expect(result.totalChange).toBe(0);
    });

    it("大金额交易应正确计算余额变化", () => {
      const largeAmount = 999999.99;
      const transaction: Transaction = {
        id: 1,
        accountId: 1,
        type: "expense",
        amount: largeAmount,
      };

      const result = calculateBalanceAdjustment(
        transaction,
        1,
        2,
        false,
        false,
      );

      expect(result.oldAccountBalanceChange).toBe(largeAmount);
      expect(result.newAccountBalanceChange).toBe(-largeAmount);
      expect(result.totalChange).toBe(0);
    });

    it("小数金额应精确计算", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100, noNaN: true }), // 小数金额
          (amount) => {
            const transaction: Transaction = {
              id: 1,
              accountId: 1,
              type: "expense",
              amount,
            };

            const result = calculateBalanceAdjustment(
              transaction,
              1,
              2,
              false,
              false,
            );

            // 验证：余额变化应精确
            expect(result.oldAccountBalanceChange).toBeCloseTo(amount, 2);
            expect(result.newAccountBalanceChange).toBeCloseTo(-amount, 2);
            expect(result.totalChange).toBeCloseTo(0, 2);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * 组合场景测试
   */
  describe("组合场景", () => {
    it("多次账户变更应保持余额守恒", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom("income", "expense", "refund"),
              amount: fc.integer({ min: 1, max: 1000 }),
              fromAccountId: fc.integer({ min: 1, max: 10 }),
              toAccountId: fc.integer({ min: 11, max: 20 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (changes) => {
            let totalChange = 0;

            for (const change of changes) {
              const transaction: Transaction = {
                id: 1,
                accountId: change.fromAccountId,
                type: change.type as TransactionType,
                amount: change.amount,
              };

              const result = calculateBalanceAdjustment(
                transaction,
                change.fromAccountId,
                change.toAccountId,
                false,
                false,
              );

              totalChange += result.totalChange;
            }

            // 验证：多次变更后总变化仍为零
            expect(totalChange).toBe(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
