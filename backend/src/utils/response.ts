import { Response } from "express";
import { ApiResponse, PaginatedResponse } from "../types";

// 成功响应
export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

// 创建成功响应
export const created = <T>(
  res: Response,
  data: T,
  message = "创建成功"
): Response => {
  return success(res, data, message, 201);
};

// 分页响应
export const paginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number
): Response => {
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
  return res.status(200).json(response);
};

// 错误响应
export const error = (
  res: Response,
  message: string,
  code: string | number,
  statusCode = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return res.status(statusCode).json(response);
};

// 无内容响应
export const noContent = (res: Response): Response => {
  return res.status(204).send();
};
