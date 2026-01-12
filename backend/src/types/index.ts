import { Request } from "express";

// 用户相关类型
export interface UserPayload {
  id: number;
  email: string;
  nickname: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// 账户类型枚举
export type AccountType =
  | "cash"
  | "bank"
  | "alipay"
  | "wechat"
  | "credit"
  | "other";

// 交易类型枚举
export type TransactionType = "income" | "expense" | "repayment";

// 分类类型枚举
export type CategoryType = "income" | "expense";

// 家庭成员角色枚举
export type FamilyRole = "admin" | "member";

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string | number;
    message: string;
  };
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 交易筛选参数
export interface TransactionFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  billTypeId?: number;
  accountId?: number;
  type?: TransactionType;
  familyId?: number;
}

// 统计数据类型
export interface MonthlyStatistics {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

// AI 相关类型
export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
}

export interface SpendingData {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface AnalysisResult {
  summary: string;
  suggestions: string[];
  highlights: string[];
}
