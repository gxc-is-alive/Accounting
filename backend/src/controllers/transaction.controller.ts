import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import transactionService from "../services/transaction.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class TransactionController {
  // 获取交易列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const {
        familyId,
        accountId,
        categoryId,
        type,
        startDate,
        endDate,
        page,
        pageSize,
      } = req.query;

      const result = await transactionService.list({
        userId: req.user.id,
        familyId: familyId ? parseInt(familyId as string, 10) : undefined,
        accountId: accountId ? parseInt(accountId as string, 10) : undefined,
        categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
        type: type as "income" | "expense" | "refund" | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
      });

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 获取单个交易
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const transaction = await transactionService.getById(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, transaction);
    } catch (err) {
      next(err);
    }
  }

  // 创建交易
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
        accountId,
        categoryId,
        type,
        amount,
        date,
        note,
        familyId,
        isFamily,
      } = req.body;

      const transaction = await transactionService.create({
        userId: req.user.id,
        accountId,
        categoryId,
        type,
        amount,
        date,
        note,
        familyId,
        isFamily,
      });

      return created(res, transaction, "记账成功");
    } catch (err) {
      next(err);
    }
  }

  // 更新交易
  async update(req: AuthRequest, res: Response, next: NextFunction) {
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
      const { accountId, categoryId, type, amount, date, note, isFamily } =
        req.body;

      const transaction = await transactionService.update(
        parseInt(id, 10),
        req.user.id,
        {
          accountId,
          categoryId,
          type,
          amount,
          date,
          note,
          isFamily,
        }
      );

      return success(res, transaction, "更新成功");
    } catch (err) {
      next(err);
    }
  }

  // 删除交易
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await transactionService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // 获取月度统计
  async getMonthlySummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { year, month } = req.query;
      const now = new Date();

      const summary = await transactionService.getMonthlySummary(
        req.user.id,
        year ? parseInt(year as string, 10) : now.getFullYear(),
        month ? parseInt(month as string, 10) : now.getMonth() + 1
      );

      return success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  // ========== 家庭账单优化：新增 API ==========

  // 获取家庭账单列表（基于成员加入时间）
  async listFamilyTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { familyId } = req.params;
      const { memberId, categoryId, type, startDate, endDate, page, pageSize } =
        req.query;

      // 使用统计服务的家庭交易查询方法
      const statisticsService = (await import("../services/statistics.service"))
        .default;

      const result = await statisticsService.getFamilyMemberTransactions(
        req.user.id,
        parseInt(familyId, 10),
        {
          memberId: memberId ? parseInt(memberId as string, 10) : undefined,
          categoryId: categoryId
            ? parseInt(categoryId as string, 10)
            : undefined,
          type: type as "income" | "expense" | undefined,
          startDate: startDate as string | undefined,
          endDate: endDate as string | undefined,
          page: page ? parseInt(page as string, 10) : 1,
          pageSize: pageSize ? parseInt(pageSize as string, 10) : 20,
        }
      );

      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export default new TransactionController();
