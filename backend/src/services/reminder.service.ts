/**
 * 投资提醒服务
 * 处理定投提醒的创建、查询、标记已读
 */

import { Op } from "sequelize";
import { Account, AutoInvestmentPlan, InvestmentReminder } from "../models";
import type { ReminderType } from "../models/InvestmentReminder";

// 创建提醒参数
interface CreateReminderParams {
  userId: number;
  planId: number;
  type: ReminderType;
  message: string;
}

// 提醒响应类型
interface ReminderResponse {
  id: number;
  userId: number;
  planId: number;
  type: ReminderType;
  message: string;
  isRead: boolean;
  createdAt: Date;
  plan?: {
    id: number;
    name: string;
  };
}

class ReminderService {
  /**
   * 创建提醒
   */
  async create(params: CreateReminderParams): Promise<ReminderResponse> {
    const { userId, planId, type, message } = params;

    const reminder = await InvestmentReminder.create({
      userId,
      planId,
      type,
      message,
      isRead: false,
    });

    return this.formatReminderResponse(reminder);
  }

  /**
   * 获取用户未读提醒
   */
  async getUnreadByUserId(userId: number): Promise<ReminderResponse[]> {
    const reminders = await InvestmentReminder.findAll({
      where: {
        userId,
        isRead: false,
      },
      include: [
        {
          model: AutoInvestmentPlan,
          as: "plan",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return reminders.map((reminder) => this.formatReminderResponse(reminder));
  }

  /**
   * 获取用户所有提醒
   */
  async getAllByUserId(
    userId: number,
    limit: number = 50
  ): Promise<ReminderResponse[]> {
    const reminders = await InvestmentReminder.findAll({
      where: { userId },
      include: [
        {
          model: AutoInvestmentPlan,
          as: "plan",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });

    return reminders.map((reminder) => this.formatReminderResponse(reminder));
  }

  /**
   * 标记为已读
   */
  async markAsRead(id: number, userId: number): Promise<void> {
    const reminder = await InvestmentReminder.findOne({
      where: { id, userId },
    });

    if (!reminder) {
      throw new Error("提醒不存在");
    }

    reminder.isRead = true;
    await reminder.save();
  }

  /**
   * 批量标记为已读
   */
  async markAllAsRead(userId: number): Promise<number> {
    const [affectedCount] = await InvestmentReminder.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    return affectedCount;
  }

  /**
   * 检查余额不足预警
   * 检查明天要执行的定投计划，如果来源账户余额不足则创建预警
   */
  async checkInsufficientBalance(userId: number): Promise<ReminderResponse[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // 获取明天要执行的计划
    const plans = await AutoInvestmentPlan.findAll({
      where: {
        userId,
        status: "active",
        nextExecutionDate: tomorrowStr,
      },
      include: [
        {
          model: Account,
          as: "sourceAccount",
          attributes: ["id", "name", "balance"],
        },
      ],
    });

    const reminders: ReminderResponse[] = [];

    for (const plan of plans) {
      const sourceAccount = (plan as any).sourceAccount;
      if (sourceAccount && sourceAccount.balance < plan.amount) {
        // 检查是否已有相同的未读提醒
        const existingReminder = await InvestmentReminder.findOne({
          where: {
            userId,
            planId: plan.id,
            type: "insufficient_balance",
            isRead: false,
          },
        });

        if (!existingReminder) {
          const reminder = await this.create({
            userId,
            planId: plan.id,
            type: "insufficient_balance",
            message: `定投计划"${plan.name}"的资金来源账户"${sourceAccount.name}"余额不足，当前余额 ${sourceAccount.balance} 元，定投金额 ${plan.amount} 元`,
          });
          reminders.push(reminder);
        }
      }
    }

    return reminders;
  }

  /**
   * 获取未读提醒数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return InvestmentReminder.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 格式化提醒响应
   */
  private formatReminderResponse(
    reminder: InvestmentReminder
  ): ReminderResponse {
    const response: ReminderResponse = {
      id: reminder.id,
      userId: reminder.userId,
      planId: reminder.planId,
      type: reminder.type,
      message: reminder.message,
      isRead: reminder.isRead,
      createdAt: reminder.createdAt,
    };

    const plan = (reminder as any).plan;
    if (plan) {
      response.plan = {
        id: plan.id,
        name: plan.name,
      };
    }

    return response;
  }
}

export default new ReminderService();
