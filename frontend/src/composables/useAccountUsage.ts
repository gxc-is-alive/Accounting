/**
 * 账户使用记录追踪 Composable
 * 负责记录账户使用情况并实现智能排序
 */
import type { Account } from "@/types";

// 存储键名
const STORAGE_KEY = "account_usage_records";

// 数据版本，用于未来迁移
const STORAGE_VERSION = 1;

// 使用记录接口
export interface AccountUsageRecord {
  accountId: number;
  usageCount: number;
  lastUsedAt: string; // ISO 8601 格式
}

// 存储结构接口
export interface AccountUsageStorage {
  version: number;
  records: AccountUsageRecord[];
}

// 评分结果接口
export interface SortScore {
  accountId: number;
  score: number;
  usageScore: number;
  recencyScore: number;
}

// 内存缓存（用于 localStorage 不可用时的降级）
let memoryStorage: AccountUsageStorage | null = null;

/**
 * 检查 localStorage 是否可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 从存储中读取使用记录
 */
export function loadUsageRecords(): AccountUsageStorage {
  // 优先使用 localStorage
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as AccountUsageStorage;
        // 验证数据格式
        if (parsed.version && Array.isArray(parsed.records)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("读取账户使用记录失败，将重新初始化:", e);
      // 清除损坏的数据
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // 使用内存存储或初始化
  if (memoryStorage) {
    return memoryStorage;
  }

  return {
    version: STORAGE_VERSION,
    records: [],
  };
}

/**
 * 保存使用记录到存储
 */
export function saveUsageRecords(storage: AccountUsageStorage): void {
  // 更新内存缓存
  memoryStorage = storage;

  // 尝试保存到 localStorage
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (e) {
      console.warn("保存账户使用记录失败:", e);
    }
  }
}

/**
 * 获取指定账户的使用记录
 */
export function getUsageRecord(accountId: number): AccountUsageRecord | null {
  const storage = loadUsageRecords();
  return storage.records.find((r) => r.accountId === accountId) || null;
}

/**
 * 记录账户使用
 * @param accountId 账户 ID
 */
export function recordUsage(accountId: number): void {
  const storage = loadUsageRecords();
  const now = new Date().toISOString();

  const existingIndex = storage.records.findIndex(
    (r) => r.accountId === accountId
  );

  if (existingIndex >= 0) {
    // 更新现有记录
    storage.records[existingIndex].usageCount += 1;
    storage.records[existingIndex].lastUsedAt = now;
  } else {
    // 创建新记录
    storage.records.push({
      accountId,
      usageCount: 1,
      lastUsedAt: now,
    });
  }

  saveUsageRecords(storage);
}

/**
 * 计算使用频率得分 (0-100)
 * @param usageCount 使用次数
 * @param maxUsageCount 最大使用次数
 */
export function calculateUsageScore(
  usageCount: number,
  maxUsageCount: number
): number {
  if (maxUsageCount <= 0) return 0;
  return (usageCount / maxUsageCount) * 100;
}

/**
 * 计算最近使用得分 (0-100)
 * 30 天内线性衰减
 * @param lastUsedAt 最近使用时间 (ISO 字符串)
 */
export function calculateRecencyScore(lastUsedAt: string): number {
  const lastUsedDate = new Date(lastUsedAt);
  const now = new Date();
  const daysSinceLastUse =
    (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);

  // 30 天后衰减到 0，每天衰减约 3.33 分
  return Math.max(0, 100 - daysSinceLastUse * 3.33);
}

/**
 * 计算综合评分
 * score = usageScore * 0.6 + recencyScore * 0.4
 */
export function calculateScore(
  usageScore: number,
  recencyScore: number
): number {
  return usageScore * 0.6 + recencyScore * 0.4;
}

/**
 * 获取排序后的账户列表
 * @param accounts 账户列表
 */
export function getSortedAccounts(accounts: Account[]): Account[] {
  const storage = loadUsageRecords();

  // 找出最大使用次数
  const maxUsageCount = Math.max(
    ...storage.records.map((r) => r.usageCount),
    1
  );

  // 计算每个账户的评分
  const accountScores: Map<number, SortScore> = new Map();

  for (const account of accounts) {
    const record = storage.records.find((r) => r.accountId === account.id);

    if (record) {
      const usageScore = calculateUsageScore(record.usageCount, maxUsageCount);
      const recencyScore = calculateRecencyScore(record.lastUsedAt);
      const score = calculateScore(usageScore, recencyScore);

      accountScores.set(account.id, {
        accountId: account.id,
        score,
        usageScore,
        recencyScore,
      });
    } else {
      // 未使用的账户评分为 -1，确保排在已使用账户之后
      accountScores.set(account.id, {
        accountId: account.id,
        score: -1,
        usageScore: 0,
        recencyScore: 0,
      });
    }
  }

  // 排序：先按评分降序，评分相同按创建时间升序
  return [...accounts].sort((a, b) => {
    const scoreA = accountScores.get(a.id)?.score ?? -1;
    const scoreB = accountScores.get(b.id)?.score ?? -1;

    if (scoreA !== scoreB) {
      return scoreB - scoreA; // 降序
    }

    // 评分相同，按创建时间升序
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * 清除所有使用记录（用于测试）
 */
export function clearUsageRecords(): void {
  memoryStorage = null;
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * useAccountUsage Composable
 */
export function useAccountUsage() {
  return {
    recordUsage,
    getUsageRecord,
    getSortedAccounts,
    loadUsageRecords,
    clearUsageRecords,
  };
}

export default useAccountUsage;
