/**
 * 余额调整控制器
 * 处理快速平账相关的 API 请求
 */

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import balanceAdjustmentService from "../services/balanceAdjustment.service";
import { success, created, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class BalanceAdjustmentController {
  /**
   * 预览平账差额
   * GET /api/accounts/:id/balance-preview?actualBalance=10000
   */
  async previewBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { actualBalance } = req.query;

      if (actualBalance === undefined) {
        return error(res, "请提供实际总额", ErrorCode.VALIDATION_ERROR, 400);
      }

      const actualBalanceNum = parseFloat(actualBalance as string);
      if (isNaN(actualBalanceNum)) {
        return error(
          res,
          "实际总额必须是数字",
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      if (actualBalanceNum < 0) {
        return error(
          res,
          "实际总额不能为负数",
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      const preview = await balanceAdjustmentService.previewBalance(
        req.user.id,
        parseInt(id, 10),
        actualBalanceNum
      );

      return success(res, preview);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 执行快速平账
   * POST /api/accounts/:id/quick-balance
   */
  async executeQuickBalance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
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
      const { actualBalance, note } = req.body;

      const result = await balanceAdjustmentService.executeQuickBalance({
        userId: req.user.id,
        accountId: parseInt(id, 10),
        actualBalance,
        note,
      });

      return created(res, result, "平账成功");
    } catch (err: any) {
      if (err.message === "余额一致，无需调整") {
        return error(res, err.message, ErrorCode.VALIDATION_ERROR, 400);
      }
      next(err);
    }
  }

  /**
   * 获取平账记录
   * GET /api/balance-adjustments
   */
  async getRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { accountId, startDate, endDate, page, pageSize } = req.query;

      const result = await balanceAdjustmentService.getRecords(req.user.id, {
        accountId: accountId ? parseInt(accountId as string, 10) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export default new BalanceAdjustmentController();
