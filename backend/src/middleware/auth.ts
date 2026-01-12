import { Response, NextFunction } from "express";
import authService from "../services/auth.service";
import { AppError, ErrorCode } from "../utils/errors";
import type { AuthRequest } from "../types";

// JWT 认证中间件
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("未提供认证令牌", 401, ErrorCode.UNAUTHORIZED);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("认证令牌格式错误", 401, ErrorCode.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AppError("认证令牌为空", 401, ErrorCode.UNAUTHORIZED);
    }

    // 验证 token
    const payload = await authService.verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

// 可选认证中间件（不强制要求登录，但如果有 token 则验证）
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token) {
        try {
          const payload = await authService.verifyToken(token);
          req.user = payload;
        } catch {
          // 忽略验证错误，继续处理请求
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
