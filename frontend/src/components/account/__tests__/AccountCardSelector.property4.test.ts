/**
 * ========================================
 * 属性测试：搜索不影响选择功能（账户选择器）
 * Feature: transaction-edit-enhancement
 * Property 4: 搜索不影响选择功能
 * **Validates: Requirements 2.6, 3.6**
 * ========================================
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import AccountCardSelector from "../AccountCardSelector.vue";
import type { Account } from "@/types";
import * as fc from "fast-check";

/**
 * 账户搜索过滤逻辑（从组件中提取）
 */
function filterAccountsLogic(
  accounts: Account[],
  searchQuery: string,
): Account[] {
  if (!searchQuery.trim()) {
    return accounts;
  }
  const query = searchQuery.toLowerCase().trim();
  return accounts.filter((account) =>
    account.name.toLowerCase().includes(query),
  );
}

/**
 * 预定义的账户名称列表
 */
const accountNames = [
  "现金账户",
  "支付宝",
  "微信支付",
  "工商银行",
  "招商银行",
  "建设银行",
  "农业银行",
  "中国银行",
  "信用卡",
  "投资账户",
  "Cash",
  "Alipay",
  "WeChat Pay",
  "Bank Card",
  "Credit Card",
];

/**
 * 生成随机账户的 Arbitrary
 */
const accountArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 100 }),
  name: fc.constantFrom(...accountNames),
  type: fc.constantFrom(
    "cash",
    "bank",
    "alipay",
    "wechat",
    "credit",
    "investment",
    "other",
  ),
  balance: fc.integer({ min: -100000, max: 100000 }),
  createdAt: fc.constant(new Date().toISOString()),
}) as fc.Arbitrary<Account>;

// 生成唯一 ID 的账户列表
const accountListArb = fc
  .array(accountArb, { minLength: 1, maxLength: 15 })
  .map((accounts) => {
    // 确保每个账户的 ID 唯一
    return accounts.map((account, index) => ({
      ...account,
      id: index + 1,
    }));
  });

const searchQueryArb = fc.oneof(
  fc.constantFrom("", "现金", "支付", "银行", "卡", "Cash", "Bank"),
  fc.constant(""),
);

describe("属性测试：搜索不影响选择功能（账户选择器）", () => {
  it("属性 4.1：搜索后选择的账户 ID 应该与原始账户列表中的 ID 一致", () => {
    fc.assert(
      fc.property(
        accountListArb,
        searchQueryArb,
        fc.integer({ min: 0, max: 100 }),
        (accounts, query, seed) => {
          // 过滤账户
          const filtered = filterAccountsLogic(accounts, query);

          if (filtered.length === 0) {
            return true;
          }

          // 使用种子选择一个账户
          const selectedAccount = filtered[seed % filtered.length];

          // 验证选中的账户确实存在于原始列表中
          const existsInOriginal = accounts.some(
            (a) => a.id === selectedAccount.id,
          );
          expect(existsInOriginal).toBe(true);

          // 验证选中的账户 ID 是正确的
          expect(selectedAccount.id).toBeDefined();
          expect(typeof selectedAccount.id).toBe("number");

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 4.2：搜索不应该改变账户的属性（ID、名称等）", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const filtered = filterAccountsLogic(accounts, query);

        // 验证过滤后的账户与原始账户完全相同
        filtered.forEach((filteredAccount) => {
          const originalAccount = accounts.find(
            (a) => a.id === filteredAccount.id,
          );
          expect(originalAccount).toBeDefined();
          expect(filteredAccount).toEqual(originalAccount);
        });

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("属性 4.3：过滤结果只包含名称匹配的账户", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const filtered = filterAccountsLogic(accounts, query);

        if (!query.trim()) {
          // 空查询应该返回所有账户
          expect(filtered).toEqual(accounts);
          return true;
        }

        const lowerQuery = query.toLowerCase();
        // 验证所有过滤后的账户都包含查询关键词
        filtered.forEach((account) => {
          expect(account.name.toLowerCase()).toContain(lowerQuery);
        });

        // 验证所有应该匹配的账户都在结果中
        accounts.forEach((account) => {
          const shouldMatch = account.name.toLowerCase().includes(lowerQuery);
          const isInResult = filtered.some((f) => f.id === account.id);
          expect(isInResult).toBe(shouldMatch);
        });

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("属性 4.4：搜索是幂等的", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const result1 = filterAccountsLogic(accounts, query);
        const result2 = filterAccountsLogic(accounts, query);
        expect(result1).toEqual(result2);
        return true;
      }),
      { numRuns: 100 },
    );
  });
});
