/**
 * 投资卖出功能属性测试
 * Property 3: 卖出份额约束
 * Property 4: 卖出盈亏计算
 * Property 1: 市值计算不变量
 */

import * as fc from "fast-check";
import {
  calculateMarketValue,
  calculateRealizedProfit,
} from "../utils/investment";

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

// 模拟普通账户数据结构
interface NormalAccount {
  id: number;
  userId: number;
  name: string;
  type: string;
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

// 卖出结果
interface SellResult {
  account: InvestmentAccount;
  realizedProfit: number;
  tradeAmount: number;
}

// 模拟数据存储
class MockInvestmentStore {
  private investmentAccounts: Map<number, InvestmentAccount> = new Map();
  private normalAccounts: Map<number, NormalAccount> = new Map();
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

  createNormalAccount(
    userId: number,
    name: string,
    type: string,
    balance: number
  ): NormalAccount {
    const id = this.nextAccountId++;
    const account: NormalAccount = {
      id,
      userId,
      name,
      type,
      balance,
    };
    this.normalAccounts.set(id, account);
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

  getNormalAccount(accountId: number): NormalAccount | undefined {
    return this.normalAccounts.get(accountId);
  }

  getValuations(accountId: number): ValuationRecord[] {
    return this.valuations.get(accountId) || [];
  }

  /**
   * 卖出份额
   */
  sellShares(
    accountId: number,
    userId: number,
    shares: number,
    price: number,
    targetAccountId?: number
  ): SellResult {
    // 验证参数
    if (shares <= 0) {
      throw new Error("卖出份额必须大于0");
    }
    if (price <= 0) {
      throw new Error("卖出价格必须大于0");
    }

    const account = this.investmentAccounts.get(accountId);
    if (!account) {
      throw new Error("投资账户不存在");
    }
    if (account.userId !== userId) {
      throw new Error("无权操作此账户");
    }

    // 验证卖出份额不超过持仓
    if (shares > account.shares) {
      throw new Error("卖出份额不能超过持仓份额");
    }

    const tradeAmount = shares * price;

    // 计算实现盈亏
    const realizedProfit = calculateRealizedProfit(
      shares,
      price,
      account.costPrice
    );

    // 更新份额（成本价保持不变）
    account.shares -= shares;

    // 更新市值
    account.balance = calculateMarketValue(
      account.shares,
      account.currentNetValue
    );

    // 如果全部卖出，重置成本价
    if (account.shares === 0) {
      account.costPrice = 0;
    }

    this.investmentAccounts.set(accountId, account);

    // 如果指定了目标账户，增加余额
    if (targetAccountId !== undefined) {
      const targetAccount = this.normalAccounts.get(targetAccountId);
      if (!targetAccount) {
        // 检查是否是投资账户
        if (this.investmentAccounts.has(targetAccountId)) {
          throw new Error("不能向投资账户转入资金");
        }
        throw new Error("目标账户不存在");
      }
      if (targetAccount.userId !== userId) {
        throw new Error("无权操作目标账户");
      }

      // 增加资金
      targetAccount.balance += tradeAmount;
      this.normalAccounts.set(targetAccountId, targetAccount);
    }

    // 创建估值记录
    this.addValuation(accountId, account.currentNetValue, account.balance);

    return {
      account: { ...account },
      realizedProfit: Math.round(realizedProfit * 100) / 100,
      tradeAmount,
    };
  }

  clear(): void {
    this.investmentAccounts.clear();
    this.normalAccounts.clear();
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

// 生成有效的余额 (0 到 1000000)
const balanceArbitrary = fc
  .integer({ min: 0, max: 10000000000 })
  .map((n) => Number((n / 10000).toFixed(2)));

describe("投资卖出功能属性测试", () => {
  let store: MockInvestmentStore;

  beforeEach(() => {
    store = new MockInvestmentStore();
  });

  /**
   * Property 3: 卖出份额约束
   * 卖出份额不能超过持仓份额
   */
  describe("Property 3: 卖出份额约束", () => {
    it("卖出份额不超过持仓时应成功", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice, sellPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 生成不超过持仓的卖出份额
            const sellShares = initialShares * Math.random();
            if (sellShares <= 0) return; // 跳过无效情况

            // 执行卖出
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            // 验证剩余份额
            expect(result.account.shares).toBeCloseTo(
              initialShares - sellShares,
              4
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("卖出全部份额后，份额应为0", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice, sellPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 卖出全部份额
            const result = store.sellShares(
              account.id,
              userId,
              initialShares,
              sellPrice
            );

            // 验证份额为0
            expect(result.account.shares).toBe(0);
            // 验证成本价重置为0
            expect(result.account.costPrice).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("卖出份额超过持仓时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 尝试卖出超过持仓的份额
      expect(() => store.sellShares(account.id, 1, 150, 1.5)).toThrow(
        "卖出份额不能超过持仓份额"
      );
    });
  });

  /**
   * Property 4: 卖出盈亏计算
   * 实现盈亏 = 卖出份额 × (卖出价格 - 成本价)
   */
  describe("Property 4: 卖出盈亏计算", () => {
    it("卖出盈亏等于份额乘以价差", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice, sellPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 卖出部分份额
            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            // 计算预期盈亏
            const expectedProfit = calculateRealizedProfit(
              sellShares,
              sellPrice,
              costPrice
            );

            // 验证盈亏
            expect(result.realizedProfit).toBeCloseTo(expectedProfit, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("卖出价格等于成本价时，盈亏为0", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 以成本价卖出
            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              costPrice
            );

            // 验证盈亏为0
            expect(result.realizedProfit).toBeCloseTo(0, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("卖出价格高于成本价时，盈亏为正", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          fc.integer({ min: 1000, max: 1000000 }).map((n) => n / 100), // 使用更大的份额避免精度问题
          fc.integer({ min: 100, max: 10000 }).map((n) => n / 100), // 成本价
          fc.integer({ min: 10, max: 1000 }).map((n) => n / 100), // 正的价差
          (userId, name, initialShares, costPrice, priceDiff) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 以高于成本价卖出
            const sellPrice = costPrice + priceDiff;
            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            // 验证盈亏为正
            expect(result.realizedProfit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("卖出价格低于成本价时，盈亏为负", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          fc.integer({ min: 1000, max: 1000000 }).map((n) => n / 100), // 使用更大的份额避免精度问题
          fc.integer({ min: 200, max: 10000 }).map((n) => n / 100), // 确保成本价足够高
          fc.integer({ min: 10, max: 100 }).map((n) => n / 100), // 正的价差
          (userId, name, initialShares, costPrice, priceDiff) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 以低于成本价卖出
            const sellPrice = Math.max(0.01, costPrice - priceDiff);
            if (sellPrice >= costPrice) return; // 跳过无效情况

            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            // 验证盈亏为负
            expect(result.realizedProfit).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 1: 市值计算不变量
   * 市值 = 份额 × 当前净值
   */
  describe("Property 1: 市值计算不变量", () => {
    it("卖出后市值等于剩余份额乘以净值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice, sellPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 卖出部分份额
            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            // 市值应该等于剩余份额 × 净值
            const expectedMarketValue = calculateMarketValue(
              result.account.shares,
              result.account.currentNetValue
            );

            expect(result.account.balance).toBeCloseTo(expectedMarketValue, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 账户联动一致性
   * 卖出时，目标账户余额增加的金额等于交易金额
   */
  describe("账户联动一致性", () => {
    it("卖出时目标账户余额正确增加", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          balanceArbitrary,
          (
            userId,
            name,
            initialShares,
            costPrice,
            sellPrice,
            targetBalance
          ) => {
            store.clear();

            // 创建目标账户
            const targetAccount = store.createNormalAccount(
              userId,
              "银行卡",
              "bank",
              targetBalance
            );

            // 创建投资账户
            const investmentAccount = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            // 卖出部分份额
            const sellShares = initialShares / 2;
            const tradeAmount = sellShares * sellPrice;

            store.sellShares(
              investmentAccount.id,
              userId,
              sellShares,
              sellPrice,
              targetAccount.id
            );

            // 验证目标账户余额增加
            const updatedTargetAccount = store.getNormalAccount(
              targetAccount.id
            );
            expect(updatedTargetAccount!.balance).toBeCloseTo(
              targetBalance + tradeAmount,
              2
            );
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
    it("卖出份额为0或负数时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 份额为0
      expect(() => store.sellShares(account.id, 1, 0, 1.5)).toThrow(
        "卖出份额必须大于0"
      );

      // 份额为负数
      expect(() => store.sellShares(account.id, 1, -10, 1.5)).toThrow(
        "卖出份额必须大于0"
      );
    });

    it("卖出价格为0或负数时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 价格为0
      expect(() => store.sellShares(account.id, 1, 50, 0)).toThrow(
        "卖出价格必须大于0"
      );

      // 价格为负数
      expect(() => store.sellShares(account.id, 1, 50, -1.5)).toThrow(
        "卖出价格必须大于0"
      );
    });

    it("不能向投资账户转入资金", () => {
      store.clear();

      const investmentAccount1 = store.createInvestmentAccount(
        1,
        "基金A",
        100,
        1.5,
        1.5
      );

      const investmentAccount2 = store.createInvestmentAccount(
        1,
        "基金B",
        100,
        1.0,
        1.0
      );

      expect(() =>
        store.sellShares(
          investmentAccount1.id,
          1,
          50,
          1.5,
          investmentAccount2.id
        )
      ).toThrow("不能向投资账户转入资金");
    });

    it("卖出后应创建估值记录", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 初始创建时有一条估值记录
      const initialCount = store.getValuations(account.id).length;
      expect(initialCount).toBe(1);

      // 执行卖出
      store.sellShares(account.id, 1, 50, 1.6);

      // 卖出后应该有两条估值记录
      const afterSellCount = store.getValuations(account.id).length;
      expect(afterSellCount).toBe(2);
    });
  });

  /**
   * 交易金额计算
   */
  describe("交易金额计算", () => {
    it("交易金额等于份额乘以价格", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          priceArbitrary,
          (userId, name, initialShares, costPrice, sellPrice) => {
            store.clear();

            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              costPrice,
              costPrice
            );

            const sellShares = initialShares / 2;
            const result = store.sellShares(
              account.id,
              userId,
              sellShares,
              sellPrice
            );

            expect(result.tradeAmount).toBeCloseTo(sellShares * sellPrice, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
