/**
 * AccountCardSelector 属性测试
 * Feature: account-card-selector
 * Property 1: 账户卡片渲染完整性
 * Validates: Requirements 1.2
 */
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { mount } from "@vue/test-utils";
import AccountCardSelector from "../AccountCardSelector.vue";
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
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: fc.constantFrom(...ALL_ACCOUNT_TYPES),
  balance: fc.float({ min: -1000000, max: 1000000, noNaN: true }),
  icon: fc.constant(undefined),
  createdAt: fc
    .integer({ min: 1577836800000, max: 1893456000000 })
    .map((ts) => new Date(ts).toISOString()),
}) as fc.Arbitrary<Account>;

// 生成唯一 ID 的账户列表
const uniqueAccountsArbitrary = fc
  .array(accountArbitrary, { minLength: 1, maxLength: 10 })
  .map((accounts) => {
    const seen = new Set<number>();
    return accounts.filter((acc) => {
      if (seen.has(acc.id)) return false;
      seen.add(acc.id);
      return true;
    });
  })
  .filter((accounts) => accounts.length > 0);

describe("AccountCardSelector 属性测试", () => {
  /**
   * Property 1: 账户卡片渲染完整性
   * 对于任意账户数据，渲染后的卡片应包含账户名称和账户图标两个必要元素
   * Validates: Requirements 1.2
   */
  describe("Property 1: 账户卡片渲染完整性", () => {
    it("对于任意账户列表，每个账户卡片应包含名称和图标", async () => {
      await fc.assert(
        fc.asyncProperty(uniqueAccountsArbitrary, async (accounts) => {
          const wrapper = mount(AccountCardSelector, {
            props: {
              modelValue: null,
              accounts,
            },
            global: {
              stubs: {
                "el-icon": {
                  template: '<span class="el-icon"><slot /></span>',
                },
              },
            },
          });

          // 如果有展开按钮，点击展开以显示所有账户
          const expandBtn = wrapper.find(".expand-btn");
          if (expandBtn.exists()) {
            await expandBtn.trigger("click");
            await wrapper.vm.$nextTick();
          }

          const accountItems = wrapper.findAll(".account-item");

          // 验证渲染的账户数量正确
          expect(accountItems.length).toBe(accounts.length);

          // 验证每个卡片都包含图标和名称
          accountItems.forEach((item, index) => {
            // 检查图标存在
            const icon = item.find(".el-icon");
            expect(icon.exists()).toBe(true);

            // 检查名称元素存在
            const name = item.find(".account-name");
            expect(name.exists()).toBe(true);
            // 名称内容应该包含账户名（trim 后）
            expect(name.text().trim()).toBe(accounts[index].name.trim());
          });

          wrapper.unmount();
        }),
        { numRuns: 50 },
      );
    });

    it("空账户列表应显示提示信息", () => {
      const wrapper = mount(AccountCardSelector, {
        props: {
          modelValue: null,
          accounts: [],
        },
      });

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toContain("暂无账户");

      wrapper.unmount();
    });

    it("点击账户卡片应触发选中事件", () => {
      fc.assert(
        fc.property(uniqueAccountsArbitrary, (accounts) => {
          const wrapper = mount(AccountCardSelector, {
            props: {
              modelValue: null,
              accounts,
            },
            global: {
              stubs: {
                "el-icon": {
                  template: '<span class="el-icon"><slot /></span>',
                },
              },
            },
          });

          const accountItems = wrapper.findAll(".account-item");

          if (accountItems.length > 0) {
            // 点击第一个账户
            accountItems[0].trigger("click");

            // 验证触发了 update:modelValue 事件
            const emitted = wrapper.emitted("update:modelValue");
            expect(emitted).toBeTruthy();
            expect(emitted![0]).toEqual([accounts[0].id]);
          }

          wrapper.unmount();
        }),
        { numRuns: 50 },
      );
    });

    it("选中的账户应有 active 样式", () => {
      fc.assert(
        fc.property(uniqueAccountsArbitrary, (accounts) => {
          if (accounts.length === 0) return;

          const selectedId = accounts[0].id;

          const wrapper = mount(AccountCardSelector, {
            props: {
              modelValue: selectedId,
              accounts,
            },
            global: {
              stubs: {
                "el-icon": {
                  template: '<span class="el-icon"><slot /></span>',
                },
              },
            },
          });

          const accountItems = wrapper.findAll(".account-item");
          const activeItems = wrapper.findAll(".account-item.active");

          // 应该只有一个选中的账户
          expect(activeItems.length).toBe(1);

          // 第一个账户应该是选中状态
          expect(accountItems[0].classes()).toContain("active");

          wrapper.unmount();
        }),
        { numRuns: 50 },
      );
    });
  });
});
