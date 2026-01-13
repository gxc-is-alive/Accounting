/**
 * useAccountUsage 属性测试
 * Feature: account-card-selector
 * Property 2: 使用次数递增不变量
 * Property 3: 使用记录持久化往返
 * Validates: Requirements 2.1, 2.3, 2.4
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  recordUsage,
  getUsageRecord,
  loadUsageRecords,
  saveUsageRecords,
  clearUsageRecords,
  type AccountUsageStorage,
  type AccountUsageRecord,
} from "../useAccountUsage";

describe("useAccountUsage 属性测试", () => {
  // 每个测试前清除存储
  beforeEach(() => {
    clearUsageRecords();
  });

  afterEach(() => {
    clearUsageRecords();
  });

  /**
   * Property 2: 使用次数递增不变量
   * 对于任意账户和任意初始使用次数 n，调用 recordUsage 后，该账户的使用次数应为 n + 1
   * Validates: Requirements 2.1, 2.3
   */
  describe("Property 2: 使用次数递增不变量", () => {
    it("对于任意账户 ID，首次调用 recordUsage 后使用次数应为 1", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (accountId) => {
          clearUsageRecords();
          recordUsage(accountId);
          const record = getUsageRecord(accountId);
          expect(record).not.toBeNull();
          expect(record!.usageCount).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意初始使用次数 n，再次调用 recordUsage 后使用次数应为 n + 1", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 1, max: 100 }),
          (accountId, initialCount) => {
            clearUsageRecords();

            // 模拟初始使用次数
            for (let i = 0; i < initialCount; i++) {
              recordUsage(accountId);
            }

            const beforeRecord = getUsageRecord(accountId);
            expect(beforeRecord!.usageCount).toBe(initialCount);

            // 再次调用
            recordUsage(accountId);

            const afterRecord = getUsageRecord(accountId);
            expect(afterRecord!.usageCount).toBe(initialCount + 1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("recordUsage 应更新最近使用时间", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100000 }), (accountId) => {
          clearUsageRecords();
          const beforeTime = new Date().toISOString();
          recordUsage(accountId);
          const afterTime = new Date().toISOString();

          const record = getUsageRecord(accountId);
          expect(record).not.toBeNull();
          expect(record!.lastUsedAt >= beforeTime).toBe(true);
          expect(record!.lastUsedAt <= afterTime).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 使用记录持久化往返
   * 对于任意账户使用记录，存储到 localStorage 后再读取，应得到等价的记录数据
   * Validates: Requirements 2.4
   */
  describe("Property 3: 使用记录持久化往返", () => {
    // 生成有效的使用记录
    const usageRecordArbitrary: fc.Arbitrary<AccountUsageRecord> = fc.record({
      accountId: fc.integer({ min: 1, max: 100000 }),
      usageCount: fc.integer({ min: 1, max: 10000 }),
      lastUsedAt: fc
        .integer({ min: 1577836800000, max: 1893456000000 })
        .map((ts) => new Date(ts).toISOString()),
    });

    const usageStorageArbitrary: fc.Arbitrary<AccountUsageStorage> = fc.record({
      version: fc.constant(1),
      records: fc.array(usageRecordArbitrary, { minLength: 0, maxLength: 20 }),
    });

    it("对于任意使用记录存储，保存后读取应得到等价数据", () => {
      fc.assert(
        fc.property(usageStorageArbitrary, (storage) => {
          clearUsageRecords();

          // 保存
          saveUsageRecords(storage);

          // 读取
          const loaded = loadUsageRecords();

          // 验证
          expect(loaded.version).toBe(storage.version);
          expect(loaded.records.length).toBe(storage.records.length);

          for (let i = 0; i < storage.records.length; i++) {
            expect(loaded.records[i].accountId).toBe(
              storage.records[i].accountId
            );
            expect(loaded.records[i].usageCount).toBe(
              storage.records[i].usageCount
            );
            expect(loaded.records[i].lastUsedAt).toBe(
              storage.records[i].lastUsedAt
            );
          }
        }),
        { numRuns: 100 }
      );
    });

    it("通过 recordUsage 记录的数据应能正确读取", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.integer({ min: 1, max: 10 }),
          (accountId, times) => {
            clearUsageRecords();

            // 记录使用
            for (let i = 0; i < times; i++) {
              recordUsage(accountId);
            }

            // 读取验证
            const record = getUsageRecord(accountId);
            expect(record).not.toBeNull();
            expect(record!.accountId).toBe(accountId);
            expect(record!.usageCount).toBe(times);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("边界情况测试", () => {
    it("getUsageRecord 对于不存在的账户应返回 null", () => {
      clearUsageRecords();
      const record = getUsageRecord(99999);
      expect(record).toBeNull();
    });

    it("多个账户的使用记录应互不影响", () => {
      clearUsageRecords();

      recordUsage(1);
      recordUsage(1);
      recordUsage(2);

      const record1 = getUsageRecord(1);
      const record2 = getUsageRecord(2);

      expect(record1!.usageCount).toBe(2);
      expect(record2!.usageCount).toBe(1);
    });
  });
});
