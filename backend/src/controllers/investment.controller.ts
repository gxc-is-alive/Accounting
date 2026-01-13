/**
 * 投资控制器
 * 处理投资账户的 API 请求
 */

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import investmentService from "../services/investment.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class InvestmentController {
  /**
   * 获取投资账户列表（含汇总）
   */
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const result = await investmentService.getInvestmentAccounts(req.user.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取单个投资账户详情
   */
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const account = await investmentService.getInvestmentAccountById(
        parseInt(id, 10),
        req.user.id
      );

      return success(res, account);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 创建投资账户
   */
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

      const { name, shares, costPrice, currentNetValue, icon } = req.body;
      const account = await investmentService.createInvestmentAccount({
        userId: req.user.id,
        name,
        shares,
        costPrice,
        currentNetValue,
        icon,
      });

      return created(res, account, "投资账户创建成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新投资账户
   */
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
      const { name, icon } = req.body;

      const account = await investmentService.updateInvestmentAccount(
        parseInt(id, 10),
        req.user.id,
        { name, icon }
      );

      return success(res, account, "投资账户更新成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除投资账户
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await investmentService.deleteInvestmentAccount(
        parseInt(id, 10),
        req.user.id
      );

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 买入份额
   */
  async buy(req: AuthRequest, res: Response, next: NextFunction) {
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
      const { shares, price, date, sourceAccountId } = req.body;

      const result = await investmentService.buyShares({
        accountId: parseInt(id, 10),
        userId: req.user.id,
        shares,
        price,
        date,
        sourceAccountId,
      });

      return success(res, result, "买入成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 卖出份额
   */
  async sell(req: AuthRequest, res: Response, next: NextFunction) {
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
      const { shares, price, date, targetAccountId } = req.body;

      const result = await investmentService.sellShares({
        accountId: parseInt(id, 10),
        userId: req.user.id,
        shares,
        price,
        date,
        targetAccountId,
      });

      return success(res, result, "卖出成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新净值
   */
  async updateNetValue(req: AuthRequest, res: Response, next: NextFunction) {
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
      const { netValue, date } = req.body;

      const account = await investmentService.updateNetValue(
        parseInt(id, 10),
        req.user.id,
        netValue,
        date
      );

      return success(res, account, "净值更新成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 批量更新净值
   */
  async updateNetValueBatch(
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

      const { valuations, date } = req.body;

      const results = await investmentService.updateNetValueBatch(
        req.user.id,
        valuations,
        date
      );

      return success(res, results, "批量更新成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取投资概览统计
   */
  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const result = await investmentService.getInvestmentAccounts(req.user.id);
      return success(res, {
        totalCost: result.totalCost,
        totalValue: result.totalValue,
        totalProfit: result.totalProfit,
        profitRate: result.profitRate,
        accountCount: result.accounts.length,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new InvestmentController();
