/**
 * 投资买入功能属性测试
 * Property 2: 加权平均成本计算
 * Property 1: 市值计算不变量
 * Property 7: 账户联动一致性
 */

import * as fc from "fast-check";
import {
  calculateNewCostPrice,
  calculateMarketValue,
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

// 买入结果
interface BuyResult {
  account: InvestmentAccount;
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
   * 买入份额
   */
  buyShares(
    accountId: number,
    userId: number,
    shares: number,
    price: number,
    sourceAccountId?: number
  ): BuyResult {
    // 验证参数
    if (shares <= 0) {
      throw new Error("买入份额必须大于0");
    }
    if (price <= 0) {
      throw new Error("买入价格必须大于0");
    }

    const account = this.investmentAccounts.get(accountId);
    if (!account) {
      throw new Error("投资账户不存在");
    }
    if (account.userId !== userId) {
      throw new Error("无权操作此账户");
    }

    const tradeAmount = shares * price;

    // 如果指定了资金来源账户
    if (sourceAccountId !== undefined) {
      const sourceAccount = this.normalAccounts.get(sourceAccountId);
      if (!sourceAccount) {
        // 检查是否是投资账户
        if (this.investmentAccounts.has(sourceAccountId)) {
          throw new Error("不能从投资账户转出资金");
        }
        throw new Error("资金来源账户不存在");
      }
      if (sourceAccount.userId !== userId) {
        throw new Error("无权操作资金来源账户");
      }

      // 扣减资金
      sourceAccount.balance -= tradeAmount;
      this.normalAccounts.set(sourceAccountId, sourceAccount);
    }

    // 计算新的加权平均成本价
    const newCostPrice = calculateNewCostPrice(
      account.shares,
      account.costPrice,
      shares,
      price
    );

    // 更新份额和成本价
    account.shares += shares;
    account.costPrice = Math.round(newCostPrice * 10000) / 10000;

    // 更新市值
    account.balance = calculateMarketValue(
      account.shares,
      account.currentNetValue
    );

    this.investmentAccounts.set(accountId, account);

    // 创建估值记录
    this.addValuation(accountId, account.currentNetValue, account.balance);

    return {
      account: { ...account },
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

// 生成有效的余额 (10000 到 1000000)
const balanceArbitrary = fc
  .integer({ min: 100000000, max: 10000000000 })
  .map((n) => Number((n / 10000).toFixed(2)));

describe("投资买入功能属性测试", () => {
  let store: MockInvestmentStore;

  beforeEach(() => {
    store = new MockInvestmentStore();
  });

  /**
   * Property 2: 加权平均成本计算
   * 买入后的成本价应该等于加权平均值
   */
  describe("Property 2: 加权平均成本计算", () => {
    it("买入后成本价等于加权平均值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          sharesArbitrary,
          priceArbitrary,
          (userId, name, initialShares, initialPrice, buyShares, buyPrice) => {
            store.clear();

            // 创建初始投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              initialPrice,
              initialPrice
            );

            // 执行买入
            const result = store.buyShares(
              account.id,
              userId,
              buyShares,
              buyPrice
            );

            // 计算预期的加权平均成本价
            const expectedCostPrice = calculateNewCostPrice(
              initialShares,
              initialPrice,
              buyShares,
              buyPrice
            );

            // 验证成本价（允许小数精度误差）
            expect(result.account.costPrice).toBeCloseTo(expectedCostPrice, 2);

            // 验证份额增加
            expect(result.account.shares).toBeCloseTo(
              initialShares + buyShares,
              4
            );
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
    it("买入后市值等于份额乘以净值", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          sharesArbitrary,
          priceArbitrary,
          (userId, name, initialShares, initialPrice, buyShares, buyPrice) => {
            store.clear();

            // 创建投资账户
            const account = store.createInvestmentAccount(
              userId,
              name,
              initialShares,
              initialPrice,
              initialPrice
            );

            // 执行买入
            const result = store.buyShares(
              account.id,
              userId,
              buyShares,
              buyPrice
            );

            // 市值应该等于份额 × 净值
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
   * Property 7: 账户联动一致性
   * 从资金账户买入时，资金账户余额减少的金额等于交易金额
   */
  describe("Property 7: 账户联动一致性", () => {
    it("买入时资金账户余额正确扣减", () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          nameArbitrary,
          sharesArbitrary,
          priceArbitrary,
          balanceArbitrary,
          (userId, name, buyShares, buyPrice, sourceBalance) => {
            store.clear();

            // 创建资金来源账户
            const sourceAccount = store.createNormalAccount(
              userId,
              "银行卡",
              "bank",
              sourceBalance
            );

            // 创建投资账户
            const investmentAccount = store.createInvestmentAccount(
              userId,
              name,
              0,
              0,
              buyPrice
            );

            const tradeAmount = buyShares * buyPrice;

            // 执行买入（从资金账户扣款）
            store.buyShares(
              investmentAccount.id,
              userId,
              buyShares,
              buyPrice,
              sourceAccount.id
            );

            // 验证资金账户余额减少
            const updatedSourceAccount = store.getNormalAccount(
              sourceAccount.id
            );
            expect(updatedSourceAccount!.balance).toBeCloseTo(
              sourceBalance - tradeAmount,
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
    it("买入份额为0或负数时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 份额为0
      expect(() => store.buyShares(account.id, 1, 0, 1.5)).toThrow(
        "买入份额必须大于0"
      );

      // 份额为负数
      expect(() => store.buyShares(account.id, 1, -10, 1.5)).toThrow(
        "买入份额必须大于0"
      );
    });

    it("买入价格为0或负数时应抛出错误", () => {
      store.clear();

      const account = store.createInvestmentAccount(
        1,
        "测试基金",
        100,
        1.5,
        1.5
      );

      // 价格为0
      expect(() => store.buyShares(account.id, 1, 100, 0)).toThrow(
        "买入价格必须大于0"
      );

      // 价格为负数
      expect(() => store.buyShares(account.id, 1, 100, -1.5)).toThrow(
        "买入价格必须大于0"
      );
    });

    it("不能从投资账户作为资金来源", () => {
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
        0,
        0,
        1.0
      );

      expect(() =>
        store.buyShares(
          investmentAccount2.id,
          1,
          50,
          1.0,
          investmentAccount1.id
        )
      ).toThrow("不能从投资账户转出资金");
    });

    it("买入后应创建估值记录", () => {
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

      // 执行买入
      store.buyShares(account.id, 1, 50, 1.6);

      // 买入后应该有两条估值记录
      const afterBuyCount = store.getValuations(account.id).length;
      expect(afterBuyCount).toBe(2);
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
          (userId, name, buyShares, buyPrice) => {
            store.clear();

            const account = store.createInvestmentAccount(
              userId,
              name,
              0,
              0,
              buyPrice
            );

            const result = store.buyShares(
              account.id,
              userId,
              buyShares,
              buyPrice
            );

            expect(result.tradeAmount).toBeCloseTo(buyShares * buyPrice, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
