// 用户相关类型
export interface User {
  id: number;
  email: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 账户类型
export type AccountType =
  | "cash"
  | "bank"
  | "alipay"
  | "wechat"
  | "credit"
  | "other";

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  icon?: string;
  // 信用账户扩展字段
  creditLimit?: number;
  billingDay?: number;
  dueDay?: number;
  createdAt: string;
}

// 信用账户详情（包含计算字段）
export interface CreditAccountDetails {
  id: number;
  name: string;
  creditLimit: number;
  billingDay: number;
  dueDay: number;
  outstandingBalance: number;
  availableCredit: number;
}

// 信用账户汇总
export interface CreditSummary {
  totalOutstanding: number;
  totalCreditLimit: number;
  totalAvailable: number;
  accounts: CreditAccountDetails[];
}

// 交易类型
export type TransactionType = "income" | "expense" | "repayment";

export interface Transaction {
  id: number;
  userId: number;
  familyId?: number;
  accountId: number;
  categoryId: number;
  billTypeId: number;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  isFamily: boolean;
  // 还款交易扩展字段
  sourceAccountId?: number;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  account?: Account;
  category?: Category;
  billType?: BillType;
  user?: User;
}

// 分类类型
export type CategoryType = "income" | "expense";

export interface Category {
  id: number;
  userId?: number;
  name: string;
  type: CategoryType;
  icon?: string;
  parentId?: number;
  isSystem: boolean;
  createdAt: string;
}

// 账单类型
export interface BillType {
  id: number;
  userId?: number;
  name: string;
  description?: string;
  icon?: string;
  isSystem: boolean;
  createdAt: string;
}

// 家庭相关类型
export type FamilyRole = "admin" | "member";

export interface Family {
  id: number;
  name: string;
  createdBy: number;
  createdAt: string;
}

export interface FamilyMember {
  id: number;
  familyId: number;
  userId: number;
  role: FamilyRole;
  joinedAt: string;
  user?: User;
}

export interface FamilyInvite {
  code: string;
  expiresAt: string;
}

// 预算类型
export interface Budget {
  id: number;
  userId: number;
  categoryId?: number;
  amount: number;
  month: string;
  createdAt: string;
  category?: Category;
  spent?: number;
  progress?: number;
}

// 统计类型
export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyStatistics {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
}

// AI 相关类型
export interface AIAnalyzeResponse {
  summary: string;
  suggestions: string[];
  highlights: string[];
}

export interface AIParseResponse {
  amount: number;
  type: TransactionType;
  categoryId: number;
  note: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 筛选参数
export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  billTypeId?: number;
  accountId?: number;
  type?: TransactionType;
  familyId?: number;
  page?: number;
  pageSize?: number;
}

// 还款相关类型
export interface CreateRepaymentParams {
  creditAccountId: number;
  sourceAccountId: number;
  amount: number;
  date: string;
  note?: string;
  categoryId: number;
  billTypeId: number;
}

export interface RepaymentResult {
  success: boolean;
  transaction?: Transaction;
  newOutstandingBalance: number;
  newAvailableCredit: number;
  error?: string;
}

// 还款提醒
export interface DueReminder {
  accountId: number;
  accountName: string;
  outstandingBalance: number;
  dueDay: number;
  daysUntilDue: number;
  isOverdue: boolean;
}
