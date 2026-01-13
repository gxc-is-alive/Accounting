/**
 * 投资服务
 * 处理投资账户的 CRUD 操作、买入/卖出、净值更新
 */

import { Transaction as SequelizeTransaction } from "sequelize";
import { Account, Valuation } from "../models";
import sequelize from "../config/database";
import {
  calculateNewCostPrice,
  calculateMarketValue,
  calculateInvestmentStats,
  calculateRealizedProfit,
} from "../utils/investment";

// 投资账户创建参数
interface CreateInvestmentAccountParams {
  userId: number;
  name: string;
  shares: number;
  costPrice: number;
  currentNetValue: number;
  icon?: string;
}

// 投资账户更新参数
interface UpdateInvestmentAccountParams {
  name?: string;
  icon?: string;
}

// 买入参数
interface BuySharesParams {
  accountId: number;
  userId: number;
  shares: number;
  price: number;
  date?: string;
  sourceAccountId?: number; // 资金来源账户（可选）
}

// 卖出参数
interface SellSharesParams {
  accountId: number;
  userId: number;
  shares: number;
  price: number;
  date?: string;
  targetAccountId?: number; // 资金转入账户（可选）
}

// 买入/卖出结果
interface TradeResult {
  account: InvestmentAccountResponse;
  realizedProfit?: number; // 卖出时的实现盈亏
  tradeAmount: number; // 交易金额
}

// 投资账户响应类型
interface InvestmentAccountResponse {
  id: number;
  userId: number;
  name: string;
  type: "investment";
  shares: number;
  costPrice: number;
  currentNetValue: number;
  balance: number;
  icon?: string;
  createdAt: Date;
  // 计算字段
  totalCost: number;
  profit: number;
  profitRate: number;
}

// 投资汇总响应类型
interface InvestmentSummaryResponse {
  totalCost: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
  accounts: InvestmentAccountResponse[];
}

class InvestmentService {
  /**
   * 创建投资账户
   */
  async createInvestmentAccount(
    params: CreateInvestmentAccountParams,
    transaction?: SequelizeTransaction
  ): Promise<InvestmentAccountResponse> {
    const { userId, name, shares, costPrice, currentNetValue, icon } = params;

    // 计算初始市值
    const balance = calculateMarketValue(shares, currentNetValue);

    const account = await Account.create(
      {
        userId,
        name,
        type: "investment",
        balance,
        icon,
        shares,
        costPrice,
        currentNetValue,
      },
      { transaction }
    );

    // 创建初始估值记录
    await Valuation.create(
      {
        accountId: account.id,
        netValue: currentNetValue,
        marketValue: balance,
        date: new Date().toISOString().split("T")[0],
      },
      { transaction }
    );

    return this.formatAccountResponse(account);
  }

  /**
   * 获取用户的所有投资账户
   */
  async getInvestmentAccounts(
    userId: number
  ): Promise<InvestmentSummaryResponse> {
    const accounts = await Account.findAll({
      where: {
        userId,
        type: "investment",
      },
      order: [["createdAt", "DESC"]],
    });

    const formattedAccounts = accounts.map((account) =>
      this.formatAccountResponse(account)
    );

    // 计算汇总
    const totalCost = formattedAccounts.reduce(
      (sum, acc) => sum + acc.totalCost,
      0
    );
    const totalValue = formattedAccounts.reduce(
      (sum, acc) => sum + acc.balance,
      0
    );
    const totalProfit = totalValue - totalCost;
    const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitRate: Math.round(profitRate * 100) / 100,
      accounts: formattedAccounts,
    };
  }

  /**
   * 获取单个投资账户详情
   */
  async getInvestmentAccountById(
    accountId: number,
    userId: number
  ): Promise<InvestmentAccountResponse & { valuationHistory: Valuation[] }> {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
        type: "investment",
      },
    });

    if (!account) {
      throw new Error("投资账户不存在");
    }

    // 获取估值历史
    const valuationHistory = await Valuation.findAll({
      where: { accountId },
      order: [["date", "DESC"]],
      limit: 30, // 最近30条记录
    });

    return {
      ...this.formatAccountResponse(account),
      valuationHistory,
    };
  }

  /**
   * 更新投资账户
   */
  async updateInvestmentAccount(
    accountId: number,
    userId: number,
    params: UpdateInvestmentAccountParams,
    transaction?: SequelizeTransaction
  ): Promise<InvestmentAccountResponse> {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
        type: "investment",
      },
    });

    if (!account) {
      throw new Error("投资账户不存在");
    }

    if (params.name !== undefined) {
      account.name = params.name;
    }
    if (params.icon !== undefined) {
      account.icon = params.icon;
    }

    await account.save({ transaction });

    return this.formatAccountResponse(account);
  }

  /**
   * 删除投资账户（级联删除估值记录）
   */
  async deleteInvestmentAccount(
    accountId: number,
    userId: number,
    transaction?: SequelizeTransaction
  ): Promise<void> {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
        type: "investment",
      },
    });

    if (!account) {
      throw new Error("投资账户不存在");
    }

    // 估值记录会通过外键级联删除
    await account.destroy({ transaction });
  }

  /**
   * 买入份额
   * 更新持仓份额和加权平均成本价
   */
  async buyShares(params: BuySharesParams): Promise<TradeResult> {
    const { accountId, userId, shares, price, date, sourceAccountId } = params;

    // 验证参数
    if (shares <= 0) {
      throw new Error("买入份额必须大于0");
    }
    if (price <= 0) {
      throw new Error("买入价格必须大于0");
    }

    const tradeAmount = shares * price;

    // 使用事务确保数据一致性
    const result = await sequelize.transaction(async (t) => {
      // 获取投资账户
      const account = await Account.findOne({
        where: {
          id: accountId,
          userId,
          type: "investment",
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!account) {
        throw new Error("投资账户不存在");
      }

      const currentShares = account.shares || 0;
      const currentCostPrice = account.costPrice || 0;

      // 计算新的加权平均成本价
      const newCostPrice = calculateNewCostPrice(
        currentShares,
        currentCostPrice,
        shares,
        price
      );

      // 更新份额和成本价
      const newShares = currentShares + shares;
      account.shares = newShares;
      account.costPrice = Math.round(newCostPrice * 10000) / 10000;

      // 更新市值（使用当前净值）
      const currentNetValue = account.currentNetValue || price;
      account.balance = calculateMarketValue(newShares, currentNetValue);

      await account.save({ transaction: t });

      // 如果指定了资金来源账户，扣减余额
      if (sourceAccountId) {
        const sourceAccount = await Account.findOne({
          where: {
            id: sourceAccountId,
            userId,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!sourceAccount) {
          throw new Error("资金来源账户不存在");
        }

        if (sourceAccount.type === "investment") {
          throw new Error("不能从投资账户转出资金");
        }

        // 扣减资金
        await sourceAccount.updateBalance(-tradeAmount, t);
      }

      // 创建估值记录
      const recordDate = date || new Date().toISOString().split("T")[0];
      await Valuation.create(
        {
          accountId,
          netValue: currentNetValue,
          marketValue: account.balance,
          date: recordDate,
        },
        { transaction: t }
      );

      return account;
    });

    return {
      account: this.formatAccountResponse(result),
      tradeAmount,
    };
  }

  /**
   * 卖出份额
   * 验证卖出份额不超过持仓，计算实现盈亏
   */
  async sellShares(params: SellSharesParams): Promise<TradeResult> {
    const { accountId, userId, shares, price, date, targetAccountId } = params;

    // 验证参数
    if (shares <= 0) {
      throw new Error("卖出份额必须大于0");
    }
    if (price <= 0) {
      throw new Error("卖出价格必须大于0");
    }

    const tradeAmount = shares * price;

    // 使用事务确保数据一致性
    const result = await sequelize.transaction(async (t) => {
      // 获取投资账户
      const account = await Account.findOne({
        where: {
          id: accountId,
          userId,
          type: "investment",
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!account) {
        throw new Error("投资账户不存在");
      }

      const currentShares = account.shares || 0;
      const costPrice = account.costPrice || 0;

      // 验证卖出份额不超过持仓
      if (shares > currentShares) {
        throw new Error("卖出份额不能超过持仓份额");
      }

      // 计算实现盈亏
      const realizedProfit = calculateRealizedProfit(shares, price, costPrice);

      // 更新份额（成本价保持不变）
      const newShares = currentShares - shares;
      account.shares = newShares;

      // 更新市值
      const currentNetValue = account.currentNetValue || price;
      account.balance = calculateMarketValue(newShares, currentNetValue);

      // 如果全部卖出，重置成本价
      if (newShares === 0) {
        account.costPrice = 0;
      }

      await account.save({ transaction: t });

      // 如果指定了目标账户，增加余额
      if (targetAccountId) {
        const targetAccount = await Account.findOne({
          where: {
            id: targetAccountId,
            userId,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!targetAccount) {
          throw new Error("目标账户不存在");
        }

        if (targetAccount.type === "investment") {
          throw new Error("不能向投资账户转入资金");
        }

        // 增加资金
        await targetAccount.updateBalance(tradeAmount, t);
      }

      // 创建估值记录
      const recordDate = date || new Date().toISOString().split("T")[0];
      await Valuation.create(
        {
          accountId,
          netValue: currentNetValue,
          marketValue: account.balance,
          date: recordDate,
        },
        { transaction: t }
      );

      return { account, realizedProfit };
    });

    return {
      account: this.formatAccountResponse(result.account),
      realizedProfit: Math.round(result.realizedProfit * 100) / 100,
      tradeAmount,
    };
  }

  /**
   * 更新单个账户净值
   */
  async updateNetValue(
    accountId: number,
    userId: number,
    netValue: number,
    date?: string
  ): Promise<InvestmentAccountResponse> {
    // 验证参数
    if (netValue <= 0) {
      throw new Error("净值必须大于0");
    }

    const account = await Account.findOne({
      where: {
        id: accountId,
        userId,
        type: "investment",
      },
    });

    if (!account) {
      throw new Error("投资账户不存在");
    }

    const shares = account.shares || 0;

    // 更新净值和市值
    account.currentNetValue = netValue;
    account.balance = calculateMarketValue(shares, netValue);

    await account.save();

    // 创建估值记录
    const recordDate = date || new Date().toISOString().split("T")[0];
    await Valuation.create({
      accountId,
      netValue,
      marketValue: account.balance,
      date: recordDate,
    });

    return this.formatAccountResponse(account);
  }

  /**
   * 批量更新净值
   */
  async updateNetValueBatch(
    userId: number,
    updates: Array<{ accountId: number; netValue: number }>,
    date?: string
  ): Promise<InvestmentAccountResponse[]> {
    const results: InvestmentAccountResponse[] = [];

    // 使用事务确保批量更新的原子性
    await sequelize.transaction(async (t) => {
      for (const update of updates) {
        // 验证参数
        if (update.netValue <= 0) {
          throw new Error(`账户 ${update.accountId} 的净值必须大于0`);
        }

        const account = await Account.findOne({
          where: {
            id: update.accountId,
            userId,
            type: "investment",
          },
          transaction: t,
        });

        if (!account) {
          throw new Error(`投资账户 ${update.accountId} 不存在`);
        }

        const shares = account.shares || 0;

        // 更新净值和市值
        account.currentNetValue = update.netValue;
        account.balance = calculateMarketValue(shares, update.netValue);

        await account.save({ transaction: t });

        // 创建估值记录
        const recordDate = date || new Date().toISOString().split("T")[0];
        await Valuation.create(
          {
            accountId: update.accountId,
            netValue: update.netValue,
            marketValue: account.balance,
            date: recordDate,
          },
          { transaction: t }
        );

        results.push(this.formatAccountResponse(account));
      }
    });

    return results;
  }

  /**
   * 检查账户是否为投资账户
   */
  async isInvestmentAccount(accountId: number): Promise<boolean> {
    const account = await Account.findByPk(accountId);
    return account?.type === "investment";
  }

  /**
   * 格式化账户响应
   */
  private formatAccountResponse(account: Account): InvestmentAccountResponse {
    const shares = account.shares || 0;
    const costPrice = account.costPrice || 0;
    const currentNetValue = account.currentNetValue || 0;

    const stats = calculateInvestmentStats(shares, costPrice, currentNetValue);

    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: "investment",
      shares,
      costPrice,
      currentNetValue,
      balance: account.balance,
      icon: account.icon,
      createdAt: account.createdAt,
      totalCost: stats.totalCost,
      profit: stats.profit,
      profitRate: stats.profitRate,
    };
  }
}

export default new InvestmentService();
