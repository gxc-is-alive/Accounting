import { Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import familyService from "../services/family.service";
import { success, created, error, noContent } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class FamilyController {
  // 获取用户的家庭列表
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const families = await familyService.getUserFamilies(req.user.id);
      return success(res, families);
    } catch (err) {
      next(err);
    }
  }

  // 获取家庭详情
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const family = await familyService.getById(parseInt(id, 10), req.user.id);
      return success(res, family);
    } catch (err) {
      next(err);
    }
  }

  // 获取家庭成员列表
  async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const members = await familyService.getMembers(
        parseInt(id, 10),
        req.user.id
      );
      return success(res, members);
    } catch (err) {
      next(err);
    }
  }

  // 创建家庭
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

      const { name } = req.body;
      const family = await familyService.create(req.user.id, name);
      return created(res, family, "家庭创建成功");
    } catch (err) {
      next(err);
    }
  }

  // 更新家庭
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
      const { name } = req.body;
      const family = await familyService.update(
        parseInt(id, 10),
        req.user.id,
        name
      );
      return success(res, family, "更新成功");
    } catch (err) {
      next(err);
    }
  }

  // 生成邀请码
  async createInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { expiresInHours } = req.body;
      const invite = await familyService.createInvite(
        parseInt(id, 10),
        req.user.id,
        expiresInHours
      );
      return created(res, invite, "邀请码生成成功");
    } catch (err) {
      next(err);
    }
  }

  // 通过邀请码加入家庭
  async join(req: AuthRequest, res: Response, next: NextFunction) {
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

      const { code } = req.body;
      const family = await familyService.joinByCode(req.user.id, code);
      return success(res, family, "加入家庭成功");
    } catch (err) {
      next(err);
    }
  }

  // 移除成员
  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id, userId } = req.params;
      await familyService.removeMember(
        parseInt(id, 10),
        req.user.id,
        parseInt(userId, 10)
      );
      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // 退出家庭
  async leave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const { id } = req.params;
      await familyService.leave(parseInt(id, 10), req.user.id);
      return noContent(res);
    } catch (err) {
      next(err);
    }
  }

  // 设置成员角色
  async setMemberRole(req: AuthRequest, res: Response, next: NextFunction) {
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

      const { id, userId } = req.params;
      const { role } = req.body;
      const family = await familyService.setMemberRole(
        parseInt(id, 10),
        req.user.id,
        parseInt(userId, 10),
        role
      );
      return success(res, family, "角色更新成功");
    } catch (err) {
      next(err);
    }
  }
}

export default new FamilyController();
