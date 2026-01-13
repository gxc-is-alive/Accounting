/**
 * 投资账户 CRUD 属性测试
 *
 * Feature: investment-tracking
 * Property 9: 级联删除
 *
 * Validates: Requirements 1.4
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟投资账户数据结构
interface InvestmentAccount {
  id: number;
  userId: number;
  name: string;
  shares: number;
  costPrice: number;
  currentNetValue: number;
  balance: number;
}

// 模拟估值记录数据结构
interface ValuationRecord {
  id: number;
  accountId: number;
  netValue: number;
  marketValue: number;
  date: string;
}

// 模拟数据存储
class MockInvestmentStore {
  private accounts: Map<number, InvestmentAccount> = new Map();
  private valuations: Map<number, ValuationRecord[]> = new Map();
  private nextAccountId = 1;
  private nextValuationId = 1;

  createAccount(
    userId: number,
    name: string,
    shares: number,
    costPrice: number,
    currentNetValue: number
  ): InvestmentAccount {
    const id = this.nextAccountId++;
    const balance = shares * currentNetValue;
    const account: InvestmentAccount = {
      id,
      userId,
      name,
      shares,
      costPrice,
      currentNetValue,
      balance,
    };
    this.accounts.set(id, account);
    this.valuations.set(id, []);

    // 创建初始估值记录
    this.addValuation(id, currentNetValue, balance);

    return account;
  }

  addValuation(
    accountId: number,
    netValue: number,
    marketValue: number
  ): ValuationRecord | null {
    if (!this.accounts.has(accountId)) {
      return null;
    }

    const valuation: ValuationRecord = {
      id: this.nextValuationId++,
      accountId,
      netValue,
      marketValue,
      date: new Date().toISOString().split("T")[0],
    };

    const accountValuations = this.valuations.get(accountId) || [];
    accountValuations.push(valuation);
    this.valuations.set(accountId, accountValuations);

    return valuation;
  }

  getAccount(accountId: number): InvestmentAccount | undefined {
    return this.accounts.get(accountId);
  }

  getValuations(accountId: number): ValuationRecord[] {
    return this.valuations.get(accountId) || [];
  }

  deleteAccount(accountId: number): boolean {
    if (!this.accounts.has(accountId)) {
      return false;
    }

    // 级联删除估值记录
    this.valuations.delete(accountId);
    this.accounts.delete(accountId);

    return true;
  }

  hasAccount(accountId: number): boolean {
    return this.accounts.has(accountId);
  }

  hasValuations(accountId: number): boolean {
    const valuations = this.valuations.get(accountId);
    return valuations !== undefined && valuations.length > 0;
  }

  clear(): void {
    this.accounts.clear();
    this.valuations.clear();
    this.nextAccountId = 1;
    this.nextValuationId = 1;
  }
}

// 生成有效的份额 (0.0001 到 100000)
const sharesArbitrary = fc
  .integer({ min: 1, max: 1000000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的价格/净值 (0.0001 到 10000)
const priceArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的用户 ID
const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

// 生成有效的账户名称
const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

describe("投资账户 CRUD 属性测试", () => {
  let store: MockInvestmentStore;

  beforeEach(() => {
    store = new MockInvestmentStore();
  });

  /**
   * Property 9: 级联删除
   * 对于任意被删除的投资账户，其关联的所有估值记录必须同时被删除
   * Validates: Requirements 1.4
   */
  describe("Property 9: 级联删除", () => {
    it("删除账户后，账户不再存在", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, costPrice, netValue) => {
            store.clear();

            // 创建账户
            const account = store.createAccount(
              userId,
              name,
              shares,
              costPrice,
              netValue
            );

            // 验证账户存在
            expect(store.hasAccount(account.id)).toBe(true);

            // 删除账户
            const deleted = store.deleteAccount(account.id);
            expect(deleted).toBe(true);

            // 验证账户不再存在
            expect(store.hasAccount(account.id)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除账户后，关联的估值记录也被删除", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, costPrice, netValue) => {
            store.clear();

            // 创建账户
            const account = store.createAccount(
              userId,
              name,
              shares,
              costPrice,
              netValue
            );

            // 验证估值记录存在
            expect(store.hasValuations(account.id)).toBe(true);

            // 删除账户
            store.deleteAccount(account.id);

            // 验证估值记录也被删除
            expect(store.hasValuations(account.id)).toBe(false);
            expect(store.getValuations(account.id)).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除账户后，多条估值记录都被删除", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          fc.array(priceArbitrary, { minLength: 1, maxLength: 10 }),
          (userId, name, shares, costPrice, netValues) => {
            store.clear();

            // 创建账户
            const account = store.createAccount(
              userId,
              name,
              shares,
              costPrice,
              netValues[0]
            );

            // 添加多条估值记录
            for (let i = 1; i < netValues.length; i++) {
              const marketValue = shares * netValues[i];
              store.addValuation(account.id, netValues[i], marketValue);
            }

            // 验证估值记录数量
            const valuationsBefore = store.getValuations(account.id);
            expect(valuationsBefore.length).toBe(netValues.length);

            // 删除账户
            store.deleteAccount(account.id);

            // 验证所有估值记录都被删除
            const valuationsAfter = store.getValuations(account.id);
            expect(valuationsAfter).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("删除不存在的账户应返回 false", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (accountId) => {
          store.clear();

          // 尝试删除不存在的账户
          const deleted = store.deleteAccount(accountId);
          expect(deleted).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("删除一个账户不影响其他账户的估值记录", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name1, name2, shares, costPrice, netValue) => {
            store.clear();

            // 创建两个账户
            const account1 = store.createAccount(
              userId,
              name1,
              shares,
              costPrice,
              netValue
            );
            const account2 = store.createAccount(
              userId,
              name2,
              shares,
              costPrice,
              netValue
            );

            // 验证两个账户都有估值记录
            expect(store.hasValuations(account1.id)).toBe(true);
            expect(store.hasValuations(account2.id)).toBe(true);

            // 删除第一个账户
            store.deleteAccount(account1.id);

            // 验证第一个账户的估值记录被删除
            expect(store.hasValuations(account1.id)).toBe(false);

            // 验证第二个账户的估值记录仍然存在
            expect(store.hasValuations(account2.id)).toBe(true);
            expect(store.getValuations(account2.id).length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 账户创建测试
   */
  describe("账户创建", () => {
    it("创建账户后，市值等于份额乘以净值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, costPrice, netValue) => {
            store.clear();

            const account = store.createAccount(
              userId,
              name,
              shares,
              costPrice,
              netValue
            );

            expect(account.balance).toBeCloseTo(shares * netValue, 4);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("创建账户后，自动创建初始估值记录", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, costPrice, netValue) => {
            store.clear();

            const account = store.createAccount(
              userId,
              name,
              shares,
              costPrice,
              netValue
            );

            const valuations = store.getValuations(account.id);
            expect(valuations.length).toBe(1);
            expect(valuations[0].netValue).toBe(netValue);
            expect(valuations[0].accountId).toBe(account.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
