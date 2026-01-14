/**
 * 定投控制器
 * 处理定投计划、执行记录、提醒的 API 请求
 */

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import autoInvestmentPlanService from "../services/autoInvestmentPlan.service";
import executionService from "../services/execution.service";
import reminderService from "../services/reminder.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class AutoInvestmentController {
  // ========== 定投计划 ==========

  /**
   * 获取定投计划列表
   */
  async listPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const plans = await autoInvestmentPlanService.getByUserId(req.user.id);
      return success(res, plans);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取单个定投计划详情
   */
  async getPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const plan = await autoInvestmentPlanService.getById(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, plan);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 创建定投计划
   */
  async createPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const {
        name,
        sourceAccountId,
        targetAccountId,
        amount,
        frequency,
        executionDay,
        executionTime,
      } = req.body;

      const plan = await autoInvestmentPlanService.create({
        userId: req.user.id,
        name,
        sourceAccountId,
        targetAccountId,
        amount,
        frequency,
        executionDay,
        executionTime,
      });

      return created(res, plan, "定投计划创建成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新定投计划
   */
  async updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const {
        name,
        sourceAccountId,
        targetAccountId,
        amount,
        frequency,
        executionDay,
        executionTime,
      } = req.body;

      const plan = await autoInvestmentPlanService.update(
        parseInt(id, 10),
        req.user.id,
        {
          name,
          sourceAccountId,
          targetAccountId,
          amount,
          frequency,
          executionDay,
          executionTime,
        }
      );

      return success(res, plan, "定投计划更新成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 暂停定投计划
   */
  async pausePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const plan = await autoInvestmentPlanService.pause(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, plan, "定投计划已暂停");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 恢复定投计划
   */
  async resumePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const plan = await autoInvestmentPlanService.resume(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, plan, "定投计划已恢复");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除定投计划
   */
  async deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await autoInvestmentPlanService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // ========== 执行记录 ==========

  /**
   * 获取执行记录列表
   */
  async listRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { planId, startDate, endDate, status, page, pageSize } = req.query;

      const result = await executionService.getRecords(req.user.id, {
        planId: planId ? parseInt(planId as string, 10) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as "success" | "failed" | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取计划的执行记录
   */
  async getPlanRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const records = await executionService.getRecordsByPlanId(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, records);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 单次买入转换（支持折扣）
   */
  async oneTimeBuy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const {
        sourceAccountId,
        targetAccountId,
        paidAmount,
        investedAmount,
        date,
      } = req.body;

      const result = await executionService.executeOneTimeBuy({
        userId: req.user.id,
        sourceAccountId,
        targetAccountId,
        paidAmount,
        investedAmount,
        date,
      });

      return success(res, result, "买入成功");
    } catch (err) {
      next(err);
    }
  }

  // ========== 提醒 ==========

  /**
   * 获取未读提醒
   */
  async listReminders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const reminders = await reminderService.getUnreadByUserId(req.user.id);
      return success(res, reminders);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取未读提醒数量
   */
  async getReminderCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const count = await reminderService.getUnreadCount(req.user.id);
      return success(res, { count });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 标记提醒为已读
   */
  async markReminderRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await reminderService.markAsRead(parseInt(id, 10), req.user.id);

      return success(res, null, "已标记为已读");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 标记所有提醒为已读
   */
  async markAllRemindersRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const count = await reminderService.markAllAsRead(req.user.id);
      return success(res, { count }, `已标记 ${count} 条提醒为已读`);
    } catch (err) {
      next(err);
    }
  }
}

export default new AutoInvestmentController();
