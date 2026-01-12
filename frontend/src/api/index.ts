import request from "./request";
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  Account,
  Category,
  BillType,
  Transaction,
  TransactionFilters,
  Family,
  FamilyMember,
  FamilyInvite,
  Budget,
  MonthlyStatistics,
  TrendData,
  AIAnalyzeResponse,
  AIParseResponse,
  ApiResponse,
  PaginatedResponse,
  CreditAccountDetails,
  CreditSummary,
  CreateRepaymentParams,
  RepaymentResult,
  DueReminder,
} from "@/types";

// 认证 API
export const authApi = {
  register: (data: RegisterRequest) =>
    request.post<ApiResponse<User>>("/auth/register", data),

  login: (data: LoginRequest) =>
    request.post<ApiResponse<LoginResponse>>("/auth/login", data),

  logout: () => request.post<ApiResponse>("/auth/logout"),

  me: () => request.get<ApiResponse<User>>("/auth/me"),
};

// 账户 API
export const accountApi = {
  list: () => request.get<ApiResponse<Account[]>>("/accounts"),

  create: (data: Partial<Account>) =>
    request.post<ApiResponse<Account>>("/accounts", data),

  update: (id: number, data: Partial<Account>) =>
    request.put<ApiResponse<Account>>(`/accounts/${id}`, data),

  delete: (id: number) => request.delete<ApiResponse>(`/accounts/${id}`),

  // 信用账户相关
  getCreditDetails: (id: number) =>
    request.get<ApiResponse<CreditAccountDetails>>(`/accounts/${id}/credit`),

  getCreditSummary: () =>
    request.get<ApiResponse<CreditSummary>>("/accounts/credit/summary"),
};

// 还款 API
export const repaymentApi = {
  create: (data: CreateRepaymentParams) =>
    request.post<ApiResponse<RepaymentResult>>("/repayments", data),

  list: (params?: {
    creditAccountId?: number;
    page?: number;
    pageSize?: number;
  }) =>
    request.get<ApiResponse<PaginatedResponse<Transaction>>>("/repayments", {
      params,
    }),

  delete: (id: number) => request.delete<ApiResponse>(`/repayments/${id}`),

  getReminders: () =>
    request.get<ApiResponse<DueReminder[]>>("/repayments/reminders"),
};

// 分类 API
export const categoryApi = {
  list: () => request.get<ApiResponse<Category[]>>("/categories"),

  create: (data: Partial<Category>) =>
    request.post<ApiResponse<Category>>("/categories", data),

  update: (id: number, data: Partial<Category>) =>
    request.put<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: number) => request.delete<ApiResponse>(`/categories/${id}`),
};

// 账单类型 API
export const billTypeApi = {
  list: () => request.get<ApiResponse<BillType[]>>("/bill-types"),

  create: (data: Partial<BillType>) =>
    request.post<ApiResponse<BillType>>("/bill-types", data),

  update: (id: number, data: Partial<BillType>) =>
    request.put<ApiResponse<BillType>>(`/bill-types/${id}`, data),

  delete: (id: number) => request.delete<ApiResponse>(`/bill-types/${id}`),
};

// 交易记录 API
export const transactionApi = {
  list: (params?: TransactionFilters) =>
    request.get<ApiResponse<PaginatedResponse<Transaction>>>("/transactions", {
      params,
    }),

  create: (data: Partial<Transaction>) =>
    request.post<ApiResponse<Transaction>>("/transactions", data),

  update: (id: number, data: Partial<Transaction>) =>
    request.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  delete: (id: number) => request.delete<ApiResponse>(`/transactions/${id}`),

  quickAdd: (text: string) =>
    request.post<ApiResponse<Transaction>>("/transactions/quick", { text }),
};

// 家庭 API
export const familyApi = {
  list: () => request.get<ApiResponse<Family[]>>("/families"),

  create: (data: { name: string }) =>
    request.post<ApiResponse<Family>>("/families", data),

  getMembers: (familyId: number) =>
    request.get<ApiResponse<FamilyMember[]>>(`/families/${familyId}/members`),

  invite: (familyId: number) =>
    request.post<ApiResponse<FamilyInvite>>(`/families/${familyId}/invite`),

  join: (code: string) =>
    request.post<ApiResponse<Family>>("/families/join", { code }),

  removeMember: (familyId: number, userId: number) =>
    request.delete<ApiResponse>(`/families/${familyId}/members/${userId}`),

  leave: (familyId: number) =>
    request.post<ApiResponse>(`/families/${familyId}/leave`),
};

// 预算 API
export const budgetApi = {
  list: () => request.get<ApiResponse<Budget[]>>("/budgets"),

  create: (data: Partial<Budget>) =>
    request.post<ApiResponse<Budget>>("/budgets", data),

  update: (id: number, data: Partial<Budget>) =>
    request.put<ApiResponse<Budget>>(`/budgets/${id}`, data),

  delete: (id: number) => request.delete<ApiResponse>(`/budgets/${id}`),

  status: () => request.get<ApiResponse<Budget[]>>("/budgets/status"),
};

// 统计 API
export const statisticsApi = {
  monthly: (month: string) => {
    const [year, m] = month.split("-");
    return request.get<ApiResponse<MonthlyStatistics>>("/statistics/monthly", {
      params: { year, month: m },
    });
  },

  category: (params: { startDate: string; endDate: string; type?: string }) =>
    request.get<
      ApiResponse<{ breakdown: import("@/types").CategoryBreakdown[] }>
    >("/statistics/category", { params }),

  trend: (params: { months?: number }) =>
    request.get<ApiResponse<TrendData[]>>("/statistics/trend", { params }),

  yearly: (year: string) =>
    request.get<ApiResponse<MonthlyStatistics[]>>("/statistics/yearly", {
      params: { year },
    }),

  family: (familyId: number, month: string) => {
    const [year, m] = month.split("-");
    return request.get<ApiResponse<MonthlyStatistics>>(
      `/statistics/family/${familyId}`,
      { params: { year, month: m } }
    );
  },
};

// AI API
export const aiApi = {
  parse: (text: string) =>
    request.post<ApiResponse<AIParseResponse>>("/ai/parse", { text }),

  analyze: (params: { period: "week" | "month" | "year"; familyId?: number }) =>
    request.post<ApiResponse<AIAnalyzeResponse>>("/ai/analyze", params),

  chat: (question: string) =>
    request.post<ApiResponse<{ answer: string }>>("/ai/chat", { question }),
};
