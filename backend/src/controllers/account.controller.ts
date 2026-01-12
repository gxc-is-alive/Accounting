import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import accountService from "../services/account.service";
import creditService from "../services/credit.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class AccountController {
  // 获取账户列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const accounts = await accountService.getByUserId(req.user.id);
      return success(res, accounts);
    } catch (err) {
      next(err);
    }
  }

  // 创建账户
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
        name,
        type,
        initialBalance,
        icon,
        creditLimit,
        billingDay,
        dueDay,
      } = req.body;
      const account = await accountService.create({
        userId: req.user.id,
        name,
        type,
        initialBalance,
        icon,
        creditLimit,
        billingDay,
        dueDay,
      });

      return created(res, account, "账户创建成功");
    } catch (err) {
      next(err);
    }
  }

  // 更新账户
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
      const { name, type, icon, creditLimit, billingDay, dueDay } = req.body;

      const account = await accountService.update(
        parseInt(id, 10),
        req.user.id,
        { name, type, icon, creditLimit, billingDay, dueDay }
      );

      return success(res, account, "账户更新成功");
    } catch (err) {
      next(err);
    }
  }

  // 删除账户
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await accountService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // 获取信用账户详情（包含计算字段）
  async getCreditDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;

      // 先验证账户属于当前用户
      await accountService.getById(parseInt(id, 10), req.user.id);

      const details = await creditService.getCreditAccountDetails(
        parseInt(id, 10)
      );

      if (!details) {
        throw new AppError(
          "该账户不是信用账户",
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      return success(res, details);
    } catch (err) {
      next(err);
    }
  }

  // 获取用户信用账户汇总
  async getCreditSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const summary = await creditService.getUserCreditSummary(req.user.id);
      return success(res, summary);
    } catch (err) {
      next(err);
    }
  }
}

export default new AccountController();
