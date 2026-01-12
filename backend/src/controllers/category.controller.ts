import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import categoryService from "../services/category.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class CategoryController {
  // 获取分类列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { type } = req.query;
      const categories = await categoryService.getByUserId(
        req.user.id,
        type as "income" | "expense" | undefined
      );
      return success(res, categories);
    } catch (err) {
      next(err);
    }
  }

  // 创建分类
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

      const { name, type, icon, parentId } = req.body;
      const category = await categoryService.create({
        userId: req.user.id,
        name,
        type,
        icon,
        parentId,
      });

      return created(res, category, "分类创建成功");
    } catch (err) {
      next(err);
    }
  }

  // 更新分类
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
      const { name, icon, parentId, sortOrder } = req.body;

      const category = await categoryService.update(
        parseInt(id, 10),
        req.user.id,
        { name, icon, parentId, sortOrder }
      );

      return success(res, category, "分类更新成功");
    } catch (err) {
      next(err);
    }
  }

  // 删除分类
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await categoryService.delete(parseInt(id, 10), req.user.id);

      return noContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export default new CategoryController();
