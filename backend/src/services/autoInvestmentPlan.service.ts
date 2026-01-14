/**
 * 定投计划服务
 * 处理定投计划的 CRUD 操作、状态管理、下次执行日期计算
 */

import { Transaction as SequelizeTransaction, Op } from "sequelize";
import { Account, AutoInvestmentPlan, ExecutionRecord } from "../models";
import type { FrequencyType, PlanStatus } from "../models/AutoInvestmentPlan";

// 创建定投计划参数
interface CreatePlanParams {
  userId: number;
  name: string;
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  frequency: FrequencyType;
  executionDay?: number;
  executionTime?: string;
}

// 更新定投计划参数
interface UpdatePlanParams {
  name?: string;
  sourceAccountId?: number;
  targetAccountId?: number;
  amount?: number;
  frequency?: FrequencyType;
  executionDay?: number;
  executionTime?: string;
}

// 定投计划响应类型
interface AutoInvestmentPlanResponse {
  id: number;
  userId: number;
  name: string;
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  frequency: FrequencyType;
  executionDay?: number;
  executionTime: string;
  status: PlanStatus;
  nextExecutionDate: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  sourceAccount?: {
    id: number;
    name: string;
    type: string;
    balance: number;
  };
  targetAccount?: {
    id: number;
    name: string;
    type: string;
  };
}

class AutoInvestmentPlanService {
  /**
   * 创建定投计划
   */
  async create(
    params: CreatePlanParams,
    transaction?: SequelizeTransaction
  ): Promise<AutoInvestmentPlanResponse> {
    const {
      userId,
      name,
      sourceAccountId,
      targetAccountId,
      amount,
      frequency,
      executionDay,
      executionTime = "09:00",
    } = params;

    // 验证资金来源账户
    const sourceAccount = await Account.findOne({
      where: { id: sourceAccountId, userId },
      transaction,
    });

    if (!sourceAccount) {
      throw new Error("资金来源账户不存在");
    }

    // 验证目标账户
    const targetAccount = await Account.findOne({
      where: { id: targetAccountId, userId },
      transaction,
    });

    if (!targetAccount) {
      throw new Error("目标账户不存在");
    }

    // 验证金额
    if (amount <= 0) {
      throw new Error("定投金额必须大于0");
    }

    // 验证频率和执行日
    this.validateFrequencyAndDay(frequency, executionDay);

    // 计算下次执行日期
    const nextExecutionDate = this.calculateNextExecutionDate(
      frequency,
      executionDay,
      new Date()
    );

    const plan = await AutoInvestmentPlan.create(
      {
        userId,
        name,
        sourceAccountId,
        targetAccountId,
        amount,
        frequency,
        executionDay,
        executionTime,
        status: "active",
        nextExecutionDate,
      },
      { transaction }
    );

    return this.formatPlanResponse(plan, sourceAccount, targetAccount);
  }

  /**
   * 获取用户的定投计划列表
   */
  async getByUserId(userId: number): Promise<AutoInvestmentPlanResponse[]> {
    const plans = await AutoInvestmentPlan.findAll({
      where: {
        userId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: Account,
          as: "sourceAccount",
          attributes: ["id", "name", "type", "balance"],
        },
        {
          model: Account,
          as: "targetAccount",
          attributes: ["id", "name", "type"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return plans.map((plan) => this.formatPlanResponse(plan));
  }

  /**
   * 获取单个定投计划详情
   */
  async getById(
    id: number,
    userId: number
  ): Promise<AutoInvestmentPlanResponse> {
    const plan = await AutoInvestmentPlan.findOne({
      where: {
        id,
        userId,
        status: { [Op.ne]: "deleted" },
      },
      include: [
        {
          model: Account,
          as: "sourceAccount",
          attributes: ["id", "name", "type", "balance"],
        },
        {
          model: Account,
          as: "targetAccount",
          attributes: ["id", "name", "type"],
        },
      ],
    });

    if (!plan) {
      throw new Error("定投计划不存在");
    }

    return this.formatPlanResponse(plan);
  }

  /**
   * 更新定投计划
   */
  async update(
    id: number,
    userId: number,
    params: UpdatePlanParams,
    transaction?: SequelizeTransaction
  ): Promise<AutoInvestmentPlanResponse> {
    const plan = await AutoInvestmentPlan.findOne({
      where: {
        id,
        userId,
        status: { [Op.ne]: "deleted" },
      },
      transaction,
    });

    if (!plan) {
      throw new Error("定投计划不存在");
    }

    // 验证资金来源账户
    if (params.sourceAccountId !== undefined) {
      const sourceAccount = await Account.findOne({
        where: { id: params.sourceAccountId, userId },
        transaction,
      });

      if (!sourceAccount) {
        throw new Error("资金来源账户不存在");
      }

      plan.sourceAccountId = params.sourceAccountId;
    }

    // 验证目标账户
    if (params.targetAccountId !== undefined) {
      const targetAccount = await Account.findOne({
        where: { id: params.targetAccountId, userId },
        transaction,
      });

      if (!targetAccount) {
        throw new Error("目标账户不存在");
      }

      plan.targetAccountId = params.targetAccountId;
    }

    // 更新其他字段
    if (params.name !== undefined) {
      plan.name = params.name;
    }

    if (params.amount !== undefined) {
      if (params.amount <= 0) {
        throw new Error("定投金额必须大于0");
      }
      plan.amount = params.amount;
    }

    if (params.executionTime !== undefined) {
      plan.executionTime = params.executionTime;
    }

    // 更新频率和执行日
    const newFrequency = params.frequency ?? plan.frequency;
    const newExecutionDay = params.executionDay ?? plan.executionDay;

    if (params.frequency !== undefined || params.executionDay !== undefined) {
      this.validateFrequencyAndDay(newFrequency, newExecutionDay);
      plan.frequency = newFrequency;
      plan.executionDay = newExecutionDay;

      // 重新计算下次执行日期
      plan.nextExecutionDate = this.calculateNextExecutionDate(
        newFrequency,
        newExecutionDay,
        new Date()
      );
    }

    await plan.save({ transaction });

    // 重新获取关联数据
    return this.getById(id, userId);
  }

  /**
   * 暂停定投计划
   */
  async pause(
    id: number,
    userId: number,
    transaction?: SequelizeTransaction
  ): Promise<AutoInvestmentPlanResponse> {
    const plan = await AutoInvestmentPlan.findOne({
      where: {
        id,
        userId,
        status: "active",
      },
      transaction,
    });

    if (!plan) {
      throw new Error("定投计划不存在或已暂停");
    }

    plan.status = "paused";
    await plan.save({ transaction });

    return this.getById(id, userId);
  }

  /**
   * 恢复定投计划
   */
  async resume(
    id: number,
    userId: number,
    transaction?: SequelizeTransaction
  ): Promise<AutoInvestmentPlanResponse> {
    const plan = await AutoInvestmentPlan.findOne({
      where: {
        id,
        userId,
        status: "paused",
      },
      transaction,
    });

    if (!plan) {
      throw new Error("定投计划不存在或未暂停");
    }

    plan.status = "active";
    // 重新计算下次执行日期
    plan.nextExecutionDate = this.calculateNextExecutionDate(
      plan.frequency,
      plan.executionDay,
      new Date()
    );
    await plan.save({ transaction });

    return this.getById(id, userId);
  }

  /**
   * 删除定投计划（软删除）
   */
  async delete(
    id: number,
    userId: number,
    transaction?: SequelizeTransaction
  ): Promise<void> {
    const plan = await AutoInvestmentPlan.findOne({
      where: {
        id,
        userId,
        status: { [Op.ne]: "deleted" },
      },
      transaction,
    });

    if (!plan) {
      throw new Error("定投计划不存在");
    }

    plan.status = "deleted";
    await plan.save({ transaction });
  }

  /**
   * 获取待执行的计划
   */
  async getPendingPlans(date: string): Promise<AutoInvestmentPlan[]> {
    return AutoInvestmentPlan.findAll({
      where: {
        status: "active",
        nextExecutionDate: { [Op.lte]: date },
      },
      include: [
        { model: Account, as: "sourceAccount" },
        { model: Account, as: "targetAccount" },
      ],
    });
  }

  /**
   * 获取所有活跃的定投计划
   */
  async getAllActivePlans(): Promise<AutoInvestmentPlan[]> {
    return AutoInvestmentPlan.findAll({
      where: {
        status: "active",
      },
      include: [
        { model: Account, as: "sourceAccount" },
        { model: Account, as: "targetAccount" },
      ],
    });
  }

  /**
   * 更新下次执行日期
   */
  async updateNextExecutionDate(
    plan: AutoInvestmentPlan,
    transaction?: SequelizeTransaction
  ): Promise<void> {
    const currentDate = new Date(plan.nextExecutionDate);
    plan.nextExecutionDate = this.calculateNextExecutionDate(
      plan.frequency,
      plan.executionDay,
      currentDate
    );
    await plan.save({ transaction });
  }

  /**
   * 计算下次执行日期
   */
  calculateNextExecutionDate(
    frequency: FrequencyType,
    executionDay: number | undefined,
    currentDate: Date
  ): string {
    // 使用本地日期避免时区问题
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    switch (frequency) {
      case "daily":
        // 每日执行，下次就是明天
        const nextDaily = new Date(year, month, day + 1);
        return this.formatDate(nextDaily);

      case "weekly":
        // executionDay: 1-7 (周一到周日)
        if (
          executionDay === undefined ||
          executionDay < 1 ||
          executionDay > 7
        ) {
          throw new Error("每周定投必须指定执行日（1-7）");
        }
        // 从明天开始找下一个指定的周几
        let nextWeekly = new Date(year, month, day + 1);
        const targetDay = executionDay === 7 ? 0 : executionDay; // 转换为 JS 的周日=0
        while (nextWeekly.getDay() !== targetDay) {
          nextWeekly.setDate(nextWeekly.getDate() + 1);
        }
        return this.formatDate(nextWeekly);

      case "monthly":
        // executionDay: 1-31
        if (
          executionDay === undefined ||
          executionDay < 1 ||
          executionDay > 31
        ) {
          throw new Error("每月定投必须指定执行日（1-31）");
        }
        // 移动到下个月
        const nextMonth = month + 1;
        const nextYear = nextMonth > 11 ? year + 1 : year;
        const actualMonth = nextMonth > 11 ? 0 : nextMonth;
        // 获取该月的最后一天
        const lastDayOfMonth = new Date(nextYear, actualMonth + 1, 0).getDate();
        // 设置执行日，如果超过月末则使用月末
        const actualDay = Math.min(executionDay, lastDayOfMonth);
        const nextMonthly = new Date(nextYear, actualMonth, actualDay);
        return this.formatDate(nextMonthly);

      default:
        throw new Error("不支持的频率类型");
    }
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * 验证频率和执行日
   */
  private validateFrequencyAndDay(
    frequency: FrequencyType,
    executionDay?: number
  ): void {
    switch (frequency) {
      case "daily":
        // 每日不需要执行日
        break;
      case "weekly":
        if (
          executionDay === undefined ||
          executionDay < 1 ||
          executionDay > 7
        ) {
          throw new Error("每周定投必须指定执行日（1-7，1为周一）");
        }
        break;
      case "monthly":
        if (
          executionDay === undefined ||
          executionDay < 1 ||
          executionDay > 31
        ) {
          throw new Error("每月定投必须指定执行日（1-31）");
        }
        break;
    }
  }

  /**
   * 格式化计划响应
   */
  private formatPlanResponse(
    plan: AutoInvestmentPlan,
    sourceAccount?: Account,
    targetAccount?: Account
  ): AutoInvestmentPlanResponse {
    const response: AutoInvestmentPlanResponse = {
      id: plan.id,
      userId: plan.userId,
      name: plan.name,
      sourceAccountId: plan.sourceAccountId,
      targetAccountId: plan.targetAccountId,
      amount: plan.amount,
      frequency: plan.frequency,
      executionDay: plan.executionDay,
      executionTime: plan.executionTime,
      status: plan.status,
      nextExecutionDate: plan.nextExecutionDate,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };

    // 添加关联数据
    const source = sourceAccount || (plan as any).sourceAccount;
    const target = targetAccount || (plan as any).targetAccount;

    if (source) {
      response.sourceAccount = {
        id: source.id,
        name: source.name,
        type: source.type,
        balance: source.balance,
      };
    }

    if (target) {
      response.targetAccount = {
        id: target.id,
        name: target.name,
        type: target.type,
      };
    }

    return response;
  }
}

export default new AutoInvestmentPlanService();
