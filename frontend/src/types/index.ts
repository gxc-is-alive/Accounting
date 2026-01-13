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
  | "investment"
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

// ========== 家庭账单优化：新增类型 ==========

// 成员贡献统计
export interface MemberContribution {
  userId: number;
  nickname: string;
  income: number;
  expense: number;
  incomePercentage: number;
  expensePercentage: number;
}

// 家庭概览统计
export interface FamilyOverview {
  familyId: number;
  familyName: string;
  period: {
    year: number;
    month: number;
  };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalAssets: number;
  memberCount: number;
  memberContributions: MemberContribution[];
}

// 家庭资产统计
export interface FamilyAssets {
  familyId: number;
  totalAssets: number;
  byAccountType: Array<{
    type: string;
    typeName: string;
    total: number;
  }>;
  byMember: Array<{
    userId: number;
    nickname: string;
    accounts: Array<{
      id: number;
      name: string;
      type: string;
      balance: number;
    }>;
    totalBalance: number;
  }>;
}

// 家庭年度统计
export interface FamilyYearlyStats {
  familyId: number;
  familyName: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  monthlyTrend: Array<{
    month: number;
    label: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  categoryBreakdown: Array<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string;
    amount: number;
    percentage: number;
  }>;
  memberContributions: MemberContribution[];
}

// 家庭交易记录
export interface FamilyTransaction {
  id: number;
  userId: number;
  userNickname: string;
  amount: number;
  type: TransactionType;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  accountId: number;
  accountName: string;
  date: string;
  note?: string;
  createdAt: string;
}

// 家庭交易筛选参数
export interface FamilyTransactionFilters {
  memberId?: number;
  categoryId?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ========== 附件相关类型 ==========

// 附件类型
export interface Attachment {
  id: number;
  transactionId?: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

// 上传响应
export interface AttachmentUploadResponse {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

// 附件关联请求
export interface LinkAttachmentsRequest {
  attachmentIds: number[];
  transactionId: number;
}

// 文件验证结果
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// 支持的文件类型
export const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/quicktime"],
};

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  pdf: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
};

// 最大附件数量
export const MAX_ATTACHMENTS = 5;

// ========== 投资追踪：类型定义 ==========

// 投资账户
export interface InvestmentAccount {
  id: number;
  userId: number;
  name: string;
  type: "investment";
  shares: number; // 持仓份额
  costPrice: number; // 成本价（每份）
  currentNetValue: number; // 当前净值
  balance: number; // 当前市值 = shares × currentNetValue
  icon?: string;
  createdAt: string;
  // 计算字段
  totalCost: number; // 总成本 = shares × costPrice
  profit: number; // 盈亏 = balance - totalCost
  profitRate: number; // 收益率 = profit / totalCost × 100
}

// 估值记录
export interface ValuationRecord {
  id: number;
  accountId: number;
  netValue: number;
  marketValue: number;
  date: string;
  createdAt: string;
}

// 投资汇总
export interface InvestmentSummary {
  totalCost: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
  accounts: InvestmentAccount[];
}

// 投资概览统计
export interface InvestmentOverview {
  totalCost: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
  accountCount: number;
}

// 投资账户详情（含估值历史）
export interface InvestmentAccountDetail extends InvestmentAccount {
  valuationHistory: ValuationRecord[];
}

// 创建投资账户参数
export interface CreateInvestmentAccountParams {
  name: string;
  shares: number;
  costPrice: number;
  currentNetValue: number;
  icon?: string;
}

// 更新投资账户参数
export interface UpdateInvestmentAccountParams {
  name?: string;
  icon?: string;
}

// 买入参数
export interface BuySharesParams {
  shares: number;
  price: number;
  date?: string;
  sourceAccountId?: number;
}

// 卖出参数
export interface SellSharesParams {
  shares: number;
  price: number;
  date?: string;
  targetAccountId?: number;
}

// 买入/卖出结果
export interface TradeResult {
  account: InvestmentAccount;
  realizedProfit?: number;
  tradeAmount: number;
}

// 净值更新参数
export interface UpdateNetValueParams {
  netValue: number;
  date?: string;
}

// 批量净值更新参数
export interface BatchUpdateNetValueParams {
  valuations: Array<{
    accountId: number;
    netValue: number;
  }>;
  date?: string;
}
