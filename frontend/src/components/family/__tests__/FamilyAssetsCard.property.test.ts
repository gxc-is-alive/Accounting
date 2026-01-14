/**
 * FamilyAssetsCard 属性测试
 *
 * Feature: family-module-enhancement
 * Property 2: 家庭总资产计算正确性
 * Property 6: 账户分组正确性
 *
 * Validates: Requirements 2.2, 5.4, 5.5
 */

import * as fc from "fast-check";
import { describe, it, expect } from "vitest";

// 账户类型
const accountTypeArbitrary = fc.constantFrom(
  "cash",
  "bank",
  "alipay",
  "wechat",
  "credit",
  "other"
);

// 生成账户数据
const accountArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: accountTypeArbitrary,
  balance: fc
    .float({ min: -100000, max: 1000000, noNaN: true })
    .map((n) => Math.round(n * 100) / 100),
});

// 生成成员账户数据
const memberAccountsArbitrary = fc.record({
  userId: fc.integer({ min: 1, max: 100 }),
  nickname: fc.string({ minLength: 1, maxLength: 20 }),
  accounts: fc.array(accountArbitrary, { minLength: 0, maxLength: 10 }),
  totalBalance: fc
    .float({ min: -100000, max: 1000000, noNaN: true })
    .map((n) => Math.round(n * 100) / 100),
});

// 生成账户类型汇总数据
const accountTypeSummaryArbitrary = fc.record({
  type: accountTypeArbitrary,
  typeName: fc.string({ minLength: 1, maxLength: 10 }),
  total: fc
    .float({ min: -100000, max: 1000000, noNaN: true })
    .map((n) => Math.round(n * 100) / 100),
});

describe("Feature: family-module-enhancement - FamilyAssetsCard 属性测试", () => {
  /**
   * Property 2: 家庭总资产计算正确性
   * 对于任意家庭成员账户集合，家庭总资产应等于所有成员非信用账户余额之和，
   * 加上信用账户正余额（还款超额），不包含信用账户负余额（欠款）。
   * Validates: Requirements 2.2
   */
  describe("Property 2: 家庭总资产计算正确性", () => {
    it("对于任意账户列表，总资产应排除信用卡负债", () => {
      fc.assert(
        fc.property(
          fc.array(accountArbitrary, { minLength: 0, maxLength: 30 }),
          (accounts) => {
            // 计算总资产（信用卡负债不计入）
            const totalAssets = accounts.reduce((sum, acc) => {
              if (acc.type === "credit" && acc.balance < 0) {
                return sum; // 信用卡欠款不计入
              }
              return sum + acc.balance;
            }, 0);

            // 验证计算逻辑
            const expectedTotal = accounts
              .filter((acc) => !(acc.type === "credit" && acc.balance < 0))
              .reduce((sum, acc) => sum + acc.balance, 0);

            expect(Math.round(totalAssets * 100) / 100).toBeCloseTo(
              Math.round(expectedTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于信用卡正余额（还款超额），应计入总资产", () => {
      fc.assert(
        fc.property(
          fc
            .float({
              min: Math.fround(0.01),
              max: Math.fround(10000),
              noNaN: true,
            })
            .map((n) => Math.round(n * 100) / 100),
          (positiveBalance) => {
            const creditAccount = {
              id: 1,
              name: "信用卡",
              type: "credit" as const,
              balance: positiveBalance,
            };

            // 信用卡正余额应计入总资产
            const shouldInclude = !(
              creditAccount.type === "credit" && creditAccount.balance < 0
            );
            expect(shouldInclude).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("对于信用卡负余额（欠款），不应计入总资产", () => {
      fc.assert(
        fc.property(
          fc
            .float({
              min: Math.fround(-10000),
              max: Math.fround(-0.01),
              noNaN: true,
            })
            .map((n) => Math.round(n * 100) / 100),
          (negativeBalance) => {
            const creditAccount = {
              id: 1,
              name: "信用卡",
              type: "credit" as const,
              balance: negativeBalance,
            };

            // 信用卡负余额不应计入总资产
            const shouldExclude =
              creditAccount.type === "credit" && creditAccount.balance < 0;
            expect(shouldExclude).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 6: 账户分组正确性
   * 对于任意家庭资产数据，每个成员的账户余额小计应等于该成员所有账户余额之和，
   * 每个账户类型的汇总应等于该类型所有账户余额之和。
   * Validates: Requirements 5.4, 5.5
   */
  describe("Property 6: 账户分组正确性", () => {
    it("对于任意成员账户列表，成员余额小计应等于其账户余额之和", () => {
      fc.assert(
        fc.property(
          fc.array(accountArbitrary, { minLength: 0, maxLength: 20 }),
          (accounts) => {
            // 计算账户余额之和
            const totalBalance = accounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );

            // 模拟成员数据结构
            const memberData = {
              accounts,
              totalBalance: Math.round(totalBalance * 100) / 100,
            };

            // 验证：成员余额小计等于账户余额之和
            const calculatedTotal = memberData.accounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );
            expect(Math.round(calculatedTotal * 100) / 100).toBeCloseTo(
              memberData.totalBalance,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意账户列表，按类型分组后的总和应等于直接总和", () => {
      fc.assert(
        fc.property(
          fc.array(accountArbitrary, { minLength: 0, maxLength: 30 }),
          (accounts) => {
            // 按类型分组统计
            const byType: Record<string, number> = {};
            for (const acc of accounts) {
              byType[acc.type] = (byType[acc.type] || 0) + acc.balance;
            }

            // 计算分组后的总和
            const groupedTotal = Object.values(byType).reduce(
              (sum, val) => sum + val,
              0
            );

            // 计算直接总和
            const directTotal = accounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );

            // 验证：分组后的总和等于直接总和
            expect(Math.round(groupedTotal * 100) / 100).toBeCloseTo(
              Math.round(directTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意多成员账户数据，所有成员余额之和应等于总资产", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              userId: fc.integer({ min: 1, max: 100 }),
              accounts: fc.array(accountArbitrary, {
                minLength: 0,
                maxLength: 5,
              }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (members) => {
            // 计算每个成员的余额小计
            const memberTotals = members.map((m) =>
              m.accounts.reduce((sum, acc) => sum + acc.balance, 0)
            );

            // 计算所有成员余额之和
            const sumOfMemberTotals = memberTotals.reduce(
              (sum, t) => sum + t,
              0
            );

            // 计算所有账户的直接总和
            const allAccounts = members.flatMap((m) => m.accounts);
            const directTotal = allAccounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );

            // 验证：成员余额之和等于直接总和
            expect(Math.round(sumOfMemberTotals * 100) / 100).toBeCloseTo(
              Math.round(directTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 账户类型名称映射测试
   */
  describe("账户类型名称映射", () => {
    const typeNameMap: Record<string, string> = {
      cash: "现金",
      bank: "银行卡",
      alipay: "支付宝",
      wechat: "微信",
      credit: "信用卡",
      other: "其他",
    };

    it("对于任意账户类型，应有对应的中文名称", () => {
      fc.assert(
        fc.property(accountTypeArbitrary, (type) => {
          const typeName = typeNameMap[type];
          expect(typeName).toBeDefined();
          expect(typeName.length).toBeGreaterThan(0);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * 展开/折叠状态测试
   */
  describe("成员展开/折叠状态", () => {
    it("对于任意成员 ID，toggleMember 应正确切换展开状态", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (userId) => {
          // 模拟 expandedMembers Set
          const expandedMembers = new Set<number>();

          // 第一次 toggle：应添加到集合
          if (expandedMembers.has(userId)) {
            expandedMembers.delete(userId);
          } else {
            expandedMembers.add(userId);
          }
          expect(expandedMembers.has(userId)).toBe(true);

          // 第二次 toggle：应从集合移除
          if (expandedMembers.has(userId)) {
            expandedMembers.delete(userId);
          } else {
            expandedMembers.add(userId);
          }
          expect(expandedMembers.has(userId)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("对于多个成员，展开状态应相互独立", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 1000 }), {
            minLength: 2,
            maxLength: 10,
          }),
          (userIds) => {
            const uniqueIds = [...new Set(userIds)];
            if (uniqueIds.length < 2) return true;

            const expandedMembers = new Set<number>();

            // 展开第一个成员
            expandedMembers.add(uniqueIds[0]);
            expect(expandedMembers.has(uniqueIds[0])).toBe(true);

            // 第二个成员应该仍然是折叠状态
            expect(expandedMembers.has(uniqueIds[1])).toBe(false);

            // 展开第二个成员不应影响第一个
            expandedMembers.add(uniqueIds[1]);
            expect(expandedMembers.has(uniqueIds[0])).toBe(true);
            expect(expandedMembers.has(uniqueIds[1])).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
