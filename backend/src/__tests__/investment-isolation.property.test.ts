/**
 * 投资账户隔离属性测试
 * Property 8: 投资账户隔离
 * 投资类型账户不能作为普通收支交易的账户
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

// 模拟账户数据结构
interface Account {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
}

// 模拟交易数据结构
interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  type: "income" | "expense" | "transfer";
  amount: number;
}

// 模拟数据存储
class MockStore {
  private accounts: Map<number, Account> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private nextAccountId = 1;
  private nextTransactionId = 1;

  createAccount(
    userId: number,
    name: string,
    type: AccountType,
    balance: number
  ): Account {
    const id = this.nextAccountId++;
    const account: Account = { id, userId, name, type, balance };
    this.accounts.set(id, account);
    return account;
  }

  getAccount(accountId: number): Account | undefined {
    return this.accounts.get(accountId);
  }

  /**
   * 检查账户是否为投资账户
   */
  isInvestmentAccount(accountId: number): boolean {
    const account = this.accounts.get(accountId);
    return account?.type === "investment";
  }

  /**
   * 创建交易（验证投资账户隔离）
   */
  createTransaction(
    userId: number,
    accountId: number,
    type: "income" | "expense" | "transfer",
    amount: number
  ): Transaction {
    const account = this.accounts.get(accountId);

    if (!account) {
      throw new Error("账户不存在");
    }

    if (account.userId !== userId) {
      throw new Error("无权操作此账户");
    }

    // Property 8: 投资账户隔离
    // 投资账户不能用于普通收支交易
    if (
      account.type === "investment" &&
      (type === "income" || type === "expense")
    ) {
      throw new Error("投资账户不能用于普通收支交易");
    }

    const id = this.nextTransactionId++;
    const transaction: Transaction = { id, userId, accountId, type, amount };
    this.transactions.set(id, transaction);

    // 更新账户余额
    if (type === "income") {
      account.balance += amount;
    } else if (type === "expense") {
      account.balance -= amount;
    }
    this.accounts.set(accountId, account);

    return transaction;
  }

  /**
   * 验证账户是否可用于指定交易类型
   */
  canUseForTransaction(
    accountId: number,
    transactionType: "income" | "expense" | "transfer"
  ): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    // 投资账户只能用于转账（买入/卖出时的资金流转）
    if (account.type === "investment") {
      return transactionType === "transfer";
    }

    return true;
  }

  clear(): void {
    this.accounts.clear();
    this.transactions.clear();
    this.nextAccountId = 1;
    this.nextTransactionId = 1;
  }
}

// 生成有效的用户 ID
const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

// 生成有效的账户名称
const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

// 生成有效的金额
const amountArbitrary = fc
  .integer({ min: 1, max: 1000000 })
  .map((n) => n / 100);

// 生成非投资账户类型
const nonInvestmentTypeArbitrary = fc.constantFrom<AccountType>(
  "cash",
  "bank",
  "alipay",
  "wechat",
  "credit",
  "other"
);

// 生成普通交易类型（收入/支出）
const normalTransactionTypeArbitrary = fc.constantFrom<"income" | "expense">(
  "income",
  "expense"
);

describe("投资账户隔离属性测试", () => {
  let store: MockStore;

  beforeEach(() => {
    store = new MockStore();
  });

  /**
   * Property 8: 投资账户隔离
   * 投资类型账户不能作为普通收支交易的账户
   */
  describe("Property 8: 投资账户隔离", () => {
    it("投资账户不能用于收入交易", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          amountArbitrary,
          (userId, name, amount) => {
            store.clear();

            // 创建投资账户
            const account = store.createAccount(
              userId,
              name,
              "investment",
              10000
            );

            // 尝试创建收入交易应该失败
            expect(() => {
              store.createTransaction(userId, account.id, "income", amount);
            }).toThrow("投资账户不能用于普通收支交易");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("投资账户不能用于支出交易", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          amountArbitrary,
          (userId, name, amount) => {
            store.clear();

            // 创建投资账户
            const account = store.createAccount(
              userId,
              name,
              "investment",
              10000
            );

            // 尝试创建支出交易应该失败
            expect(() => {
              store.createTransaction(userId, account.id, "expense", amount);
            }).toThrow("投资账户不能用于普通收支交易");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("非投资账户可以用于收入交易", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          nonInvestmentTypeArbitrary,
          amountArbitrary,
          (userId, name, accountType, amount) => {
            store.clear();

            // 创建非投资账户
            const account = store.createAccount(
              userId,
              name,
              accountType,
              10000
            );

            // 创建收入交易应该成功
            const transaction = store.createTransaction(
              userId,
              account.id,
              "income",
              amount
            );
            expect(transaction).toBeDefined();
            expect(transaction.type).toBe("income");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("非投资账户可以用于支出交易", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          nonInvestmentTypeArbitrary,
          amountArbitrary,
          (userId, name, accountType, amount) => {
            store.clear();

            // 创建非投资账户
            const account = store.createAccount(
              userId,
              name,
              accountType,
              10000
            );

            // 创建支出交易应该成功
            const transaction = store.createTransaction(
              userId,
              account.id,
              "expense",
              amount
            );
            expect(transaction).toBeDefined();
            expect(transaction.type).toBe("expense");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("canUseForTransaction 正确识别投资账户限制", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          normalTransactionTypeArbitrary,
          (userId, name, transactionType) => {
            store.clear();

            // 创建投资账户
            const investmentAccount = store.createAccount(
              userId,
              name,
              "investment",
              10000
            );

            // 投资账户不能用于收入/支出
            expect(
              store.canUseForTransaction(investmentAccount.id, transactionType)
            ).toBe(false);

            // 投资账户可以用于转账
            expect(
              store.canUseForTransaction(investmentAccount.id, "transfer")
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("canUseForTransaction 允许非投资账户用于所有交易类型", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          nonInvestmentTypeArbitrary,
          (userId, name, accountType) => {
            store.clear();

            // 创建非投资账户
            const account = store.createAccount(
              userId,
              name,
              accountType,
              10000
            );

            // 非投资账户可以用于所有交易类型
            expect(store.canUseForTransaction(account.id, "income")).toBe(true);
            expect(store.canUseForTransaction(account.id, "expense")).toBe(
              true
            );
            expect(store.canUseForTransaction(account.id, "transfer")).toBe(
              true
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 用户隔离测试
   */
  describe("用户隔离", () => {
    it("用户不能操作其他用户的投资账户", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          fc.integer({ min: 10001, max: 20000 }), // 确保不同的用户 ID
          nameArbitrary,
          amountArbitrary,
          (userId1, userId2, name, amount) => {
            store.clear();

            // 用户1创建投资账户
            const account = store.createAccount(userId1, name, "cash", 10000);

            // 用户2尝试操作应该失败
            expect(() => {
              store.createTransaction(userId2, account.id, "income", amount);
            }).toThrow("无权操作此账户");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 边界测试
   */
  describe("边界测试", () => {
    it("操作不存在的账户应该失败", () => {
      store.clear();

      expect(() => {
        store.createTransaction(1, 999, "income", 100);
      }).toThrow("账户不存在");
    });

    it("isInvestmentAccount 正确识别账户类型", () => {
      store.clear();

      const investmentAccount = store.createAccount(
        1,
        "基金",
        "investment",
        10000
      );
      const cashAccount = store.createAccount(1, "现金", "cash", 10000);

      expect(store.isInvestmentAccount(investmentAccount.id)).toBe(true);
      expect(store.isInvestmentAccount(cashAccount.id)).toBe(false);
      expect(store.isInvestmentAccount(999)).toBe(false);
    });
  });
});
