/**
 * 余额调整服务
 * 处理快速平账功能：预览差额、执行平账、查询记录
 */

import { Op, Transaction as SequelizeTransaction } from "sequelize";
import { Account, BalanceAdjustment } from "../models";
import sequelize from "../config/database";

// 差额类型
export type DifferenceType = "profit" | "loss" | "none";

// 预览响应
export interface BalancePreviewResponse {
  accountId: number;
  accountName: string;
  currentBalance: number;
  actualBalance: number;
  difference: number;
  differenceType: DifferenceType;
}

// 平账参数
export interface QuickBalanceParams {
  userId: number;
  accountId: number;
  actualBalance: number;
  note?: string;
}

// 平账响应
export interface QuickBalanceResponse {
  id: number;
  accountId: number;
  previousBalance: number;
  newBalance: number;
  difference: number;
  note?: string;
  createdAt: Date;
}

// 查询参数
export interface BalanceAdjustmentFilters {
  accountId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// 记录响应
export interface BalanceAdjustmentRecord {
  id: number;
  accountId: number;
  accountName: string;
  previousBalance: number;
  newBalance: number;
  difference: number;
  differenceType: DifferenceType;
  note?: string;
  createdAt: Date;
}

class BalanceAdjustmentService {
  /**
   * 计算差额
   */
  calculateDifference(actualBalance: number, currentBalance: number): number {
    return actualBalance - currentBalance;
  }

  /**
   * 获取差额类型
   */
  getDifferenceType(difference: number): DifferenceType {
    if (difference > 0) return "profit";
    if (difference < 0) return "loss";
    return "none";
  }

  /**
   * 预览平账差额
   */
  async previewBalance(
    userId: number,
    accountId: number,
    actualBalance: number
  ): Promise<BalancePreviewResponse> {
    // 获取账户
    const account = await Account.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error("账户不存在");
    }

    const currentBalance = account.balance;
    const difference = this.calculateDifference(actualBalance, currentBalance);
    const differenceType = this.getDifferenceType(difference);

    return {
      accountId: account.id,
      accountName: account.name,
      currentBalance,
      actualBalance,
      difference,
      differenceType,
    };
  }

  /**
   * 执行快速平账
   */
  async executeQuickBalance(
    params: QuickBalanceParams
  ): Promise<QuickBalanceResponse> {
    const { userId, accountId, actualBalance, note } = params;

    // 验证实际总额
    if (actualBalance < 0) {
      throw new Error("实际总额不能为负数");
    }

    return await sequelize.transaction(async (t: SequelizeTransaction) => {
      // 获取账户并锁定
      const account = await Account.findOne({
        where: { id: accountId, userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!account) {
        throw new Error("账户不存在");
      }

      const previousBalance = account.balance;
      const difference = this.calculateDifference(
        actualBalance,
        previousBalance
      );

      // 如果差额为零，不需要调整
      if (difference === 0) {
        throw new Error("余额一致，无需调整");
      }

      // 更新账户余额
      account.balance = actualBalance;
      await account.save({ transaction: t });

      // 创建调整记录
      const adjustment = await BalanceAdjustment.create(
        {
          userId,
          accountId,
          previousBalance,
          newBalance: actualBalance,
          difference,
          note,
        },
        { transaction: t }
      );

      return {
        id: adjustment.id,
        accountId: adjustment.accountId,
        previousBalance: adjustment.previousBalance,
        newBalance: adjustment.newBalance,
        difference: adjustment.difference,
        note: adjustment.note,
        createdAt: adjustment.createdAt,
      };
    });
  }

  /**
   * 获取平账记录
   */
  async getRecords(
    userId: number,
    filters: BalanceAdjustmentFilters
  ): Promise<{ records: BalanceAdjustmentRecord[]; total: number }> {
    const where: any = { userId };

    // 账户筛选
    if (filters.accountId !== undefined) {
      where.accountId = filters.accountId;
    }

    // 时间范围筛选
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt[Op.lte] = new Date(filters.endDate + " 23:59:59");
      }
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await BalanceAdjustment.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          as: "account",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset,
    });

    const records = rows.map((record) => this.formatRecordResponse(record));

    return { records, total: count };
  }

  /**
   * 格式化记录响应
   */
  private formatRecordResponse(
    record: BalanceAdjustment
  ): BalanceAdjustmentRecord {
    const account = (record as any).account;

    return {
      id: record.id,
      accountId: record.accountId,
      accountName: account?.name || "",
      previousBalance: record.previousBalance,
      newBalance: record.newBalance,
      difference: record.difference,
      differenceType: this.getDifferenceType(record.difference),
      note: record.note,
      createdAt: record.createdAt,
    };
  }
}

export default new BalanceAdjustmentService();
