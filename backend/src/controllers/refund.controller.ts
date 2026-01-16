/**
 * 退款控制器
 *
 * 处理退款相关的 HTTP 请求
 */

import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import refundService from "../services/refund.service";
import { success, created, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class RefundController {
  /**
   * 创建退款
   * POST /api/refunds
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

      const { originalTransactionId, amount, date, note } = req.body;

      const result = await refundService.createRefund({
        userId: req.user.id,
        originalTransactionId,
        amount,
        date,
        note,
      });

      return created(res, result, "退款成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取交易的退款信息
   * GET /api/transactions/:id/refunds
   */
  async getTransactionRefunds(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const transactionId = parseInt(id, 10);

      if (isNaN(transactionId)) {
        return error(res, "无效的交易 ID", ErrorCode.VALIDATION_ERROR, 400);
      }

      const refundInfo = await refundService.getRefundInfo(
        transactionId,
        req.user.id
      );

      return success(res, refundInfo);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取可退款金额
   * GET /api/transactions/:id/refundable
   */
  async getRefundableAmount(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const transactionId = parseInt(id, 10);

      if (isNaN(transactionId)) {
        return error(res, "无效的交易 ID", ErrorCode.VALIDATION_ERROR, 400);
      }

      const refundableAmount = await refundService.calculateRefundableAmount(
        transactionId,
        req.user.id
      );

      return success(res, { refundableAmount });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除退款
   * DELETE /api/refunds/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const refundId = parseInt(id, 10);

      if (isNaN(refundId)) {
        return error(res, "无效的退款 ID", ErrorCode.VALIDATION_ERROR, 400);
      }

      await refundService.deleteRefund(refundId, req.user.id);

      return success(res, null, "退款记录已删除");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新退款
   * PUT /api/refunds/:id
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
      const refundId = parseInt(id, 10);

      if (isNaN(refundId)) {
        return error(res, "无效的退款 ID", ErrorCode.VALIDATION_ERROR, 400);
      }

      const { amount, date, note } = req.body;

      const updatedRefund = await refundService.updateRefund(
        refundId,
        req.user.id,
        { amount, date, note }
      );

      return success(res, updatedRefund, "退款记录已更新");
    } catch (err) {
      next(err);
    }
  }
}

export default new RefundController();
