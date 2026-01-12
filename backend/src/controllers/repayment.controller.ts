import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import repaymentService from "../services/repayment.service";
import creditService from "../services/credit.service";
import { success, created, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class RepaymentController {
  // 创建还款
  async create(req: AuthRequest, res: Response, next: NextFunction) {
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
        creditAccountId,
        sourceAccountId,
        amount,
        date,
        note,
        categoryId,
        billTypeId,
      } = req.body;

      const result = await repaymentService.createRepayment({
        userId: req.user.id,
        creditAccountId,
        sourceAccountId,
        amount,
        date: new Date(date),
        note,
        categoryId,
        billTypeId,
      });

      if (!result.success) {
        return error(
          res,
          result.error || "还款失败",
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      return created(res, result, "还款成功");
    } catch (err) {
      next(err);
    }
  }

  // 获取还款历史
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { accountId, page = 1, pageSize = 20 } = req.query;

      let result;
      if (accountId) {
        result = await repaymentService.getRepaymentHistory(
          parseInt(accountId as string, 10),
          {
            limit: parseInt(pageSize as string, 10),
            offset:
              (parseInt(page as string, 10) - 1) *
              parseInt(pageSize as string, 10),
          }
        );
      } else {
        result = await repaymentService.getUserRepaymentHistory(req.user.id, {
          limit: parseInt(pageSize as string, 10),
          offset:
            (parseInt(page as string, 10) - 1) *
            parseInt(pageSize as string, 10),
        });
      }

      return success(res, {
        items: result.transactions,
        total: result.total,
        page: parseInt(page as string, 10),
        pageSize: parseInt(pageSize as string, 10),
        totalPages: Math.ceil(result.total / parseInt(pageSize as string, 10)),
      });
    } catch (err) {
      next(err);
    }
  }

  // 删除还款记录
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const deleted = await repaymentService.deleteRepayment(
        parseInt(id, 10),
        req.user.id
      );

      if (!deleted) {
        throw new AppError("还款记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      return success(res, null, "还款记录已删除");
    } catch (err) {
      next(err);
    }
  }

  // 获取还款提醒
  async getReminders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const reminders = await creditService.getDueReminders(req.user.id);
      return success(res, reminders);
    } catch (err) {
      next(err);
    }
  }
}

export default new RepaymentController();
