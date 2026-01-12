/**
 * 还款服务
 * 提供还款操作、还款历史查询等功能
 */

import { Transaction as SequelizeTransaction } from "sequelize";
import sequelize from "../config/database";
import Account from "../models/Account";
import Transaction from "../models/Transaction";
import creditService from "./credit.service";

// 还款参数接口
export interface CreateRepaymentParams {
  userId: number;
  creditAccountId: number;
  sourceAccountId: number;
  amount: number;
  date: Date;
  note?: string;
  categoryId: number;
  billTypeId: number;
}

// 还款结果接口
export interface RepaymentResult {
  success: boolean;
  transaction?: Transaction;
  newOutstandingBalance: number;
  newAvailableCredit: number;
  error?: string;
}

// 还款错误类
export class RepaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "RepaymentError";
  }
}

class RepaymentService {
  /**
   * 验证还款参数
   */
  private async validateRepayment(
    params: CreateRepaymentParams
  ): Promise<void> {
    const { creditAccountId, sourceAccountId, amount } = params;

    // 验证金额
    if (amount <= 0) {
      throw new RepaymentError("INVALID_AMOUNT", "还款金额必须大于 0", {
        amount,
      });
    }

    // 获取信用账户
    const creditAccount = await Account.findByPk(creditAccountId);
    if (!creditAccount) {
      throw new RepaymentError("INVALID_CREDIT_ACCOUNT", "信用账户不存在", {
        creditAccountId,
      });
    }
    if (!creditAccount.isCreditAccount()) {
      throw new RepaymentError(
        "INVALID_CREDIT_ACCOUNT",
        "目标账户不是信用账户",
        {
          creditAccountId,
          accountType: creditAccount.type,
        }
      );
    }

    // 获取来源账户
    const sourceAccount = await Account.findByPk(sourceAccountId);
    if (!sourceAccount) {
      throw new RepaymentError("INVALID_SOURCE_ACCOUNT", "来源账户不存在", {
        sourceAccountId,
      });
    }
    if (sourceAccount.isCreditAccount()) {
      throw new RepaymentError(
        "INVALID_SOURCE_ACCOUNT",
        "来源账户不能是信用账户",
        {
          sourceAccountId,
          accountType: sourceAccount.type,
        }
      );
    }

    // 验证来源账户余额
    if (sourceAccount.balance < amount) {
      throw new RepaymentError("INSUFFICIENT_BALANCE", "来源账户余额不足", {
        available: sourceAccount.balance,
        required: amount,
      });
    }
  }

  /**
   * 创建还款
   */
  async createRepayment(
    params: CreateRepaymentParams
  ): Promise<RepaymentResult> {
    // 验证参数
    await this.validateRepayment(params);

    const {
      userId,
      creditAccountId,
      sourceAccountId,
      amount,
      date,
      note,
      categoryId,
      billTypeId,
    } = params;

    // 使用事务确保数据一致性
    const t = await sequelize.transaction();

    try {
      // 获取账户
      const creditAccount = await Account.findByPk(creditAccountId, {
        transaction: t,
      });
      const sourceAccount = await Account.findByPk(sourceAccountId, {
        transaction: t,
      });

      if (!creditAccount || !sourceAccount) {
        throw new RepaymentError("ACCOUNT_NOT_FOUND", "账户不存在");
      }

      // 扣减来源账户余额
      await sourceAccount.updateBalance(-amount, t);

      // 创建还款交易记录
      const transaction = await Transaction.create(
        {
          userId,
          accountId: creditAccountId,
          sourceAccountId,
          categoryId,
          billTypeId,
          type: "repayment",
          amount,
          date,
          note: note || "还款",
          isFamily: false,
          familyId: null,
        },
        { transaction: t }
      );

      // 提交事务
      await t.commit();

      // 计算新的待还金额和可用额度
      const newOutstandingBalance =
        await creditService.calculateOutstandingBalance(creditAccountId);
      const newAvailableCredit = creditService.calculateAvailableCredit(
        creditAccount.creditLimit || 0,
        newOutstandingBalance
      );

      return {
        success: true,
        transaction,
        newOutstandingBalance,
        newAvailableCredit,
      };
    } catch (error) {
      // 回滚事务
      await t.rollback();

      if (error instanceof RepaymentError) {
        return {
          success: false,
          newOutstandingBalance: 0,
          newAvailableCredit: 0,
          error: error.message,
        };
      }

      throw error;
    }
  }

  /**
   * 获取还款历史
   */
  async getRepaymentHistory(
    accountId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const { limit = 20, offset = 0 } = options || {};

    const { count, rows } = await Transaction.findAndCountAll({
      where: {
        accountId,
        type: "repayment",
      },
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    });

    return {
      transactions: rows,
      total: count,
    };
  }

  /**
   * 获取用户所有还款历史
   */
  async getUserRepaymentHistory(
    userId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const { limit = 20, offset = 0 } = options || {};

    const { count, rows } = await Transaction.findAndCountAll({
      where: {
        userId,
        type: "repayment",
      },
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    });

    return {
      transactions: rows,
      total: count,
    };
  }

  /**
   * 删除还款记录（需要恢复来源账户余额）
   */
  async deleteRepayment(
    transactionId: number,
    userId: number
  ): Promise<boolean> {
    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.findOne({
        where: {
          id: transactionId,
          userId,
          type: "repayment",
        },
        transaction: t,
      });

      if (!transaction) {
        await t.rollback();
        return false;
      }

      // 恢复来源账户余额
      if (transaction.sourceAccountId) {
        const sourceAccount = await Account.findByPk(
          transaction.sourceAccountId,
          {
            transaction: t,
          }
        );
        if (sourceAccount) {
          await sourceAccount.updateBalance(transaction.amount, t);
        }
      }

      // 删除交易记录
      await transaction.destroy({ transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new RepaymentService();
