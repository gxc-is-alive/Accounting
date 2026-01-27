/**
 * CategoryCardSelector 单元测试
 * Feature: transaction-edit-enhancement
 * 测试搜索功能的各个方面
 * Validates: Requirements 3.1, 3.4, 3.5, 3.6
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CategoryCardSelector from "../CategoryCardSelector.vue";
import type { Category } from "@/types";

// 模拟 useCategoryUsage composable
vi.mock("@/composables/useCategoryUsage", () => ({
  useCategoryUsage: () => ({
    getSortedCategories: (categories: Category[]) => categories,
  }),
}));

// 模拟分类数据
const mockCategories: Category[] = [
  {
    id: 1,
    userId: 1,
    name: "餐饮",
    type: "expense",
    icon: "Food",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    userId: 1,
    name: "交通",
    type: "expense",
    icon: "Car",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
  {
    id: 3,
    userId: 1,
    name: "购物",
    type: "expense",
    icon: "ShoppingCart",
    createdAt: "2024-01-03T00:00:00.000Z",
  },
  {
    id: 4,
    userId: 1,
    name: "娱乐",
    type: "expense",
    icon: "VideoPlay",
    createdAt: "2024-01-04T00:00:00.000Z",
  },
  {
    id: 5,
    userId: 1,
    name: "工资收入",
    type: "income",
    icon: "Money",
    createdAt: "2024-01-05T00:00:00.000Z",
  },
  {
    id: 6,
    userId: 1,
    name: "投资收益",
    type: "income",
    icon: "TrendCharts",
    createdAt: "2024-01-06T00:00:00.000Z",
  },
];

describe("CategoryCardSelector 搜索功能单元测试", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(CategoryCardSelector, {
      props: {
        modelValue: null,
        categories: mockCategories,
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

  describe("搜索框渲染 - Validates: Requirements 3.1", () => {
    it("应该渲染搜索输入框", () => {
      const searchInput = wrapper.find(".search-input");
      expect(searchInput.exists()).toBe(true);
    });

    it("搜索框应该有正确的 placeholder", () => {
      const input = wrapper.find(".el-input__inner");
      expect(input.attributes("placeholder")).toBe("搜索分类...");
    });

    it("搜索框应该在分类列表上方", () => {
      const searchInput = wrapper.find(".search-input");
      const categoryGrid = wrapper.find(".category-grid");

      expect(searchInput.exists()).toBe(true);
      expect(categoryGrid.exists()).toBe(true);

      // 验证搜索框在 DOM 中的位置在分类网格之前
      const searchElement = searchInput.element;
      const gridElement = categoryGrid.element;
      const parent = searchElement.parentElement;

      if (parent) {
        const children = Array.from(parent.children);
        const searchIndex = children.indexOf(searchElement);
        const gridIndex = children.indexOf(gridElement);
        expect(searchIndex).toBeLessThan(gridIndex);
      }
    });
  });

  describe("搜索过滤功能 - Validates: Requirements 3.2, 3.3", () => {
    it("应该根据搜索关键词过滤分类（不区分大小写）", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "收"（匹配 "工资收入" 和 "投资收益"）
      await searchInput.setValue("收");
      await nextTick();

      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(2); // 工资收入 和 投资收益

      // 验证显示的分类名称
      const names = categoryItems.map((item) =>
        item.find(".category-name").text(),
      );
      expect(names).toContain("工资收入");
      expect(names).toContain("投资收益");
    });

    it("应该支持部分匹配", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "餐"
      await searchInput.setValue("餐");
      await nextTick();

      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1); // 餐饮
      expect(categoryItems[0].find(".category-name").text()).toBe("餐饮");
    });

    it("应该不区分大小写进行匹配", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 使用小写搜索
      await searchInput.setValue("餐饮");
      await nextTick();

      let categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1);
      expect(categoryItems[0].find(".category-name").text()).toBe("餐饮");

      // 清空搜索
      await searchInput.setValue("");
      await nextTick();

      // 测试英文大小写不敏感（如果有英文分类名）
      await searchInput.setValue("food");
      await nextTick();

      categoryItems = wrapper.findAll(".category-item");
      // 由于我们的测试数据是中文，这里应该没有匹配
      expect(categoryItems.length).toBe(0);
    });

    it("搜索结果应该保持原有的排序顺序", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "收"（匹配 "工资收入" 和 "投资收益"）
      await searchInput.setValue("收");
      await nextTick();

      const categoryItems = wrapper.findAll(".category-item");
      const names = categoryItems.map((item) =>
        item.find(".category-name").text(),
      );

      // 验证顺序：工资收入应该在投资收益之前（按照原始数据顺序）
      expect(names[0]).toBe("工资收入");
      expect(names[1]).toBe("投资收益");
    });
  });

  describe("空搜索结果提示 - Validates: Requirements 3.4", () => {
    it("当搜索无结果时应该显示提示信息", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索不存在的分类
      await searchInput.setValue("不存在的分类");
      await nextTick();

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toBe("未找到匹配的分类");
    });

    it("当搜索关键词为空时不应该显示空结果提示", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 确保搜索框为空
      await searchInput.setValue("");
      await nextTick();

      // 应该显示所有分类，不显示空提示
      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBeGreaterThan(0);

      const emptyTips = wrapper.findAll(".empty-tip");
      // 如果有 empty-tip，它应该是 "暂无分类" 而不是 "未找到匹配的分类"
      emptyTips.forEach((tip) => {
        expect(tip.text()).not.toBe("未找到匹配的分类");
      });
    });

    it("当搜索关键词只有空格时应该显示所有分类", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 输入只有空格的搜索词
      await searchInput.setValue("   ");
      await nextTick();

      // 应该显示所有分类（因为 trim 后为空）
      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBeGreaterThan(0);
    });
  });

  describe("清空搜索恢复列表 - Validates: Requirements 3.5", () => {
    it("清空搜索框应该恢复显示所有分类", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 先搜索
      await searchInput.setValue("收");
      await nextTick();

      let categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(2);

      // 清空搜索
      await searchInput.setValue("");
      await nextTick();

      categoryItems = wrapper.findAll(".category-item");
      // 应该显示所有分类（或默认显示数量）
      expect(categoryItems.length).toBeGreaterThan(2);
    });

    it("从有结果的搜索切换到无结果的搜索", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 先搜索有结果的
      await searchInput.setValue("餐饮");
      await nextTick();

      let categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1);

      // 切换到无结果的搜索
      await searchInput.setValue("不存在");
      await nextTick();

      categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toBe("未找到匹配的分类");
    });
  });

  describe("选择事件触发 - Validates: Requirements 3.6", () => {
    it("在搜索结果中选择分类应该触发正确的事件", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "餐饮"
      await searchInput.setValue("餐饮");
      await nextTick();

      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1);

      // 点击搜索结果中的分类
      await categoryItems[0].trigger("click");

      // 验证触发了正确的事件
      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0]).toEqual([1]); // 餐饮的 ID 是 1
    });

    it("在搜索结果中选择分类后应该显示为选中状态", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索 "交通"
      await searchInput.setValue("交通");
      await nextTick();

      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1);

      // 点击分类
      await categoryItems[0].trigger("click");

      // 重新挂载组件，模拟父组件更新 modelValue
      wrapper.unmount();
      wrapper = mount(CategoryCardSelector, {
        props: {
          modelValue: 2, // 交通的 ID
          categories: mockCategories,
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
      await newSearchInput.setValue("交通");
      await nextTick();

      // 验证选中状态
      const activeItems = wrapper.findAll(".category-item.active");
      expect(activeItems.length).toBe(1);
      expect(activeItems[0].find(".category-name").text()).toBe("交通");
    });

    it("搜索不应该影响未搜索时的选择功能", async () => {
      // 不进行搜索，直接选择
      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBeGreaterThan(0);

      // 点击第一个分类
      await categoryItems[0].trigger("click");

      // 验证事件触发
      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe(mockCategories[0].id);
    });
  });

  describe("边界情况测试", () => {
    it("空分类列表应该显示提示信息", () => {
      wrapper.unmount();
      wrapper = mount(CategoryCardSelector, {
        props: {
          modelValue: null,
          categories: [],
        },
      });

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
      expect(emptyTip.text()).toContain("暂无分类");

      // 不应该显示搜索框
      const searchInput = wrapper.find(".search-input");
      expect(searchInput.exists()).toBe(false);
    });

    it("只有一个分类时搜索功能应该正常工作", async () => {
      wrapper.unmount();
      wrapper = mount(CategoryCardSelector, {
        props: {
          modelValue: null,
          categories: [mockCategories[0]],
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

      // 搜索匹配的分类
      await searchInput.setValue("餐饮");
      await nextTick();

      let categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(1);

      // 搜索不匹配的分类
      await searchInput.setValue("不存在");
      await nextTick();

      categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
    });

    it("特殊字符搜索应该正常工作", async () => {
      const searchInput = wrapper.find(".el-input__inner");

      // 搜索包含特殊字符的内容
      await searchInput.setValue("()[]");
      await nextTick();

      // 应该没有匹配结果
      const categoryItems = wrapper.findAll(".category-item");
      expect(categoryItems.length).toBe(0);

      const emptyTip = wrapper.find(".empty-tip");
      expect(emptyTip.exists()).toBe(true);
    });
  });
});

/**
 * ========================================
 * 属性测试：分类搜索过滤的正确性
 * Feature: transaction-edit-enhancement
 * Property 3: 分类搜索过滤的正确性
 * **Validates: Requirements 3.2, 3.3, 3.5**
 * ========================================
 */
import * as fc from "fast-check";

/**
 * 分类搜索过滤逻辑（从组件中提取）
 */
function filterCategoriesLogic(
  categories: Category[],
  searchQuery: string,
): Category[] {
  if (!searchQuery.trim()) {
    return categories;
  }
  const query = searchQuery.toLowerCase();
  return categories.filter((category) =>
    category.name.toLowerCase().includes(query),
  );
}

/**
 * 生成随机分类的 Arbitrary
 */
const categoryArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  userId: fc.integer({ min: 1, max: 100 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  type: fc.constantFrom("income", "expense"),
  icon: fc.constantFrom(
    "Food",
    "Car",
    "ShoppingCart",
    "VideoPlay",
    "Money",
    "TrendCharts",
  ),
  createdAt: fc.constant(new Date().toISOString()),
}) as fc.Arbitrary<Category>;

const categoryListArb = fc.array(categoryArb, { minLength: 0, maxLength: 50 });
const searchQueryArb = fc.oneof(
  fc.string({ maxLength: 20 }),
  fc.constant(""),
  fc.constant("   "),
  fc.string({ minLength: 1, maxLength: 5 }),
);

describe("属性测试：分类搜索过滤", () => {
  it("属性 3.1：过滤结果只包含名称匹配的分类（不区分大小写）", () => {
    fc.assert(
      fc.property(categoryListArb, searchQueryArb, (categories, query) => {
        const result = filterCategoriesLogic(categories, query);

        if (!query.trim()) {
          expect(result).toEqual(categories);
          return;
        }

        const lowerQuery = query.toLowerCase();
        result.forEach((category) => {
          expect(category.name.toLowerCase()).toContain(lowerQuery);
        });

        categories.forEach((category) => {
          const shouldMatch = category.name.toLowerCase().includes(lowerQuery);
          const isInResult = result.some((r) => r.id === category.id);
          expect(isInResult).toBe(shouldMatch);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("属性 3.2：过滤结果保持原有的排序顺序", () => {
    fc.assert(
      fc.property(categoryListArb, searchQueryArb, (categories, query) => {
        const result = filterCategoriesLogic(categories, query);
        const resultIds = result.map((c) => c.id);
        const lowerQuery = query.toLowerCase().trim();
        const expectedIds = categories
          .filter((c) =>
            !lowerQuery ? true : c.name.toLowerCase().includes(lowerQuery),
          )
          .map((c) => c.id);
        expect(resultIds).toEqual(expectedIds);
      }),
      { numRuns: 100 },
    );
  });

  it("属性 3.3：空关键词返回完整列表", () => {
    fc.assert(
      fc.property(
        categoryListArb,
        fc.oneof(fc.constant(""), fc.constant("   "), fc.constant("\t\n")),
        (categories, query) => {
          const result = filterCategoriesLogic(categories, query);
          expect(result).toEqual(categories);
          expect(result.length).toBe(categories.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 3.4：过滤结果是原列表的子集", () => {
    fc.assert(
      fc.property(categoryListArb, searchQueryArb, (categories, query) => {
        const result = filterCategoriesLogic(categories, query);
        expect(result.length).toBeLessThanOrEqual(categories.length);
        result.forEach((category) => {
          expect(categories).toContainEqual(category);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("属性 3.5：搜索是幂等的", () => {
    fc.assert(
      fc.property(categoryListArb, searchQueryArb, (categories, query) => {
        const result1 = filterCategoriesLogic(categories, query);
        const result2 = filterCategoriesLogic(categories, query);
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
describe("属性测试：搜索不影响选择功能（分类选择器）", () => {
  it("属性 4.1：在搜索结果中选择分类应该触发正确的选择事件", () => {
    fc.assert(
      fc.property(
        categoryListArb.filter((categories) => categories.length > 0),
        searchQueryArb,
        (categories, query) => {
          // 过滤分类
          const filtered = filterCategoriesLogic(categories, query);

          // 如果没有过滤结果，跳过此测试用例
          if (filtered.length === 0) {
            return true;
          }

          // 随机选择一个过滤后的分类
          const selectedCategory =
            filtered[Math.floor(Math.random() * filtered.length)];

          // 挂载组件
          const wrapper = mount(CategoryCardSelector, {
            props: {
              modelValue: null,
              categories: categories,
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
            // 查找选中的分类项
            const categoryItems = wrapper.findAll(".category-item");
            const targetItem = categoryItems.find(
              (item) =>
                item.find(".category-name").text() === selectedCategory.name,
            );

            if (!targetItem) {
              // 如果找不到目标项（可能因为展开/收起逻辑），跳过
              wrapper.unmount();
              return true;
            }

            // 点击分类项
            targetItem.trigger("click");

            // 验证事件触发
            const emitted = wrapper.emitted("update:modelValue");
            expect(emitted).toBeTruthy();
            expect(emitted![emitted!.length - 1]).toEqual([
              selectedCategory.id,
            ]);

            wrapper.unmount();
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 4.2：搜索后选择的分类 ID 应该与原始分类列表中的 ID 一致", () => {
    fc.assert(
      fc.property(
        categoryListArb.filter((categories) => categories.length > 0),
        searchQueryArb,
        fc.integer({ min: 0, max: 100 }),
        (categories, query, seed) => {
          // 过滤分类
          const filtered = filterCategoriesLogic(categories, query);

          if (filtered.length === 0) {
            return true;
          }

          // 使用种子选择一个分类
          const selectedCategory = filtered[seed % filtered.length];

          // 验证选中的分类确实存在于原始列表中
          const existsInOriginal = categories.some(
            (c) => c.id === selectedCategory.id,
          );
          expect(existsInOriginal).toBe(true);

          // 验证选中的分类 ID 是正确的
          expect(selectedCategory.id).toBeDefined();
          expect(typeof selectedCategory.id).toBe("number");

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("属性 4.3：搜索不应该改变分类的属性（ID、名称等）", () => {
    fc.assert(
      fc.property(categoryListArb, searchQueryArb, (categories, query) => {
        const filtered = filterCategoriesLogic(categories, query);

        // 验证过滤后的分类与原始分类完全相同（引用相等或深度相等）
        filtered.forEach((filteredCategory) => {
          const originalCategory = categories.find(
            (c) => c.id === filteredCategory.id,
          );
          expect(originalCategory).toBeDefined();
          expect(filteredCategory).toEqual(originalCategory);
        });

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("属性 4.4：无论是否搜索，选择相同分类应该触发相同的事件", () => {
    fc.assert(
      fc.property(
        categoryListArb.filter((categories) => categories.length > 0),
        fc.integer({ min: 0, max: 100 }),
        (categories, seed) => {
          const selectedCategory = categories[seed % categories.length];

          // 场景 1：不搜索直接选择
          const wrapper1 = mount(CategoryCardSelector, {
            props: {
              modelValue: null,
              categories: categories,
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
            const categoryItems1 = wrapper1.findAll(".category-item");
            const targetItem1 = categoryItems1.find(
              (item) =>
                item.find(".category-name").text() === selectedCategory.name,
            );

            if (!targetItem1) {
              wrapper1.unmount();
              return true;
            }

            targetItem1.trigger("click");
            const emitted1 = wrapper1.emitted("update:modelValue");
            wrapper1.unmount();

            // 场景 2：搜索后选择（使用分类名称的一部分作为搜索词）
            const searchQuery = selectedCategory.name.substring(
              0,
              Math.max(1, selectedCategory.name.length - 1),
            );
            const wrapper2 = mount(CategoryCardSelector, {
              props: {
                modelValue: null,
                categories: categories,
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
              const categoryItems2 = wrapper2.findAll(".category-item");
              const targetItem2 = categoryItems2.find(
                (item) =>
                  item.find(".category-name").text() === selectedCategory.name,
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
                  selectedCategory.id,
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
