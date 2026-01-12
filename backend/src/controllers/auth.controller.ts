import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import authService from "../services/auth.service";
import { success, created, error } from "../utils/response";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

class AuthController {
  // 用户注册
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      const { email, password, nickname } = req.body;
      const user = await authService.register({ email, password, nickname });

      return created(
        res,
        {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
        "注册成功"
      );
    } catch (err) {
      next(err);
    }
  }

  // 用户登录
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(
          res,
          errors.array()[0].msg,
          ErrorCode.VALIDATION_ERROR,
          400
        );
      }

      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      return success(res, result, "登录成功");
    } catch (err) {
      next(err);
    }
  }

  // 退出登录
  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        await authService.logout(token);
      }

      return success(res, null, "退出成功");
    } catch (err) {
      next(err);
    }
  }

  // 获取当前用户信息
  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("未授权", 401, ErrorCode.UNAUTHORIZED);
      }

      const user = await authService.getCurrentUser(req.user.id);

      return success(res, {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AuthController();
