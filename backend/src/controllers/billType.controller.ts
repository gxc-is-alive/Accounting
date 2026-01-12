import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import billTypeService from "../services/billType.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class BillTypeController {
  // 获取账单类型列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const billTypes = await billTypeService.getByUserId(req.user.id);
      return success(res, billTypes);
    } catch (err) {
      next(err);
    }
  }

  // 创建账单类型
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

      const { name, description, icon } = req.body;
      const billType = await billTypeService.create({
        userId: req.user.id,
        name,
        description,
        icon,
      });

      return created(res, billType, "账单类型创建成功");
    } catch (err) {
      next(err);
    }
  }

  // 更新账单类型
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
      const { name, description, icon, sortOrder } = req.body;

      const billType = await billTypeService.update(
        parseInt(id, 10),
        req.user.id,
        { name, description, icon, sortOrder }
      );

      return success(res, billType, "账单类型更新成功");
    } catch (err) {
      next(err);
    }
  }

  // 删除账单类型
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await billTypeService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export default new BillTypeController();
