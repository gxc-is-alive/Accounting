/**
 * 投资净值更新功能属性测试
 * Property 1: 市值计算不变量
 * Property 6: 估值记录持久化
 */

import * as fc from "fast-check";
import { calculateMarketValue } from "../utils/investment";

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
  private investmentAccounts: Map<number, InvestmentAccount> = new Map();
  private valuations: Map<number, ValuationRecord[]> = new Map();
  private nextAccountId = 1;
  private nextValuationId = 1;

  createInvestmentAccount(
    userId: number,
    name: string,
    shares: number,
    costPrice: number,
    currentNetValue: number
  ): InvestmentAccount {
    const id = this.nextAccountId++;
    const balance = calculateMarketValue(shares, currentNetValue);
    const account: InvestmentAccount = {
      id,
      userId,
      name,
      shares,
      costPrice,
      currentNetValue,
      balance,
    };
    this.investmentAccounts.set(id, account);
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
    if (!this.investmentAccounts.has(accountId)) {
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

  getInvestmentAccount(accountId: number): InvestmentAccount | undefined {
    return this.investmentAccounts.get(accountId);
  }

  getValuations(accountId: number): ValuationRecord[] {
    return this.valuations.get(accountId) || [];
  }

  /**
   * 更新净值
   */
  updateNetValue(
    accountId: number,
    userId: number,
    netValue: number
  ): InvestmentAccount {
    // 验证参数
    if (netValue <= 0) {
      throw new Error("净值必须大于0");
    }

    const account = this.investmentAccounts.get(accountId);
    if (!account) {
      throw new Error("投资账户不存在");
    }
    if (account.userId !== userId) {
      throw new Error("无权操作此账户");
    }

    // 更新净值和市值
    account.currentNetValue = netValue;
    account.balance = calculateMarketValue(account.shares, netValue);

    this.investmentAccounts.set(accountId, account);

    // 创建估值记录
    this.addValuation(accountId, netValue, account.balance);

    return { ...account };
  }

  /**
   * 批量更新净值
   */
  updateNetValueBatch(
    userId: number,
    updates: Array<{ accountId: number; netValue: number }>
  ): InvestmentAccount[] {
    const results: InvestmentAccount[] = [];

    for (const update of updates) {
      const result = this.updateNetValue(
        update.accountId,
        userId,
        update.netValue
      );
      results.push(result);
    }

    return results;
  }

  clear(): void {
    this.investmentAccounts.clear();
    this.valuations.clear();
    this.nextAccountId = 1;
    this.nextValuationId = 1;
  }
}

// 生成有效的份额 (0.01 到 100000)
const sharesArbitrary = fc
  .integer({ min: 1, max: 1000000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的价格/净值 (0.01 到 10000)
const priceArbitrary = fc
  .integer({ min: 100, max: 100000000 })
  .map((n) => Number((n / 10000).toFixed(4)));

// 生成有效的用户 ID
const userIdArbitrary = fc.integer({ min: 1, max: 10000 });

// 生成有效的账户名称
const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });

describe("投资净值更新功能属性测试", () => {
  let store: MockInvestmentStore;

  beforeEach(() => {
    store = new MockInvestmentStore();
  });

  /**
   * Property 1: 市值计算不变量
   * 市值 = 份额 × 当前净值
   */
  describe("Property 1: 市值计算不变量", () => {
    it("更新净值后市值等于份额乘以新净值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, initialNetValue, newNetValue) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              initialNetValue,
              initialNetValue
            );

            // 更新净值
            const result = store.updateNetValue(
              account.id,
              userId,
              newNetValue
            );

            // 市值应该等于份额 × 新净值
            const expectedMarketValue = calculateMarketValue(
              shares,
              newNetValue
            );

            expect(result.balance).toBeCloseTo(expectedMarketValue, 2);
            expect(result.currentNetValue).toBe(newNetValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("更新净值不改变份额和成本价", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, costPrice, newNetValue) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              costPrice,
              costPrice
            );

            // 更新净值
            const result = store.updateNetValue(
              account.id,
              userId,
              newNetValue
            );

            // 份额和成本价应该保持不变
            expect(result.shares).toBe(shares);
            expect(result.costPrice).toBe(costPrice);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 估值记录持久化
   * 每次更新净值都应创建估值记录
   */
  describe("Property 6: 估值记录持久化", () => {
    it("更新净值后应创建新的估值记录", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, initialNetValue, newNetValue) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              initialNetValue,
              initialNetValue
            );

            // 初始创建时有一条估值记录
            const initialCount = store.getValuations(account.id).length;
            expect(initialCount).toBe(1);

            // 更新净值
            store.updateNetValue(account.id, userId, newNetValue);

            // 应该有两条估值记录
            const afterUpdateCount = store.getValuations(account.id).length;
            expect(afterUpdateCount).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("估值记录应包含正确的净值和市值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, shares, initialNetValue, newNetValue) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              initialNetValue,
              initialNetValue
            );

            // 更新净值
            store.updateNetValue(account.id, userId, newNetValue);

            // 获取最新的估值记录
            const valuations = store.getValuations(account.id);
            const latestValuation = valuations[valuations.length - 1];

            // 验证估值记录
            expect(latestValuation.netValue).toBe(newNetValue);
            expect(latestValuation.marketValue).toBeCloseTo(
              calculateMarketValue(shares, newNetValue),
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("多次更新净值应创建多条估值记录", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          fc.array(priceArbitrary, { minLength: 1, maxLength: 10 }),
          (userId, name, shares, initialNetValue, netValues) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              initialNetValue,
              initialNetValue
            );

            // 多次更新净值
            for (const netValue of netValues) {
              store.updateNetValue(account.id, userId, netValue);
            }

            // 估值记录数量应该等于 1（初始）+ 更新次数
            const valuations = store.getValuations(account.id);
            expect(valuations.length).toBe(1 + netValues.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * 批量更新测试
   */
  describe("批量更新", () => {
    it("批量更新应更新所有指定账户", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          fc.array(
            fc.record({
              name: nameArbitrary,
              shares: sharesArbitrary,
              costPrice: priceArbitrary,
            }),
            { minLength: 2, maxLength: 5 }
          ),
          priceArbitrary,
          (userId, accountConfigs, newNetValue) => {
            store.clear();

            // 创建多个投资账户
            const accounts = accountConfigs.map((config) =>
              store.createInvestmentAccount(
                userId,
                config.name,
                config.shares,
                config.costPrice,
                config.costPrice
              )
            );

            // 批量更新净值
            const updates = accounts.map((acc) => ({
              accountId: acc.id,
              netValue: newNetValue,
            }));

            const results = store.updateNetValueBatch(userId, updates);

            // 验证所有账户都已更新
            expect(results.length).toBe(accounts.length);
            for (const result of results) {
              expect(result.currentNetValue).toBe(newNetValue);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * 边界测试
   */
  describe("边界测试", () => {
    it("净值为0或负数时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 净值为0
      expect(() => store.updateNetValue(account.id, 1, 0)).toThrow(
        "净值必须大于0"
      );

      // 净值为负数
      expect(() => store.updateNetValue(account.id, 1, -1.5)).toThrow(
        "净值必须大于0"
      );
    });

    it("更新不存在的账户应抛出错误", () => {
      store.clear();

      expect(() => store.updateNetValue(999, 1, 1.5)).toThrow("投资账户不存在");
    });

    it("更新其他用户的账户应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      expect(() => store.updateNetValue(account.id, 2, 1.6)).toThrow(
        "无权操作此账户"
      );
    });
  });

  /**
   * 盈亏变化测试
   */
  describe("盈亏变化", () => {
    it("净值上涨时盈亏增加", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          fc.integer({ min: 1000, max: 100000 }).map((n) => n / 100), // 份额
          fc.integer({ min: 100, max: 10000 }).map((n) => n / 100), // 成本价
          fc.integer({ min: 1, max: 100 }).map((n) => n / 100), // 涨幅
          (userId, name, shares, costPrice, priceIncrease) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              costPrice,
              costPrice
            );

            // 初始盈亏为0
            const initialProfit = account.balance - shares * costPrice;
            expect(initialProfit).toBeCloseTo(0, 2);

            // 净值上涨
            const newNetValue = costPrice + priceIncrease;
            const result = store.updateNetValue(
              account.id,
              userId,
              newNetValue
            );

            // 盈亏应该增加
            const newProfit = result.balance - shares * costPrice;
            expect(newProfit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("净值下跌时盈亏减少", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          fc.integer({ min: 1000, max: 100000 }).map((n) => n / 100), // 份额
          fc.integer({ min: 200, max: 10000 }).map((n) => n / 100), // 成本价（确保足够高）
          fc.integer({ min: 1, max: 100 }).map((n) => n / 100), // 跌幅
          (userId, name, shares, costPrice, priceDecrease) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              shares,
              costPrice,
              costPrice
            );

            // 净值下跌
            const newNetValue = Math.max(0.01, costPrice - priceDecrease);
            if (newNetValue >= costPrice) return; // 跳过无效情况

            const result = store.updateNetValue(
              account.id,
              userId,
              newNetValue
            );

            // 盈亏应该为负
            const newProfit = result.balance - shares * costPrice;
            expect(newProfit).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
