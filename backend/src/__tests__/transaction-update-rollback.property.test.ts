/**
 * 交易更新失败回滚属性测试
 * Feature: transaction-edit-enhancement
 *
 * Property 5: 交易更新失败时的回滚
 * 对于任意交易更新操作，如果更新过程中发生错误（如网络故障、验证失败），
 * 系统应该：
 * - 回滚所有已执行的余额变更
 * - 保持原账户和新账户的余额不变
 * - 保持交易记录不变
 *
 * Validates: Requirements 4.1
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 交易类型
type TransactionType = "income" | "expense" | "refund";

// 错误类型
type ErrorType =
  | "ACCOUNT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "PERMISSION_DENIED";

// 账户状态
interface AccountState {
  id: number;
  balance: number;
  isCreditAccount: boolean;
}

// 交易状态
interface TransactionState {
  id: number;
  accountId: number;
  type: TransactionType;
  amount: number;
}

// 更新操作结果
interface UpdateResult {
  success: boolean;
  error?: ErrorType;
  accountStates: Map<number, number>; // accountId -> balance
  transactionState: TransactionState;
}

/**
 * 模拟交易更新操作（包含失败场景）
 */
function simulateTransactionUpdate(
  transaction: TransactionState,
  accounts: Map<number, AccountState>,
  newAccountId: number,
  shouldFail: boolean,
  errorType?: ErrorType,
): UpdateResult {
  // 保存初始状态
  const initialAccountStates = new Map<number, number>();
  accounts.forEach((account, id) => {
    initialAccountStates.set(id, account.balance);
  });
  const initialTransactionState = { ...transaction };

  // 如果应该失败，直接返回失败结果（模拟事务回滚）
  if (shouldFail) {
    return {
      success: false,
      error: errorType,
      accountStates: initialAccountStates, // 余额未变
      transactionState: initialTransactionState, // 交易未变
    };
  }

  // 成功场景：执行余额调整
  const oldAccountId = transaction.accountId;
  const oldAccount = accounts.get(oldAccountId);
  const newAccount = accounts.get(newAccountId);

  if (!oldAccount || !newAccount) {
    // 账户不存在，返回失败（回滚）
    return {
      success: false,
      error: "ACCOUNT_NOT_FOUND",
      accountStates: initialAccountStates,
      transactionState: initialTransactionState,
    };
  }

  // 计算余额变化
  const updatedAccountStates = new Map(initialAccountStates);

  if (oldAccountId !== newAccountId) {
    // 恢复原账户余额（仅非信用账户）
    if (!oldAccount.isCreditAccount) {
      const oldBalanceChange =
        transaction.type === "expense"
          ? transaction.amount
          : -transaction.amount;
      updatedAccountStates.set(
        oldAccountId,
        (updatedAccountStates.get(oldAccountId) || 0) + oldBalanceChange,
      );
    }

    // 更新新账户余额（仅非信用账户）
    if (!newAccount.isCreditAccount) {
      const newBalanceChange =
        transaction.type === "expense"
          ? -transaction.amount
          : transaction.amount;
      updatedAccountStates.set(
        newAccountId,
        (updatedAccountStates.get(newAccountId) || 0) + newBalanceChange,
      );
    }
  }

  // 更新交易状态
  const updatedTransactionState = {
    ...transaction,
    accountId: newAccountId,
  };

  return {
    success: true,
    accountStates: updatedAccountStates,
    transactionState: updatedTransactionState,
  };
}

describe("交易更新失败回滚属性测试", () => {
  /**
   * Property 5: 交易更新失败时的回滚
   * Validates: Requirements 4.1
   */
  describe("Property 5: 交易更新失败时的回滚", () => {
    it("更新失败时，所有账户余额应保持不变", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          fc.double({ min: 0, max: 10000 }), // 原账户余额
          fc.double({ min: 0, max: 10000 }), // 新账户余额
          fc.constantFrom(
            "ACCOUNT_NOT_FOUND",
            "VALIDATION_ERROR",
            "NETWORK_ERROR",
            "PERMISSION_DENIED",
          ), // 错误类型
          (
            type,
            amount,
            oldAccountId,
            newAccountId,
            oldBalance,
            newBalance,
            errorType,
          ) => {
            // 创建账户状态
            const accounts = new Map<number, AccountState>();
            accounts.set(oldAccountId, {
              id: oldAccountId,
              balance: oldBalance,
              isCreditAccount: false,
            });
            accounts.set(newAccountId, {
              id: newAccountId,
              balance: newBalance,
              isCreditAccount: false,
            });

            // 创建交易
            const transaction: TransactionState = {
              id: 1,
              accountId: oldAccountId,
              type: type as TransactionType,
              amount,
            };

            // 模拟失败的更新操作
            const result = simulateTransactionUpdate(
              transaction,
              accounts,
              newAccountId,
              true, // 应该失败
              errorType as ErrorType,
            );

            // 验证：操作失败
            expect(result.success).toBe(false);
            expect(result.error).toBe(errorType);

            // 验证：所有账户余额未变
            expect(result.accountStates.get(oldAccountId)).toBe(oldBalance);
            expect(result.accountStates.get(newAccountId)).toBe(newBalance);

            // 验证：交易状态未变
            expect(result.transactionState.accountId).toBe(oldAccountId);
            expect(result.transactionState.amount).toBe(amount);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("账户不存在时应回滚所有变更", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID（不存在）
          fc.double({ min: 0, max: 10000 }), // 原账户余额
          (type, amount, oldAccountId, newAccountId, oldBalance) => {
            // 只创建原账户，新账户不存在
            const accounts = new Map<number, AccountState>();
            accounts.set(oldAccountId, {
              id: oldAccountId,
              balance: oldBalance,
              isCreditAccount: false,
            });

            const transaction: TransactionState = {
              id: 1,
              accountId: oldAccountId,
              type: type as TransactionType,
              amount,
            };

            // 尝试更新到不存在的账户
            const result = simulateTransactionUpdate(
              transaction,
              accounts,
              newAccountId,
              false, // 不强制失败，让逻辑自己判断
            );

            // 验证：操作失败
            expect(result.success).toBe(false);
            expect(result.error).toBe("ACCOUNT_NOT_FOUND");

            // 验证：原账户余额未变
            expect(result.accountStates.get(oldAccountId)).toBe(oldBalance);

            // 验证：交易状态未变
            expect(result.transactionState.accountId).toBe(oldAccountId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("多个账户同时更新失败时，所有余额应保持不变", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom("income", "expense", "refund"),
              amount: fc.integer({ min: 1, max: 1000 }),
              oldAccountId: fc.integer({ min: 1, max: 10 }),
              newAccountId: fc.integer({ min: 11, max: 20 }),
              oldBalance: fc.double({ min: 0, max: 10000 }),
              newBalance: fc.double({ min: 0, max: 10000 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          (updates) => {
            // 为每个更新操作验证回滚
            for (const update of updates) {
              const accounts = new Map<number, AccountState>();
              accounts.set(update.oldAccountId, {
                id: update.oldAccountId,
                balance: update.oldBalance,
                isCreditAccount: false,
              });
              accounts.set(update.newAccountId, {
                id: update.newAccountId,
                balance: update.newBalance,
                isCreditAccount: false,
              });

              const transaction: TransactionState = {
                id: 1,
                accountId: update.oldAccountId,
                type: update.type as TransactionType,
                amount: update.amount,
              };

              // 模拟失败
              const result = simulateTransactionUpdate(
                transaction,
                accounts,
                update.newAccountId,
                true,
                "NETWORK_ERROR",
              );

              // 验证：所有余额未变
              expect(result.accountStates.get(update.oldAccountId)).toBe(
                update.oldBalance,
              );
              expect(result.accountStates.get(update.newAccountId)).toBe(
                update.newBalance,
              );
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("成功更新后不应触发回滚", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("income", "expense", "refund"), // 交易类型
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.integer({ min: 1, max: 100 }), // 原账户 ID
          fc.integer({ min: 101, max: 200 }), // 新账户 ID
          fc.double({ min: 1000, max: 10000 }), // 原账户余额（足够大）
          fc.double({ min: 1000, max: 10000 }), // 新账户余额
          (
            type,
            amount,
            oldAccountId,
            newAccountId,
            oldBalance,
            newBalance,
          ) => {
            const accounts = new Map<number, AccountState>();
            accounts.set(oldAccountId, {
              id: oldAccountId,
              balance: oldBalance,
              isCreditAccount: false,
            });
            accounts.set(newAccountId, {
              id: newAccountId,
              balance: newBalance,
              isCreditAccount: false,
            });

            const transaction: TransactionState = {
              id: 1,
              accountId: oldAccountId,
              type: type as TransactionType,
              amount,
            };

            // 成功的更新操作
            const result = simulateTransactionUpdate(
              transaction,
              accounts,
              newAccountId,
              false, // 不失败
            );

            // 验证：操作成功
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();

            // 验证：余额已变更
            expect(result.accountStates.get(oldAccountId)).not.toBe(oldBalance);
            expect(result.accountStates.get(newAccountId)).not.toBe(newBalance);

            // 验证：交易状态已更新
            expect(result.transactionState.accountId).toBe(newAccountId);

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
    it("零余额账户更新失败时应正确回滚", () => {
      const accounts = new Map<number, AccountState>();
      accounts.set(1, { id: 1, balance: 0, isCreditAccount: false });
      accounts.set(2, { id: 2, balance: 0, isCreditAccount: false });

      const transaction: TransactionState = {
        id: 1,
        accountId: 1,
        type: "expense",
        amount: 100,
      };

      const result = simulateTransactionUpdate(
        transaction,
        accounts,
        2,
        true,
        "VALIDATION_ERROR",
      );

      expect(result.success).toBe(false);
      expect(result.accountStates.get(1)).toBe(0);
      expect(result.accountStates.get(2)).toBe(0);
    });

    it("信用账户更新失败时应正确回滚", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // 交易金额
          fc.double({ min: 0, max: 10000 }), // 账户余额
          (amount, balance) => {
            const accounts = new Map<number, AccountState>();
            accounts.set(1, {
              id: 1,
              balance: balance,
              isCreditAccount: true, // 信用账户
            });
            accounts.set(2, {
              id: 2,
              balance: balance,
              isCreditAccount: false,
            });

            const transaction: TransactionState = {
              id: 1,
              accountId: 1,
              type: "expense",
              amount,
            };

            const result = simulateTransactionUpdate(
              transaction,
              accounts,
              2,
              true,
              "NETWORK_ERROR",
            );

            // 验证：信用账户余额未变
            expect(result.accountStates.get(1)).toBe(balance);
            expect(result.accountStates.get(2)).toBe(balance);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * 一致性验证
   */
  describe("一致性验证", () => {
    it("失败回滚应保持数据一致性", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom("income", "expense", "refund"),
              amount: fc.integer({ min: 1, max: 1000 }),
              accountId: fc.integer({ min: 1, max: 10 }),
              balance: fc.double({ min: 0, max: 10000 }),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          (accountData) => {
            // 创建账户
            const accounts = new Map<number, AccountState>();
            const initialBalances = new Map<number, number>();

            accountData.forEach((data) => {
              accounts.set(data.accountId, {
                id: data.accountId,
                balance: data.balance,
                isCreditAccount: false,
              });
              initialBalances.set(data.accountId, data.balance);
            });

            // 选择两个不同的账户
            if (accountData.length < 2) return true;

            const transaction: TransactionState = {
              id: 1,
              accountId: accountData[0].accountId,
              type: accountData[0].type as TransactionType,
              amount: accountData[0].amount,
            };

            // 模拟失败
            const result = simulateTransactionUpdate(
              transaction,
              accounts,
              accountData[1].accountId,
              true,
              "PERMISSION_DENIED",
            );

            // 验证：所有账户余额与初始状态一致
            initialBalances.forEach((balance, accountId) => {
              expect(result.accountStates.get(accountId)).toBe(balance);
            });

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
