/**
 * 分类使用记录追踪 Composable
 * 负责记录分类使用情况并实现智能排序
 */
import type { Category } from "@/types";

// 存储键名
const STORAGE_KEY = "category_usage_records";

// 数据版本，用于未来迁移
const STORAGE_VERSION = 1;

// 使用记录接口
export interface CategoryUsageRecord {
  categoryId: number;
  usageCount: number;
  lastUsedAt: string; // ISO 8601 格式
}

// 存储结构接口
export interface CategoryUsageStorage {
  version: number;
  records: CategoryUsageRecord[];
}

// 内存缓存（用于 localStorage 不可用时的降级）
let memoryStorage: CategoryUsageStorage | null = null;

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
export function loadUsageRecords(): CategoryUsageStorage {
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as CategoryUsageStorage;
        if (parsed.version && Array.isArray(parsed.records)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("读取分类使用记录失败，将重新初始化:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

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
export function saveUsageRecords(storage: CategoryUsageStorage): void {
  memoryStorage = storage;

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (e) {
      console.warn("保存分类使用记录失败:", e);
    }
  }
}

/**
 * 记录分类使用
 */
export function recordUsage(categoryId: number): void {
  const storage = loadUsageRecords();
  const now = new Date().toISOString();

  const existingIndex = storage.records.findIndex(
    (r) => r.categoryId === categoryId
  );

  if (existingIndex >= 0) {
    storage.records[existingIndex].usageCount += 1;
    storage.records[existingIndex].lastUsedAt = now;
  } else {
    storage.records.push({
      categoryId,
      usageCount: 1,
      lastUsedAt: now,
    });
  }

  saveUsageRecords(storage);
}

/**
 * 计算使用频率得分 (0-100)
 */
function calculateUsageScore(
  usageCount: number,
  maxUsageCount: number
): number {
  if (maxUsageCount <= 0) return 0;
  return (usageCount / maxUsageCount) * 100;
}

/**
 * 计算最近使用得分 (0-100)
 * 30 天内线性衰减
 */
function calculateRecencyScore(lastUsedAt: string): number {
  const lastUsedDate = new Date(lastUsedAt);
  const now = new Date();
  const daysSinceLastUse =
    (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);

  return Math.max(0, 100 - daysSinceLastUse * 3.33);
}

/**
 * 计算综合评分
 */
function calculateScore(usageScore: number, recencyScore: number): number {
  return usageScore * 0.6 + recencyScore * 0.4;
}

/**
 * 获取排序后的分类列表
 */
export function getSortedCategories(categories: Category[]): Category[] {
  const storage = loadUsageRecords();

  const maxUsageCount = Math.max(
    ...storage.records.map((r) => r.usageCount),
    1
  );

  const categoryScores: Map<number, number> = new Map();

  for (const category of categories) {
    const record = storage.records.find((r) => r.categoryId === category.id);

    if (record) {
      const usageScore = calculateUsageScore(record.usageCount, maxUsageCount);
      const recencyScore = calculateRecencyScore(record.lastUsedAt);
      const score = calculateScore(usageScore, recencyScore);
      categoryScores.set(category.id, score);
    } else {
      categoryScores.set(category.id, -1);
    }
  }

  return [...categories].sort((a, b) => {
    const scoreA = categoryScores.get(a.id) ?? -1;
    const scoreB = categoryScores.get(b.id) ?? -1;

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 评分相同，按 ID 排序（保持原有顺序）
    return a.id - b.id;
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
 * useCategoryUsage Composable
 */
export function useCategoryUsage() {
  return {
    recordUsage,
    getSortedCategories,
    loadUsageRecords,
    clearUsageRecords,
  };
}

export default useCategoryUsage;
