/**
 * useAccountUsage 智能排序属性测试
 * Feature: account-card-selector
 * Property 4: 智能排序降序性
 * Property 5: 评分权重正确性
 * Validates: Requirements 3.1, 3.2, 3.4
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  getSortedAccounts,
  recordUsage,
  clearUsageRecords,
  calculateUsageScore,
  calculateRecencyScore,
  calculateScore,
  loadUsageRecords,
  saveUsageRecords,
  type AccountUsageStorage,
} from "../useAccountUsage";
import type { Account, AccountType } from "@/types";

// 所有有效的账户类型
const ALL_ACCOUNT_TYPES: AccountType[] = [
  "cash",
  "bank",
  "alipay",
  "wechat",
  "credit",
  "investment",
  "other",
];

// 生成随机账户的 Arbitrary
const accountArbitrary: fc.Arbitrary<Account> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom(...ALL_ACCOUNT_TYPES),
  balance: fc.float({ min: -1000000, max: 1000000 }),
  icon: fc.constant(undefined),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Account>;

// 生成唯一 ID 的账户列表
const uniqueAccountsArbitrary = fc
  .array(accountArbitrary, { minLength: 1, maxLength: 10 })
  .map((accounts) => {
    // 确保 ID 唯一
    const seen = new Set<number>();
    return accounts.filter((acc) => {
      if (seen.has(acc.id)) return false;
      seen.add(acc.id);
      return true;
    });
  })
  .filter((accounts) => accounts.length > 0);

describe("智能排序属性测试", () => {
  beforeEach(() => {
    clearUsageRecords();
  });

  afterEach(() => {
    clearUsageRecords();
  });

  /**
   * Property 5: 评分权重正确性
   * 对于任意账户使用记录，计算的综合评分应等于 usageScore * 0.6 + recencyScore * 0.4
   * Validates: Requirements 3.2
   */
  describe("Property 5: 评分权重正确性", () => {
    it("综合评分应等于 usageScore * 0.6 + recencyScore * 0.4", () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (usageScore, recencyScore) => {
            const score = calculateScore(usageScore, recencyScore);
            const expected = usageScore * 0.6 + recencyScore * 0.4;
            expect(Math.abs(score - expected)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("使用频率得分计算正确", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (usageCount, maxUsageCount) => {
            // 确保 usageCount <= maxUsageCount
            const actualUsageCount = Math.min(usageCount, maxUsageCount);
            const score = calculateUsageScore(actualUsageCount, maxUsageCount);
            const expected = (actualUsageCount / maxUsageCount) * 100;
            expect(Math.abs(score - expected)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("最近使用得分在 0-100 范围内", () => {
      fc.assert(
        fc.property(
          fc
            .integer({ min: 1577836800000, max: Date.now() })
            .map((ts) => new Date(ts).toISOString()),
          (lastUsedAt) => {
            const score = calculateRecencyScore(lastUsedAt);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("最近使用的账户得分更高", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const scoreNow = calculateRecencyScore(now.toISOString());
      const scoreYesterday = calculateRecencyScore(yesterday.toISOString());
      const scoreLastWeek = calculateRecencyScore(lastWeek.toISOString());

      expect(scoreNow).toBeGreaterThan(scoreYesterday);
      expect(scoreYesterday).toBeGreaterThan(scoreLastWeek);
    });
  });

  /**
   * Property 4: 智能排序降序性
   * 对于任意账户列表和使用记录，排序后的列表中，任意相邻两个账户 A 和 B（A 在 B 前面），
   * A 的综合评分应大于等于 B 的综合评分
   * Validates: Requirements 3.1, 3.4
   */
  describe("Property 4: 智能排序降序性", () => {
    it("排序后的账户列表应按评分降序排列", () => {
      fc.assert(
        fc.property(uniqueAccountsArbitrary, (accounts) => {
          clearUsageRecords();

          // 为部分账户添加使用记录
          accounts.forEach((acc, index) => {
            if (index % 2 === 0) {
              // 模拟不同的使用次数
              for (let i = 0; i < index + 1; i++) {
                recordUsage(acc.id);
              }
            }
          });

          const sorted = getSortedAccounts(accounts);

          // 验证排序结果包含所有账户
          expect(sorted.length).toBe(accounts.length);

          // 获取使用记录用于计算评分
          const storage = loadUsageRecords();
          const maxUsageCount = Math.max(
            ...storage.records.map((r) => r.usageCount),
            1
          );

          // 计算每个账户的评分
          const getScore = (accountId: number): number => {
            const record = storage.records.find(
              (r) => r.accountId === accountId
            );
            if (!record) return -1;
            const usageScore = calculateUsageScore(
              record.usageCount,
              maxUsageCount
            );
            const recencyScore = calculateRecencyScore(record.lastUsedAt);
            return calculateScore(usageScore, recencyScore);
          };

          // 验证降序排列
          for (let i = 0; i < sorted.length - 1; i++) {
            const scoreA = getScore(sorted[i].id);
            const scoreB = getScore(sorted[i + 1].id);
            expect(scoreA).toBeGreaterThanOrEqual(scoreB);
          }
        }),
        { numRuns: 50 }
      );
    });

    it("未使用的账户应排在已使用账户之后", () => {
      fc.assert(
        fc.property(uniqueAccountsArbitrary, (accounts) => {
          if (accounts.length < 2) return;

          clearUsageRecords();

          // 只为第一个账户添加使用记录
          recordUsage(accounts[0].id);

          const sorted = getSortedAccounts(accounts);

          // 第一个账户应该排在最前面
          expect(sorted[0].id).toBe(accounts[0].id);

          // 获取使用记录
          const storage = loadUsageRecords();

          // 验证已使用的账户在未使用的账户之前
          let foundUnused = false;
          for (const acc of sorted) {
            const hasRecord = storage.records.some(
              (r) => r.accountId === acc.id
            );
            if (!hasRecord) {
              foundUnused = true;
            } else if (foundUnused) {
              // 如果已经遇到未使用的账户，不应该再遇到已使用的账户
              throw new Error("已使用的账户应该排在未使用的账户之前");
            }
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("边界情况测试", () => {
    it("空账户列表应返回空数组", () => {
      const sorted = getSortedAccounts([]);
      expect(sorted).toEqual([]);
    });

    it("单个账户应直接返回", () => {
      const account: Account = {
        id: 1,
        userId: 1,
        name: "测试账户",
        type: "cash",
        balance: 100,
        createdAt: new Date().toISOString(),
      };
      const sorted = getSortedAccounts([account]);
      expect(sorted.length).toBe(1);
      expect(sorted[0].id).toBe(1);
    });

    it("所有账户都未使用时应保持稳定排序", () => {
      clearUsageRecords();

      const accounts: Account[] = [
        {
          id: 1,
          userId: 1,
          name: "账户1",
          type: "cash",
          balance: 100,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          userId: 1,
          name: "账户2",
          type: "bank",
          balance: 200,
          createdAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: 3,
          userId: 1,
          name: "账户3",
          type: "alipay",
          balance: 300,
          createdAt: "2024-01-03T00:00:00.000Z",
        },
      ];

      const sorted = getSortedAccounts(accounts);

      // 所有账户评分相同（-1），应按创建时间升序排列
      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });
  });
});
