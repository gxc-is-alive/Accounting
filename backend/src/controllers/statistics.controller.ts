import { Response, NextFunction } from "express";
import statisticsService from "../services/statistics.service";
import { success } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class StatisticsController {
  // 获取月度统计
  async getMonthly(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const now = new Date();
      const { year, month } = req.query;

      const stats = await statisticsService.getMonthlyStats(
        req.user.id,
        year ? parseInt(year as string, 10) : now.getFullYear(),
        month ? parseInt(month as string, 10) : now.getMonth() + 1
      );

      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // 获取分类统计
  async getCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { type, startDate, endDate } = req.query;
      const now = new Date();

      // 默认本月
      const defaultStart = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-01`;
      const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const stats = await statisticsService.getCategoryStats(
        req.user.id,
        (type as "income" | "expense") || "expense",
        (startDate as string) || defaultStart,
        (endDate as string) || defaultEnd
      );

      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // 获取趋势数据
  async getTrend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { months } = req.query;
      const stats = await statisticsService.getTrendStats(
        req.user.id,
        months ? parseInt(months as string, 10) : 6
      );

      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // 获取年度统计
  async getYearly(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { year } = req.query;
      const stats = await statisticsService.getYearlyStats(
        req.user.id,
        year ? parseInt(year as string, 10) : new Date().getFullYear()
      );

      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // 获取家庭统计
  async getFamily(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { year, month } = req.query;
      const now = new Date();

      const stats = await statisticsService.getFamilyStats(
        req.user.id,
        parseInt(id, 10),
        year ? parseInt(year as string, 10) : now.getFullYear(),
        month ? parseInt(month as string, 10) : now.getMonth() + 1
      );

      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export default new StatisticsController();
