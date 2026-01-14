import request from "./request";
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  Account,
  Category,
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
  FamilyOverview,
  FamilyAssets,
  FamilyYearlyStats,
  FamilyTransaction,
  FamilyTransactionFilters,
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

  // 快速平账相关
  previewBalance: (id: number, actualBalance: number) =>
    request.get<ApiResponse<BalancePreviewResponse>>(
      `/accounts/${id}/balance-preview`,
      { params: { actualBalance } }
    ),

  executeQuickBalance: (id: number, data: QuickBalanceParams) =>
    request.post<ApiResponse<QuickBalanceResponse>>(
      `/accounts/${id}/quick-balance`,
      data
    ),
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

  // ========== 家庭账单优化：新增 API ==========

  // 获取家庭交易列表（基于成员加入时间）
  familyList: (familyId: number, params?: FamilyTransactionFilters) =>
    request.get<ApiResponse<PaginatedResponse<FamilyTransaction>>>(
      `/transactions/family/${familyId}`,
      { params }
    ),
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

  // ========== 家庭账单优化：新增 API ==========

  // 获取家庭概览统计
  familyOverview: (familyId: number, month: string) => {
    const [year, m] = month.split("-");
    return request.get<ApiResponse<FamilyOverview>>(
      `/statistics/family/${familyId}/overview`,
      { params: { year, month: m } }
    );
  },

  // 获取家庭总资产
  familyAssets: (familyId: number) =>
    request.get<ApiResponse<FamilyAssets>>(
      `/statistics/family/${familyId}/assets`
    ),

  // 获取家庭年度统计
  familyYearly: (familyId: number, year: number) =>
    request.get<ApiResponse<FamilyYearlyStats>>(
      `/statistics/family/${familyId}/yearly`,
      { params: { year } }
    ),
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

// ========== 附件 API ==========
import type {
  Attachment,
  AttachmentUploadResponse,
  LinkAttachmentsRequest,
  InvestmentSummary,
  InvestmentAccountDetail,
  InvestmentAccount,
  InvestmentOverview,
  CreateInvestmentAccountParams,
  UpdateInvestmentAccountParams,
  BuySharesParams,
  SellSharesParams,
  TradeResult,
  UpdateNetValueParams,
  BatchUpdateNetValueParams,
  AutoInvestmentPlan,
  ExecutionRecord,
  InvestmentReminder,
  CreateAutoInvestmentPlanParams,
  UpdateAutoInvestmentPlanParams,
  OneTimeBuyParams,
  ExecutionRecordFilters,
  ExecutionRecordPaginatedResponse,
  BalancePreviewResponse,
  QuickBalanceParams,
  QuickBalanceResponse,
  BalanceAdjustmentFilters,
  BalanceAdjustmentPaginatedResponse,
} from "@/types";

export const attachmentApi = {
  // 上传单个附件
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request.post<ApiResponse<AttachmentUploadResponse>>(
      "/attachments/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // 批量上传附件
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    return request.post<ApiResponse<AttachmentUploadResponse[]>>(
      "/attachments/upload-multiple",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },

  // 获取单个附件
  get: (id: number) =>
    request.get<ApiResponse<Attachment>>(`/attachments/${id}`),

  // 获取交易的所有附件
  getByTransaction: (transactionId: number) =>
    request.get<ApiResponse<Attachment[]>>(
      `/attachments/transaction/${transactionId}`
    ),

  // 删除附件
  delete: (id: number) => request.delete<ApiResponse>(`/attachments/${id}`),

  // 关联附件到交易
  link: (data: LinkAttachmentsRequest) =>
    request.post<ApiResponse<{ success: boolean }>>("/attachments/link", data),
};

// ========== 投资 API ==========

export const investmentApi = {
  // 获取投资账户列表（含汇总）
  list: () =>
    request.get<ApiResponse<InvestmentSummary>>("/investment/accounts"),

  // 获取投资概览统计
  getSummary: () =>
    request.get<ApiResponse<InvestmentOverview>>("/investment/summary"),

  // 获取单个投资账户详情
  getById: (id: number) =>
    request.get<ApiResponse<InvestmentAccountDetail>>(
      `/investment/accounts/${id}`
    ),

  // 创建投资账户
  create: (data: CreateInvestmentAccountParams) =>
    request.post<ApiResponse<InvestmentAccount>>("/investment/accounts", data),

  // 更新投资账户
  update: (id: number, data: UpdateInvestmentAccountParams) =>
    request.put<ApiResponse<InvestmentAccount>>(
      `/investment/accounts/${id}`,
      data
    ),

  // 删除投资账户
  delete: (id: number) =>
    request.delete<ApiResponse>(`/investment/accounts/${id}`),

  // 买入份额
  buy: (id: number, data: BuySharesParams) =>
    request.post<ApiResponse<TradeResult>>(
      `/investment/accounts/${id}/buy`,
      data
    ),

  // 卖出份额
  sell: (id: number, data: SellSharesParams) =>
    request.post<ApiResponse<TradeResult>>(
      `/investment/accounts/${id}/sell`,
      data
    ),

  // 更新净值
  updateNetValue: (id: number, data: UpdateNetValueParams) =>
    request.post<ApiResponse<InvestmentAccount>>(
      `/investment/accounts/${id}/valuation`,
      data
    ),

  // 批量更新净值
  updateNetValueBatch: (data: BatchUpdateNetValueParams) =>
    request.post<ApiResponse<InvestmentAccount[]>>(
      "/investment/valuations/batch",
      data
    ),
};

// ========== 定投 API ==========

export const autoInvestmentApi = {
  // ========== 定投计划 ==========

  // 获取定投计划列表
  listPlans: () =>
    request.get<ApiResponse<AutoInvestmentPlan[]>>("/auto-investment/plans"),

  // 获取单个定投计划详情
  getPlan: (id: number) =>
    request.get<ApiResponse<AutoInvestmentPlan>>(
      `/auto-investment/plans/${id}`
    ),

  // 创建定投计划
  createPlan: (data: CreateAutoInvestmentPlanParams) =>
    request.post<ApiResponse<AutoInvestmentPlan>>(
      "/auto-investment/plans",
      data
    ),

  // 更新定投计划
  updatePlan: (id: number, data: UpdateAutoInvestmentPlanParams) =>
    request.put<ApiResponse<AutoInvestmentPlan>>(
      `/auto-investment/plans/${id}`,
      data
    ),

  // 暂停定投计划
  pausePlan: (id: number) =>
    request.post<ApiResponse<AutoInvestmentPlan>>(
      `/auto-investment/plans/${id}/pause`
    ),

  // 恢复定投计划
  resumePlan: (id: number) =>
    request.post<ApiResponse<AutoInvestmentPlan>>(
      `/auto-investment/plans/${id}/resume`
    ),

  // 删除定投计划
  deletePlan: (id: number) =>
    request.delete<ApiResponse>(`/auto-investment/plans/${id}`),

  // 获取计划的执行记录
  getPlanRecords: (id: number) =>
    request.get<ApiResponse<ExecutionRecord[]>>(
      `/auto-investment/plans/${id}/records`
    ),

  // ========== 执行记录 ==========

  // 获取执行记录列表
  listRecords: (params?: ExecutionRecordFilters) =>
    request.get<ApiResponse<ExecutionRecordPaginatedResponse>>(
      "/auto-investment/records",
      { params }
    ),

  // 单次买入转换（支持折扣）
  oneTimeBuy: (data: OneTimeBuyParams) =>
    request.post<ApiResponse<ExecutionRecord>>(
      "/auto-investment/one-time-buy",
      data
    ),

  // ========== 提醒 ==========

  // 获取未读提醒
  listReminders: () =>
    request.get<ApiResponse<InvestmentReminder[]>>(
      "/auto-investment/reminders"
    ),

  // 获取未读提醒数量
  getReminderCount: () =>
    request.get<ApiResponse<{ count: number }>>(
      "/auto-investment/reminders/count"
    ),

  // 标记提醒为已读
  markReminderRead: (id: number) =>
    request.post<ApiResponse>(`/auto-investment/reminders/${id}/read`),

  // 标记所有提醒为已读
  markAllRemindersRead: () =>
    request.post<ApiResponse<{ count: number }>>(
      "/auto-investment/reminders/read-all"
    ),
};

// ========== 平账记录 API ==========

export const balanceAdjustmentApi = {
  // 获取平账记录列表
  getRecords: (params?: BalanceAdjustmentFilters) =>
    request.get<ApiResponse<BalanceAdjustmentPaginatedResponse>>(
      "/balance-adjustments",
      { params }
    ),
};
