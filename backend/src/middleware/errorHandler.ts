import { Request, Response, NextFunction } from "express";
import { AppError, ErrorCode } from "../utils/errors";
import { config } from "../config";

// 全局错误处理中间件
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // 如果是自定义的 AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // 处理 Sequelize 验证错误
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "数据验证失败",
      },
    });
  }

  // 处理 Sequelize 唯一约束错误
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      error: {
        code: ErrorCode.EMAIL_EXISTS,
        message: "数据已存在",
      },
    });
  }

  // 开发环境下打印错误堆栈
  if (config.nodeEnv === "development") {
    console.error("Error:", err);
  }

  // 其他未知错误
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message:
        config.nodeEnv === "development" ? err.message : "服务器内部错误",
    },
  });
};

// 404 处理中间件
export const notFoundHandler = (_req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "请求的资源不存在",
    },
  });
};
