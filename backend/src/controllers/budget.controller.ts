import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import budgetService from "../services/budget.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class BudgetController {
  // 获取预算列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { month } = req.query;
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      const budgets = await budgetService.getByMonth(
        req.user.id,
        (month as string) || defaultMonth
      );

      return success(res, budgets);
    } catch (err) {
      next(err);
    }
  }

  // 创建或更新预算
  async upsert(req: AuthRequest, res: Response, next: NextFunction) {
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

      const { categoryId, amount, month } = req.body;
      const budget = await budgetService.upsert({
        userId: req.user.id,
        categoryId,
        amount,
        month,
      });

      return created(res, budget, "预算设置成功");
    } catch (err) {
      next(err);
    }
  }

  // 删除预算
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await budgetService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // 获取预算执行状态
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { month } = req.query;
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      const status = await budgetService.getStatus(
        req.user.id,
        (month as string) || defaultMonth
      );

      return success(res, status);
    } catch (err) {
      next(err);
    }
  }

  // 获取预算预警
  async getWarnings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { month } = req.query;
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      const warnings = await budgetService.checkWarnings(
        req.user.id,
        (month as string) || defaultMonth
      );

      return success(res, warnings);
    } catch (err) {
      next(err);
    }
  }
}

export default new BudgetController();
