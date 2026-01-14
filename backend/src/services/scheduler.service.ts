/**
 * 定时调度器服务
 * 负责定时执行定投计划和余额不足预警检查
 */

import autoInvestmentPlanService from "./autoInvestmentPlan.service";
import executionService from "./execution.service";
import reminderService from "./reminder.service";
import AutoInvestmentPlan from "../models/AutoInvestmentPlan";

class SchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 60 * 1000; // 每分钟检查一次

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      console.log("[Scheduler] 调度器已在运行中");
      return;
    }

    this.isRunning = true;
    console.log("[Scheduler] 调度器已启动");

    // 立即执行一次检查
    this.runScheduledTasks();

    // 设置定时检查
    this.intervalId = setInterval(() => {
      this.runScheduledTasks();
    }, this.checkIntervalMs);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log("[Scheduler] 调度器已停止");
  }

  /**
   * 执行定时任务
   */
  private async runScheduledTasks(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const currentDate = now.toISOString().split("T")[0];

    try {
      // 获取待执行的计划
      const pendingPlans = await autoInvestmentPlanService.getPendingPlans(
        currentDate
      );

      // 筛选出当前时间应该执行的计划
      const plansToExecute = pendingPlans.filter(
        (plan) => plan.executionTime === currentTime
      );

      if (plansToExecute.length > 0) {
        console.log(
          `[Scheduler] 发现 ${plansToExecute.length} 个待执行的定投计划`
        );

        // 执行每个计划
        for (const plan of plansToExecute) {
          await this.executePlan(plan);
        }
      }

      // 每天早上 8:00 检查余额不足预警
      if (currentTime === "08:00") {
        await this.checkInsufficientBalanceWarnings();
      }
    } catch (error) {
      console.error("[Scheduler] 执行定时任务失败:", error);
    }
  }

  /**
   * 执行单个定投计划
   */
  private async executePlan(plan: AutoInvestmentPlan): Promise<void> {
    console.log(`[Scheduler] 开始执行定投计划: ${plan.name} (ID: ${plan.id})`);

    try {
      const result = await executionService.executePlan(plan);

      if (result.success) {
        console.log(
          `[Scheduler] 定投计划执行成功: ${plan.name}, 买入份额: ${result.record.shares}`
        );
      } else {
        console.log(
          `[Scheduler] 定投计划执行失败: ${plan.name}, 原因: ${
            result.record.failReason || result.error
          }`
        );
      }
    } catch (error) {
      console.error(`[Scheduler] 执行定投计划异常: ${plan.name}`, error);

      // 创建执行失败提醒
      try {
        await reminderService.create({
          userId: plan.userId,
          planId: plan.id,
          type: "execution_failed",
          message: `定投计划"${plan.name}"执行失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
        });
      } catch (reminderError) {
        console.error("[Scheduler] 创建提醒失败:", reminderError);
      }
    }
  }

  /**
   * 检查余额不足预警
   */
  private async checkInsufficientBalanceWarnings(): Promise<void> {
    console.log("[Scheduler] 开始检查余额不足预警");

    try {
      // 获取所有活跃的定投计划
      const activePlans = await autoInvestmentPlanService.getAllActivePlans();

      // 按用户分组
      const plansByUser = new Map<number, AutoInvestmentPlan[]>();
      for (const plan of activePlans) {
        const userPlans = plansByUser.get(plan.userId) || [];
        userPlans.push(plan);
        plansByUser.set(plan.userId, userPlans);
      }

      // 为每个用户检查余额
      for (const [userId] of plansByUser) {
        await reminderService.checkInsufficientBalance(userId);
      }

      console.log("[Scheduler] 余额不足预警检查完成");
    } catch (error) {
      console.error("[Scheduler] 检查余额不足预警失败:", error);
    }
  }

  /**
   * 手动触发执行指定计划（用于测试或手动执行）
   */
  async triggerPlanExecution(planId: number, userId: number): Promise<void> {
    // 直接从数据库获取模型实例，而不是通过 service 获取响应对象
    const plan = await AutoInvestmentPlan.findOne({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new Error("定投计划不存在");
    }

    await this.executePlan(plan);
  }

  /**
   * 获取调度器状态
   */
  getStatus(): { isRunning: boolean; checkIntervalMs: number } {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
    };
  }
}

export default new SchedulerService();
