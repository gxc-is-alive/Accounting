/**
 * iconMap 属性测试
 * Feature: account-card-selector
 * Property 6: 图标选择优先级
 * Property 7: 账户类型图标完备性
 * Validates: Requirements 6.1, 6.2, 6.3
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { accountTypeIconMap, getAccountIcon, iconMap } from "../iconMap";
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
const accountArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom(...ALL_ACCOUNT_TYPES),
  balance: fc.float({ min: -1000000, max: 1000000, noNaN: true }),
  icon: fc.option(fc.constantFrom(...Object.keys(iconMap)), { nil: undefined }),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Account>;

// 生成有自定义图标的账户
const accountWithCustomIconArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom(...ALL_ACCOUNT_TYPES),
  balance: fc.float({ min: -1000000, max: 1000000, noNaN: true }),
  icon: fc.constantFrom(...Object.keys(iconMap)),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Account>;

// 生成没有自定义图标的账户
const accountWithoutCustomIconArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom(...ALL_ACCOUNT_TYPES),
  balance: fc.float({ min: -1000000, max: 1000000, noNaN: true }),
  icon: fc.constant(undefined),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Account>;

describe("账户图标映射属性测试", () => {
  /**
   * Property 7: 账户类型图标完备性
   * 对于任意有效的账户类型，应存在对应的默认图标映射
   * Validates: Requirements 6.1
   */
  describe("Property 7: 账户类型图标完备性", () => {
    it("所有账户类型都应有对应的默认图标", () => {
      ALL_ACCOUNT_TYPES.forEach((type) => {
        expect(accountTypeIconMap[type]).toBeDefined();
        expect(accountTypeIconMap[type]).not.toBeNull();
      });
    });

    it("对于任意有效账户类型，accountTypeIconMap 应返回非空组件", () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_ACCOUNT_TYPES), (type) => {
          const icon = accountTypeIconMap[type];
          expect(icon).toBeDefined();
          expect(icon).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 图标选择优先级
   * 对于任意账户，如果账户有自定义图标则返回自定义图标，否则返回该账户类型的默认图标
   * Validates: Requirements 6.1, 6.2, 6.3
   */
  describe("Property 6: 图标选择优先级", () => {
    it("对于有自定义图标的账户，应返回自定义图标对应的组件", () => {
      fc.assert(
        fc.property(accountWithCustomIconArbitrary, (account) => {
          const icon = getAccountIcon(account);
          // 应该返回自定义图标对应的组件
          expect(icon).toBe(iconMap[account.icon!]);
        }),
        { numRuns: 100 }
      );
    });

    it("对于没有自定义图标的账户，应返回账户类型的默认图标", () => {
      fc.assert(
        fc.property(accountWithoutCustomIconArbitrary, (account) => {
          const icon = getAccountIcon(account);
          // 应该返回账户类型的默认图标
          expect(icon).toBe(accountTypeIconMap[account.type]);
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意账户，getAccountIcon 应始终返回有效的图标组件", () => {
      fc.assert(
        fc.property(accountArbitrary, (account) => {
          const icon = getAccountIcon(account);
          expect(icon).toBeDefined();
          expect(icon).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("边界情况测试", () => {
    it("账户 icon 为空字符串时应使用类型默认图标", () => {
      const account: Account = {
        id: 1,
        userId: 1,
        name: "测试账户",
        type: "cash",
        balance: 100,
        icon: "",
        createdAt: new Date().toISOString(),
      };
      const icon = getAccountIcon(account);
      expect(icon).toBe(accountTypeIconMap["cash"]);
    });

    it("账户 icon 为无效值时应使用类型默认图标", () => {
      const account: Account = {
        id: 1,
        userId: 1,
        name: "测试账户",
        type: "bank",
        balance: 100,
        icon: "invalid_icon_name",
        createdAt: new Date().toISOString(),
      };
      const icon = getAccountIcon(account);
      expect(icon).toBe(accountTypeIconMap["bank"]);
    });
  });
});
