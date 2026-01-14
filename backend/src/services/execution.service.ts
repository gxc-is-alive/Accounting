/**
 * 执行服务
 * 处理定投执行（本质是定时转账）、单次买入转换、执行记录查询
 */

import { Transaction as SequelizeTransaction, Op } from "sequelize";
import {
  Account,
  AutoInvestmentPlan,
  ExecutionRecord,
  InvestmentReminder,
} from "../models";
import sequelize from "../config/database";
import autoInvestmentPlanService from "./autoInvestmentPlan.service";

// 单次买入参数
interface OneTimeBuyParams {
  userId: number;
  sourceAccountId: number;
  targetAccountId: number;
  paidAmount: number; // 实际支付金额
  investedAmount: number; // 获得的投资金额
  date?: string;
}

// 执行记录筛选参数
interface RecordFilters {
  planId?: number;
  startDate?: string;
  endDate?: string;
  status?: "success" | "failed";
  page?: number;
  pageSize?: number;
}

// 执行记录响应类型
interface ExecutionRecordResponse {
  id: number;
  planId: number | null;
  userId: number;
  sourceAccountId: number;
  targetAccountId: number;
  paidAmount: number;
  investedAmount: number;
  discountRate: number;
  shares: number;
  netValue: number;
  status: "success" | "failed";
  failReason?: string;
  executedAt: Date;
  createdAt: Date;
  // 关联数据
  plan?: {
    id: number;
    name: string;
  };
  sourceAccount?: {
    id: number;
    name: string;
  };
  targetAccount?: {
    id: number;
    name: string;
  };
}

// 执行结果
interface ExecutionResult {
  success: boolean;
  record: ExecutionRecordResponse;
  error?: string;
}

class ExecutionService {
  /**
   * 执行定投计划（本质是从来源账户转账到目标账户）
   */
  async executePlan(plan: AutoInvestmentPlan): Promise<ExecutionResult> {
    const executedAt = new Date();

    try {
      const result = await sequelize.transaction(async (t) => {
        // 获取来源账户
        const sourceAccount = await Account.findOne({
          where: { id: plan.sourceAccountId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!sourceAccount) {
          throw new Error("资金来源账户不存在");
        }

        // 检查余额
        if (sourceAccount.balance < plan.amount) {
          // 余额不足，记录失败
          const failRecord = await this.createFailedRecord(
            plan,
            "余额不足",
            executedAt,
            t
          );

          // 创建提醒
          await InvestmentReminder.create(
            {
              userId: plan.userId,
              planId: plan.id,
              type: "execution_failed",
              message: `定投计划"${plan.name}"执行失败：资金来源账户余额不足`,
            },
            { transaction: t }
          );

          return { success: false, record: failRecord, error: "余额不足" };
        }

        // 获取目标账户
        const targetAccount = await Account.findOne({
          where: { id: plan.targetAccountId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!targetAccount) {
          throw new Error("目标账户不存在");
        }

        // 扣减来源账户余额
        await sourceAccount.updateBalance(-plan.amount, t);

        // 增加目标账户余额（简单转账，不计算份额）
        await targetAccount.updateBalance(plan.amount, t);

        // 创建执行记录
        const record = await ExecutionRecord.create(
          {
            planId: plan.id,
            userId: plan.userId,
            sourceAccountId: plan.sourceAccountId,
            targetAccountId: plan.targetAccountId,
            paidAmount: plan.amount,
            investedAmount: plan.amount,
            discountRate: 1.0,
            shares: 0, // 简化版不计算份额
            netValue: 0, // 简化版不记录净值
            status: "success",
            executedAt,
          },
          { transaction: t }
        );

        // 更新下次执行日期
        await autoInvestmentPlanService.updateNextExecutionDate(plan, t);

        return {
          success: true,
          record: this.formatRecordResponse(
            record,
            plan,
            sourceAccount,
            targetAccount
          ),
        };
      });

      return result;
    } catch (error: any) {
      // 创建失败记录
      const failRecord = await this.createFailedRecord(
        plan,
        error.message,
        executedAt
      );

      return { success: false, record: failRecord, error: error.message };
    }
  }

  /**
   * 单次买入转换（支持折扣，如95元买100元基金）
   */
  async executeOneTimeBuy(params: OneTimeBuyParams): Promise<ExecutionResult> {
    const {
      userId,
      sourceAccountId,
      targetAccountId,
      paidAmount,
      investedAmount,
      date,
    } = params;

    // 验证参数
    if (paidAmount <= 0) {
      throw new Error("实际支付金额必须大于0");
    }
    if (investedAmount <= 0) {
      throw new Error("获得的金额必须大于0");
    }

    const executedAt = date ? new Date(date) : new Date();

    try {
      const result = await sequelize.transaction(async (t) => {
        // 获取来源账户
        const sourceAccount = await Account.findOne({
          where: { id: sourceAccountId, userId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!sourceAccount) {
          throw new Error("资金来源账户不存在");
        }

        // 检查余额
        if (sourceAccount.balance < paidAmount) {
          throw new Error("资金来源账户余额不足");
        }

        // 获取目标账户
        const targetAccount = await Account.findOne({
          where: { id: targetAccountId, userId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!targetAccount) {
          throw new Error("目标账户不存在");
        }

        // 计算折扣率
        const discountRate = this.calculateDiscountRate(
          paidAmount,
          investedAmount
        );

        // 扣减来源账户余额（扣减实际支付金额）
        await sourceAccount.updateBalance(-paidAmount, t);

        // 增加目标账户余额（增加获得的金额）
        await targetAccount.updateBalance(investedAmount, t);

        // 创建执行记录
        const record = await ExecutionRecord.create(
          {
            planId: null, // 单次买入没有关联计划
            userId,
            sourceAccountId,
            targetAccountId,
            paidAmount,
            investedAmount,
            discountRate,
            shares: 0, // 简化版不计算份额
            netValue: 0, // 简化版不记录净值
            status: "success",
            executedAt,
          },
          { transaction: t }
        );

        return {
          success: true,
          record: this.formatRecordResponse(
            record,
            null,
            sourceAccount,
            targetAccount
          ),
        };
      });

      return result;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * 获取执行记录
   */
  async getRecords(
    userId: number,
    filters: RecordFilters
  ): Promise<{ records: ExecutionRecordResponse[]; total: number }> {
    const where: any = { userId };

    if (filters.planId !== undefined) {
      where.planId = filters.planId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.executedAt = {};
      if (filters.startDate) {
        where.executedAt[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.executedAt[Op.lte] = new Date(filters.endDate + " 23:59:59");
      }
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    const { rows, count } = await ExecutionRecord.findAndCountAll({
      where,
      include: [
        { model: AutoInvestmentPlan, as: "plan", attributes: ["id", "name"] },
        { model: Account, as: "sourceAccount", attributes: ["id", "name"] },
        { model: Account, as: "targetAccount", attributes: ["id", "name"] },
      ],
      order: [["executedAt", "DESC"]],
      limit: pageSize,
      offset,
    });

    return {
      records: rows.map((record) => this.formatRecordResponse(record)),
      total: count,
    };
  }

  /**
   * 获取计划的执行记录
   */
  async getRecordsByPlanId(
    planId: number,
    userId: number
  ): Promise<ExecutionRecordResponse[]> {
    const records = await ExecutionRecord.findAll({
      where: { planId, userId },
      include: [
        { model: Account, as: "sourceAccount", attributes: ["id", "name"] },
        { model: Account, as: "targetAccount", attributes: ["id", "name"] },
      ],
      order: [["executedAt", "DESC"]],
    });

    return records.map((record) => this.formatRecordResponse(record));
  }

  /**
   * 计算份额
   */
  calculateShares(amount: number, netValue: number): number {
    // 份额 = 金额 / 净值，保留4位小数
    return Math.round((amount / netValue) * 10000) / 10000;
  }

  /**
   * 计算折扣率
   */
  calculateDiscountRate(paidAmount: number, investedAmount: number): number {
    // 折扣率 = 实际支付 / 获得金额
    return Math.round((paidAmount / investedAmount) * 10000) / 10000;
  }

  /**
   * 创建失败记录
   */
  private async createFailedRecord(
    plan: AutoInvestmentPlan,
    failReason: string,
    executedAt: Date,
    transaction?: SequelizeTransaction
  ): Promise<ExecutionRecordResponse> {
    const record = await ExecutionRecord.create(
      {
        planId: plan.id,
        userId: plan.userId,
        sourceAccountId: plan.sourceAccountId,
        targetAccountId: plan.targetAccountId,
        paidAmount: plan.amount,
        investedAmount: 0,
        discountRate: 1.0,
        shares: 0,
        netValue: 0,
        status: "failed",
        failReason,
        executedAt,
      },
      { transaction }
    );

    return this.formatRecordResponse(record);
  }

  /**
   * 格式化记录响应
   */
  private formatRecordResponse(
    record: ExecutionRecord,
    plan?: AutoInvestmentPlan | null,
    sourceAccount?: Account,
    targetAccount?: Account
  ): ExecutionRecordResponse {
    const response: ExecutionRecordResponse = {
      id: record.id,
      planId: record.planId,
      userId: record.userId,
      sourceAccountId: record.sourceAccountId,
      targetAccountId: record.targetAccountId,
      paidAmount: record.paidAmount,
      investedAmount: record.investedAmount,
      discountRate: record.discountRate,
      shares: record.shares,
      netValue: record.netValue,
      status: record.status,
      failReason: record.failReason,
      executedAt: record.executedAt,
      createdAt: record.createdAt,
    };

    // 添加关联数据
    const planData = plan || (record as any).plan;
    const source = sourceAccount || (record as any).sourceAccount;
    const target = targetAccount || (record as any).targetAccount;

    if (planData) {
      response.plan = {
        id: planData.id,
        name: planData.name,
      };
    }

    if (source) {
      response.sourceAccount = {
        id: source.id,
        name: source.name,
      };
    }

    if (target) {
      response.targetAccount = {
        id: target.id,
        name: target.name,
      };
    }

    return response;
  }
}

export default new ExecutionService();
