// 错误码定义
export enum ErrorCode {
  // 认证错误 1xxx
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  UNAUTHORIZED = 1003,
  TOKEN_INVALID = 1004,

  // 用户错误 2xxx
  EMAIL_EXISTS = 2001,
  USER_NOT_FOUND = 2002,

  // 家庭错误 3xxx
  FAMILY_NOT_FOUND = 3001,
  INVITE_EXPIRED = 3002,
  INVITE_INVALID = 3003,
  NOT_FAMILY_MEMBER = 3004,
  CANNOT_REMOVE_ADMIN = 3005,
  ALREADY_IN_FAMILY = 3006,

  // 账户错误 4xxx
  ACCOUNT_NOT_FOUND = 4001,
  ACCOUNT_HAS_TRANSACTIONS = 4002,
  INSUFFICIENT_BALANCE = 4003,

  // 交易错误 5xxx
  TRANSACTION_NOT_FOUND = 5001,
  INVALID_AMOUNT = 5002,

  // 分类错误 6xxx
  CATEGORY_NOT_FOUND = 6001,
  CATEGORY_HAS_TRANSACTIONS = 6002,
  CANNOT_DELETE_SYSTEM_CATEGORY = 6003,

  // 账单类型错误 6xxx
  BILL_TYPE_NOT_FOUND = 6101,
  BILL_TYPE_HAS_TRANSACTIONS = 6102,
  CANNOT_DELETE_SYSTEM_BILL_TYPE = 6103,

  // 预算错误 6xxx
  BUDGET_NOT_FOUND = 6201,
  BUDGET_ALREADY_EXISTS = 6202,

  // AI 错误 7xxx
  AI_PARSE_FAILED = 7001,
  AI_SERVICE_UNAVAILABLE = 7002,

  // 通用错误 9xxx
  VALIDATION_ERROR = 9001,
  NOT_FOUND = 9002,
  FORBIDDEN = 9003,
  DUPLICATE_ENTRY = 9004,
  INTERNAL_ERROR = 9999,
}

// 自定义应用错误类
export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 常用错误工厂函数
export const createError = {
  unauthorized: (message = "未授权访问") =>
    new AppError(message, 401, ErrorCode.UNAUTHORIZED),

  forbidden: (message = "禁止访问") =>
    new AppError(message, 403, ErrorCode.UNAUTHORIZED),

  notFound: (resource: string) =>
    new AppError(`${resource}不存在`, 404, ErrorCode.USER_NOT_FOUND),

  badRequest: (message: string) =>
    new AppError(message, 400, ErrorCode.VALIDATION_ERROR),

  conflict: (message: string, code: ErrorCode) =>
    new AppError(message, 409, code),

  internal: (message = "服务器内部错误") =>
    new AppError(message, 500, ErrorCode.INTERNAL_ERROR),
};
