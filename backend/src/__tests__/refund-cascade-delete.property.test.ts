/**
 * 退款级联删除属性测试
 *
 * Property 6: 退款级联删除
 * 对于任意支出交易，当该交易被删除时，所有关联的退款记录应同时被删除。
 *
 * Validates: Requirements 3.4
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

// 模拟数据库状态
interface DatabaseState {
  transactions: Map<number, Transaction>;
}

// 创建初始数据库状态
function createInitialState(): DatabaseState {
  return {
    transactions: new Map(),
  };
}

// 添加交易
function addTransaction(
  state: DatabaseState,
  transaction: Transaction
): DatabaseState {
  const newState = {
    transactions: new Map(state.transactions),
  };
  newState.transactions.set(transaction.id, transaction);
  return newState;
}

// 删除交易（模拟级联删除）
function deleteTransactionWithCascade(
  state: DatabaseState,
  transactionId: number
): DatabaseState {
  const newState = {
    transactions: new Map(state.transactions),
  };

  // 删除主交易
  newState.transactions.delete(transactionId);

  // 级联删除所有关联的退款记录
  for (const [id, tx] of newState.transactions) {
    if (tx.originalTransactionId === transactionId) {
      newState.transactions.delete(id);
    }
  }

  return newState;
}

// 获取交易的所有退款记录
function getRefundsForTransaction(
  state: DatabaseState,
  transactionId: number
): Transaction[] {
  const refunds: Transaction[] = [];
  for (const tx of state.transactions.values()) {
    if (tx.originalTransactionId === transactionId && tx.type === "refund") {
      refunds.push(tx);
    }
  }
  return refunds;
}

// 检查交易是否存在
function transactionExists(
  state: DatabaseState,
  transactionId: number
): boolean {
  return state.transactions.has(transactionId);
}

// 生成有效的金额
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成支出交易
const expenseTransactionArbitrary = (id: number) =>
  fc.record({
    id: fc.constant(id),
    type: fc.constant("expense" as const),
    amount: amountArbitrary,
    originalTransactionId: fc.constant(null),
  });

// 生成退款交易
const refundTransactionArbitrary = (id: number, originalId: number) =>
  fc.record({
    id: fc.constant(id),
    type: fc.constant("refund" as const),
    amount: amountArbitrary,
    originalTransactionId: fc.constant(originalId),
  });

describe("退款级联删除属性测试", () => {
  /**
   * Property 6: 退款级联删除
   * 对于任意支出交易，当该交易被删除时，所有关联的退款记录应同时被删除。
   * Validates: Requirements 3.4
   */
  describe("Property 6: 退款级联删除", () => {
    it("**Feature: refund, Property 6: 退款级联删除** - 删除支出交易时，所有关联退款应被删除", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // 退款数量
          amountArbitrary, // 原交易金额
          (refundCount, originalAmount) => {
            // 创建初始状态
            let state = createInitialState();

            // 添加原始支出交易
            const originalTx: Transaction = {
              id: 1,
              type: "expense",
              amount: originalAmount,
              originalTransactionId: null,
            };
            state = addTransaction(state, originalTx);

            // 添加多个退款交易
            for (let i = 0; i < refundCount; i++) {
              const refundTx: Transaction = {
                id: 100 + i,
                type: "refund",
                amount: originalAmount / (refundCount + 1),
                originalTransactionId: 1,
              };
              state = addTransaction(state, refundTx);
            }

            // 验证退款记录存在
            const refundsBefore = getRefundsForTransaction(state, 1);
            expect(refundsBefore.length).toBe(refundCount);

            // 删除原始交易
            state = deleteTransactionWithCascade(state, 1);

            // 验证原始交易已删除
            expect(transactionExists(state, 1)).toBe(false);

            // 验证所有退款记录已删除
            const refundsAfter = getRefundsForTransaction(state, 1);
            expect(refundsAfter.length).toBe(0);

            // 验证退款交易不再存在
            for (let i = 0; i < refundCount; i++) {
              expect(transactionExists(state, 100 + i)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除支出交易不影响其他无关交易", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // 退款数量
          fc.integer({ min: 1, max: 10 }), // 其他交易数量
          amountArbitrary,
          (refundCount, otherCount, amount) => {
            let state = createInitialState();

            // 添加原始支出交易
            const originalTx: Transaction = {
              id: 1,
              type: "expense",
              amount: amount,
              originalTransactionId: null,
            };
            state = addTransaction(state, originalTx);

            // 添加退款交易
            for (let i = 0; i < refundCount; i++) {
              const refundTx: Transaction = {
                id: 100 + i,
                type: "refund",
                amount: amount / (refundCount + 1),
                originalTransactionId: 1,
              };
              state = addTransaction(state, refundTx);
            }

            // 添加其他无关交易
            for (let i = 0; i < otherCount; i++) {
              const otherTx: Transaction = {
                id: 200 + i,
                type: "expense",
                amount: amount,
                originalTransactionId: null,
              };
              state = addTransaction(state, otherTx);
            }

            // 删除原始交易
            state = deleteTransactionWithCascade(state, 1);

            // 验证其他交易仍然存在
            for (let i = 0; i < otherCount; i++) {
              expect(transactionExists(state, 200 + i)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除没有退款的支出交易应正常工作", () => {
      fc.assert(
        fc.property(amountArbitrary, (amount) => {
          let state = createInitialState();

          // 添加支出交易（无退款）
          const tx: Transaction = {
            id: 1,
            type: "expense",
            amount: amount,
            originalTransactionId: null,
          };
          state = addTransaction(state, tx);

          // 验证交易存在
          expect(transactionExists(state, 1)).toBe(true);

          // 删除交易
          state = deleteTransactionWithCascade(state, 1);

          // 验证交易已删除
          expect(transactionExists(state, 1)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("删除退款交易不会影响原始交易", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          amountArbitrary,
          (originalAmount, refundAmount) => {
            let state = createInitialState();

            // 添加原始支出交易
            const originalTx: Transaction = {
              id: 1,
              type: "expense",
              amount: originalAmount,
              originalTransactionId: null,
            };
            state = addTransaction(state, originalTx);

            // 添加退款交易
            const refundTx: Transaction = {
              id: 100,
              type: "refund",
              amount: Math.min(refundAmount, originalAmount),
              originalTransactionId: 1,
            };
            state = addTransaction(state, refundTx);

            // 删除退款交易
            state = deleteTransactionWithCascade(state, 100);

            // 验证退款已删除
            expect(transactionExists(state, 100)).toBe(false);

            // 验证原始交易仍然存在
            expect(transactionExists(state, 1)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
