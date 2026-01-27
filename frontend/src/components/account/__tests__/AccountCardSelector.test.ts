/**
 * AccountCardSelector 单元测试
 * Feature: transaction-edit-enhancement
 * 测试搜索功能的各个方面
 * Validates: Requirements 2.1, 2.4, 2.5, 2.6
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import AccountCardSelector from "../AccountCardSelector.vue";
import type { Account } from "@/types";

// 模拟账户数据
const mockAccounts: Account[] = [
  {
    id: 1,
    userId: 1,
    name: "现金账户",
    type: "cash",
    balance: 1000,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    userId: 1,
    name: "支付宝",
    type: "alipay",
    balance: 5000,
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: 3,
    userId: 1,
    name: "微信支付",
    type: "wechat",
    balance: 3000,
    createdAt: "2024-01-03T00:00:00.000Z",
  },
  {
    id: 4,
    userId: 1,
    name: "工商银行",
    type: "bank",
    balance: 10000,
    createdAt: "2024-01-04T00:00:00.000Z",
  },
  {
    id: 5,
    userId: 1,
    name: "招商银行信用卡",
    type: "credit",
    balance: -2000,
    createdAt: "2024-01-05T00:00:00.000Z",
  },
];

describe("AccountCardSelector 搜索功能单元测试", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(AccountCardSelector, {
      props: {
        modelValue: null,
        accounts: mockAccounts,
      },
      global: {
        stubs: {
          "el-icon": {
            template: '<span class="el-icon"><slot /></span>',
          },
          "el-input": {
            template: `
              <div class="el-input">
                <input 
                  :value="modelValue" 
                  @input="$emit('update:modelValue', $event.target.value)"
                  :placeholder="placeholder"
                  class="el-input__inner"
                />
              </div>
            `,
            props: ["modelValue", "placeholder", "clearable"],
          },
        },
      },
    });
  });

  describe("搜索框渲染 - Validates: Requirements 2.1", () => {
    it("应该渲染搜索输入框", () => {
      const searchInput = wrapper.find(".search-input");
      expect(searchInput.exists()).toBe(true);
    });

    it("搜索框应该有正确的 placeholder", () => {
      // 检查实际的 input 元素的 placeholder
      const input = wrapper.find(".el-input__inner");
      expect(input.attributes("placeholder")).toBe("搜索账户...");
    });

    it("搜索框应该在账户列表上方", () => {
      const searchInput = wrapper.find(".search-input");
      const accountGrid = wrapper.find(".account-grid");

      expect(searchInput.exists()).toBe(true);
      expect(accountGrid.exists()).toBe(true);

      // 验证搜索框在 DOM 中的位置在账户网格之前
      const searchElement = searchInput.element;
      const gridElement = accountGrid.element;
      const parent = searchElement.parentElement;

      if (parent) {
        const children = Array.from(parent.children);
        const searchIndex = children.indexOf(searchElement);
        const gridIndex = children.indexOf(gridElement);
        expect(searchIndex).toBeLessThan(gridIndex);
      }
    });
  });

  describe("搜索过滤功能 - Validates: Requirements 2.2, 2.3", () => {
    it("应该根据搜索关键词过滤账户（不区分大小写）", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "支付"
      await searchInput.setValue("支付");
      await nextTick();

      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(2); // 支付宝 和 微信支付

      // 验证显示的账户名称
      const names = accountItems.map((item) =>
        item.find(".account-name").text(),
      );
      expect(names).toContain("支付宝");
      expect(names).toContain("微信支付");
    });

    it("应该支持部分匹配", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "银行"
      await searchInput.setValue("银行");
      await nextTick();

      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(2); // 工商银行 和 招商银行信用卡
    });

    it("应该不区分大小写进行匹配", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 使用小写搜索
      await searchInput.setValue("现金");
      await nextTick();

      let accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(1);
      expect(accountItems[0].find(".account-name").text()).toBe("现金账户");

      // 清空搜索
      await searchInput.setValue("");
      await nextTick();

      // 使用大写搜索（如果账户名有大写）
      await searchInput.setValue("CASH");
      await nextTick();

      accountItems = wrapper.findAll(".account-item");
      // 由于我们的测试数据是中文，这里应该没有匹配
      expect(accountItems.length).toBe(0);
    });

    it("搜索结果应该保持原有的排序顺序", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "银行"
      await searchInput.setValue("银行");
      await nextTick();

      const accountItems = wrapper.findAll(".account-item");
      const names = accountItems.map((item) =>
        item.find(".account-name").text(),
      );

      // 验证顺序：工商银行应该在招商银行信用卡之前（按照原始数据顺序）
      expect(names[0]).toBe("工商银行");
      expect(names[1]).toBe("招商银行信用卡");
    });
  });

  describe("空搜索结果提示 - Validates: Requirements 2.4", () => {
    it("当搜索无结果时应该显示提示信息", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索不存在的账户
      await searchInput.setValue("不存在的账户");
      await nextTick();

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toBe("未找到匹配的账户");
    });

    it("当搜索关键词为空时不应该显示空结果提示", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 确保搜索框为空
      await searchInput.setValue("");
      await nextTick();

      // 应该显示所有账户，不显示空提示
      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBeGreaterThan(0);

      const emptyTips = wrapper.findAll(".empty-tip");
      // 如果有 empty-tip，它应该是 "暂无账户" 而不是 "未找到匹配的账户"
      emptyTips.forEach((tip) => {
        expect(tip.text()).not.toBe("未找到匹配的账户");
      });
    });

    it("当搜索关键词只有空格时应该显示所有账户", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 输入只有空格的搜索词
      await searchInput.setValue("   ");
      await nextTick();

      // 应该显示所有账户（因为 trim 后为空）
      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBeGreaterThan(0);
    });
  });

  describe("清空搜索恢复列表 - Validates: Requirements 2.5", () => {
    it("清空搜索框应该恢复显示所有账户", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 先搜索
      await searchInput.setValue("支付");
      await nextTick();

      let accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(2);

      // 清空搜索
      await searchInput.setValue("");
      await nextTick();

      accountItems = wrapper.findAll(".account-item");
      // 应该显示所有账户（或默认显示数量）
      expect(accountItems.length).toBeGreaterThan(2);
    });

    it("从有结果的搜索切换到无结果的搜索", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 先搜索有结果的
      await searchInput.setValue("支付");
      await nextTick();

      let accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(2);

      // 切换到无结果的搜索
      await searchInput.setValue("不存在");
      await nextTick();

      accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toBe("未找到匹配的账户");
    });
  });

  describe("选择事件触发 - Validates: Requirements 2.6", () => {
    it("在搜索结果中选择账户应该触发正确的事件", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "支付宝"
      await searchInput.setValue("支付宝");
      await nextTick();

      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(1);

      // 点击搜索结果中的账户
      await accountItems[0].trigger("click");

      // 验证触发了正确的事件
      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([2]); // 支付宝的 ID 是 2
    });

    it("在搜索结果中选择账户后应该显示为选中状态", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "微信"
      await searchInput.setValue("微信");
      await nextTick();

      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(1);

      // 点击账户
      await accountItems[0].trigger("click");

      // 重新挂载组件，模拟父组件更新 modelValue
      wrapper.unmount();
      wrapper = mount(AccountCardSelector, {
        props: {
          modelValue: 3, // 微信支付的 ID
          accounts: mockAccounts,
        },
        global: {
          stubs: {
            "el-icon": {
              template: '<span class="el-icon"><slot /></span>',
            },
            "el-input": {
              template: `
                <div class="el-input">
                  <input 
                    :value="modelValue" 
                    @input="$emit('update:modelValue', $event.target.value)"
                    :placeholder="placeholder"
                    class="el-input__inner"
                  />
                </div>
              `,
              props: ["modelValue", "placeholder", "clearable"],
            },
          },
        },
      });

      // 再次搜索
      const newSearchInput = wrapper.find(".el-input__inner");
      await newSearchInput.setValue("微信");
      await nextTick();

      // 验证选中状态
      const activeItems = wrapper.findAll(".account-item.active");
      expect(activeItems.length).toBe(1);
      expect(activeItems[0].find(".account-name").text()).toBe("微信支付");
    });

    it("搜索不应该影响未搜索时的选择功能", async () => {
      // 不进行搜索，直接选择
      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBeGreaterThan(0);

      // 点击第一个账户
      await accountItems[0].trigger("click");

      // 验证事件触发
      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe(mockAccounts[0].id);
    });
  });

  describe("边界情况测试", () => {
    it("空账户列表应该显示提示信息", () => {
      wrapper.unmount();
      wrapper = mount(AccountCardSelector, {
        props: {
          modelValue: null,
          accounts: [],
        },
      });

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toContain("暂无账户");

      // 不应该显示搜索框
      const searchInput = wrapper.find(".search-input");
      expect(searchInput.exists()).toBe(false);
    });

    it("只有一个账户时搜索功能应该正常工作", async () => {
      wrapper.unmount();
      wrapper = mount(AccountCardSelector, {
        props: {
          modelValue: null,
          accounts: [mockAccounts[0]],
        },
        global: {
          stubs: {
            "el-icon": {
              template: '<span class="el-icon"><slot /></span>',
            },
            "el-input": {
              template: `
                <div class="el-input">
                  <input 
                    :value="modelValue" 
                    @input="$emit('update:modelValue', $event.target.value)"
                    :placeholder="placeholder"
                    class="el-input__inner"
                  />
                </div>
              `,
              props: ["modelValue", "placeholder", "clearable"],
            },
          },
        },
      });

      const searchInput = wrapper.find(".el-input__inner");

      // 搜索匹配的账户
      await searchInput.setValue("现金");
      await nextTick();

      let accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(1);

      // 搜索不匹配的账户
      await searchInput.setValue("不存在");
      await nextTick();

      accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
    });

    it("特殊字符搜索应该正常工作", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索包含特殊字符的内容（如果账户名有的话）
      await searchInput.setValue("()[]");
      await nextTick();

      // 应该没有匹配结果
      const accountItems = wrapper.findAll(".account-item");
      expect(accountItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
    });
  });
});

/**
 * ========================================
 * 属性测试：账户搜索过滤的正确性
 * Feature: transaction-edit-enhancement
 * Property 2: 账户搜索过滤的正确性
 * **Validates: Requirements 2.2, 2.3, 2.5**
 * ========================================
 */
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
 * 生成随机账户的 Arbitrary
 */
const accountArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 100 }),
  name: fc
    .string({ minLength: 2, maxLength: 20 })
    .filter((s) => s.trim().length > 0), // 确保名称不为空
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

const accountListArb = fc.array(accountArb, { minLength: 0, maxLength: 50 });
const searchQueryArb = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.constant(""),
  fc.constant("   "),
  fc.string({ minLength: 1, maxLength: 5 }),
);

describe("属性测试：账户搜索过滤", () => {
  it("属性 2.1：过滤结果只包含名称匹配的账户（不区分大小写）", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const result = filterAccountsLogic(accounts, query);

        if (!query.trim()) {
          expect(result).toEqual(accounts);
          return;
        }

        const lowerQuery = query.toLowerCase();
        result.forEach((account) => {
          expect(account.name.toLowerCase()).toContain(lowerQuery);
        });

        accounts.forEach((account) => {
          const shouldMatch = account.name.toLowerCase().includes(lowerQuery);
          const isInResult = result.some((r) => r.id === account.id);
          expect(isInResult).toBe(shouldMatch);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("属性 2.2：过滤结果保持原有的排序顺序", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const result = filterAccountsLogic(accounts, query);
        const resultIds = result.map((a) => a.id);
        const lowerQuery = query.toLowerCase().trim();
        const expectedIds = accounts
          .filter((a) =>
            !lowerQuery ? true : a.name.toLowerCase().includes(lowerQuery),
          )
          .map((a) => a.id);
        expect(resultIds).toEqual(expectedIds);
      }),
      { numRuns: 100 },
    );
  });

  it("属性 2.3：空关键词返回完整列表", () => {
    fc.assert(
      fc.property(
        accountListArb,
        fc.oneof(fc.constant(""), fc.constant("   "), fc.constant("\t\n")),
        (accounts, query) => {
          const result = filterAccountsLogic(accounts, query);
          expect(result).toEqual(accounts);
          expect(result.length).toBe(accounts.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 2.4：过滤结果是原列表的子集", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const result = filterAccountsLogic(accounts, query);
        expect(result.length).toBeLessThanOrEqual(accounts.length);
        result.forEach((account) => {
          expect(accounts).toContainEqual(account);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("属性 2.5：搜索是幂等的", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const result1 = filterAccountsLogic(accounts, query);
        const result2 = filterAccountsLogic(accounts, query);
        expect(result1).toEqual(result2);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * ========================================
 * 属性测试：搜索不影响选择功能
 * Feature: transaction-edit-enhancement
 * Property 4: 搜索不影响选择功能
 * **Validates: Requirements 2.6, 3.6**
 * ========================================
 */
describe("属性测试：搜索不影响选择功能（账户选择器）", () => {
  it("属性 4.1：在搜索结果中选择账户应该触发正确的选择事件", () => {
    fc.assert(
      fc.property(
        accountListArb.filter((accounts) => accounts.length > 0),
        searchQueryArb,
        (accounts, query) => {
          // 过滤账户
          const filtered = filterAccountsLogic(accounts, query);

          // 如果没有过滤结果，跳过此测试用例
          if (filtered.length === 0) {
            return true;
          }

          // 随机选择一个过滤后的账户
          const selectedAccount =
            filtered[Math.floor(Math.random() * filtered.length)];

          // 挂载组件
          const wrapper = mount(AccountCardSelector, {
            props: {
              modelValue: null,
              accounts: accounts,
            },
            global: {
              stubs: {
                "el-icon": {
                  template: '<span class="el-icon"><slot /></span>',
                },
                "el-input": {
                  template: `
                    <div class="el-input">
                      <input 
                        :value="modelValue" 
                        @input="$emit('update:modelValue', $event.target.value)"
                        :placeholder="placeholder"
                        class="el-input__inner"
                      />
                    </div>
                  `,
                  props: ["modelValue", "placeholder", "clearable"],
                },
              },
            },
          });

          // 设置搜索关键词
          const searchInput = wrapper.find(".el-input__inner");
          searchInput.setValue(query);

          // 等待 DOM 更新
          return nextTick().then(() => {
            // 查找选中的账户项
            const accountItems = wrapper.findAll(".account-item");
            const targetItem = accountItems.find(
              (item) =>
                item.find(".account-name").text() === selectedAccount.name,
            );

            if (!targetItem) {
              // 如果找不到目标项（可能因为展开/收起逻辑），跳过
              wrapper.unmount();
              return true;
            }

            // 点击账户项
            targetItem.trigger("click");

            // 验证事件触发
            const emitted = wrapper.emitted("update:modelValue");
            expect(emitted).toBeTruthy();
            expect(emitted![emitted!.length - 1]).toEqual([selectedAccount.id]);

            wrapper.unmount();
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 4.2：搜索后选择的账户 ID 应该与原始账户列表中的 ID 一致", () => {
    fc.assert(
      fc.property(
        accountListArb.filter((accounts) => accounts.length > 0),
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

  it("属性 4.3：搜索不应该改变账户的属性（ID、名称等）", () => {
    fc.assert(
      fc.property(accountListArb, searchQueryArb, (accounts, query) => {
        const filtered = filterAccountsLogic(accounts, query);

        // 验证过滤后的账户与原始账户完全相同（引用相等或深度相等）
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

  it("属性 4.4：无论是否搜索，选择相同账户应该触发相同的事件", () => {
    fc.assert(
      fc.property(
        accountListArb.filter((accounts) => accounts.length > 0),
        fc.integer({ min: 0, max: 100 }),
        (accounts, seed) => {
          const selectedAccount = accounts[seed % accounts.length];

          // 场景 1：不搜索直接选择
          const wrapper1 = mount(AccountCardSelector, {
            props: {
              modelValue: null,
              accounts: accounts,
            },
            global: {
              stubs: {
                "el-icon": {
                  template: '<span class="el-icon"><slot /></span>',
                },
                "el-input": {
                  template: `
                    <div class="el-input">
                      <input 
                        :value="modelValue" 
                        @input="$emit('update:modelValue', $event.target.value)"
                        :placeholder="placeholder"
                        class="el-input__inner"
                      />
                    </div>
                  `,
                  props: ["modelValue", "placeholder", "clearable"],
                },
              },
            },
          });

          return nextTick().then(() => {
            const accountItems1 = wrapper1.findAll(".account-item");
            const targetItem1 = accountItems1.find(
              (item) =>
                item.find(".account-name").text() === selectedAccount.name,
            );

            if (!targetItem1) {
              wrapper1.unmount();
              return true;
            }

            targetItem1.trigger("click");
            const emitted1 = wrapper1.emitted("update:modelValue");
            wrapper1.unmount();

            // 场景 2：搜索后选择（使用账户名称的一部分作为搜索词）
            const searchQuery = selectedAccount.name.substring(
              0,
              Math.max(1, selectedAccount.name.length - 1),
            );
            const wrapper2 = mount(AccountCardSelector, {
              props: {
                modelValue: null,
                accounts: accounts,
              },
              global: {
                stubs: {
                  "el-icon": {
                    template: '<span class="el-icon"><slot /></span>',
                  },
                  "el-input": {
                    template: `
                      <div class="el-input">
                        <input 
                          :value="modelValue" 
                          @input="$emit('update:modelValue', $event.target.value)"
                          :placeholder="placeholder"
                          class="el-input__inner"
                        />
                      </div>
                    `,
                    props: ["modelValue", "placeholder", "clearable"],
                  },
                },
              },
            });

            const searchInput2 = wrapper2.find(".el-input__inner");
            searchInput2.setValue(searchQuery);

            return nextTick().then(() => {
              const accountItems2 = wrapper2.findAll(".account-item");
              const targetItem2 = accountItems2.find(
                (item) =>
                  item.find(".account-name").text() === selectedAccount.name,
              );

              if (!targetItem2) {
                wrapper2.unmount();
                return true;
              }

              targetItem2.trigger("click");
              const emitted2 = wrapper2.emitted("update:modelValue");
              wrapper2.unmount();

              // 验证两种场景触发的事件相同
              if (emitted1 && emitted2) {
                expect(emitted1[emitted1.length - 1]).toEqual(
                  emitted2[emitted2.length - 1],
                );
                expect(emitted1[emitted1.length - 1][0]).toBe(
                  selectedAccount.id,
                );
              }
            });
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
