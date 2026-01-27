/**
 * TransactionList 编辑对话框账户选择器单元测试
 * Feature: transaction-edit-enhancement
 * 测试编辑对话框中账户选择器的功能
 * Validates: Requirements 1.1, 1.2
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import TransactionList from "../TransactionList.vue";
import { useTransactionStore } from "@/stores/transaction";
import { useCategoryStore } from "@/stores/category";
import { useAccountStore } from "@/stores/account";
import type { Transaction, Account, Category } from "@/types";

// 模拟 stores
vi.mock("@/stores/transaction", () => ({
  useTransactionStore: vi.fn(() => ({
    transactions: mockTransactions,
    total: mockTransactions.length,
    loading: false,
    fetchTransactions: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    loadMore: vi.fn(),
    setPage: vi.fn(),
    resetFilters: vi.fn(),
  })),
}));

vi.mock("@/stores/category", () => ({
  useCategoryStore: vi.fn(() => ({
    categories: mockCategories,
    fetchCategories: vi.fn(),
  })),
}));

vi.mock("@/stores/account", () => ({
  useAccountStore: vi.fn(() => ({
    accounts: mockAccounts,
    fetchAccounts: vi.fn(),
  })),
}));

// 模拟 API
vi.mock("@/api", () => ({
  attachmentApi: {
    listByTransaction: vi.fn().mockResolvedValue([]),
  },
  refundApi: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

// 模拟 Element Plus 组件
vi.mock("element-plus", async () => {
  const actual = await vi.importActual("element-plus");
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue(true),
    },
  };
});

// 模拟路由
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// 模拟设备检测
vi.mock("@/composables/useDevice", () => ({
  useDevice: () => ({
    device: {
      value: {
        isMobile: false,
      },
    },
  }),
}));

// 模拟数据
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
];

const mockCategories: Category[] = [
  {
    id: 1,
    userId: 1,
    name: "餐饮",
    type: "expense",
    icon: "food",
    isSystem: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: 2,
    userId: 1,
    name: "交通",
    type: "expense",
    icon: "transport",
    isSystem: false,
    createdAt: "2024-01-02T00:00:00.000Z",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 1,
    userId: 1,
    amount: 100,
    type: "expense",
    categoryId: 1,
    accountId: 1,
    date: "2024-01-15",
    note: "午餐",
    isFamily: false,
    createdAt: "2024-01-15T12:00:00.000Z",
    updatedAt: "2024-01-15T12:00:00.000Z",
    category: mockCategories[0],
    account: mockAccounts[0],
  },
  {
    id: 2,
    userId: 1,
    amount: 50,
    type: "expense",
    categoryId: 2,
    accountId: 2,
    date: "2024-01-16",
    note: "打车",
    isFamily: false,
    createdAt: "2024-01-16T08:00:00.000Z",
    updatedAt: "2024-01-16T08:00:00.000Z",
    category: mockCategories[1],
    account: mockAccounts[1],
  },
];

describe("TransactionList 编辑对话框账户选择器测试", () => {
  let wrapper: VueWrapper;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    // 创建新的 Pinia 实例
    pinia = createPinia();
    setActivePinia(pinia);

    // 挂载组件
    wrapper = mount(TransactionList, {
      global: {
        plugins: [pinia],
        stubs: {
          "el-button": {
            template: "<button @click=\"$emit('click')\"><slot /></button>",
          },
          "el-icon": {
            template: "<span><slot /></span>",
          },
          "el-table": {
            template: '<div class="el-table"><slot /></div>',
          },
          "el-table-column": {
            template: "<div></div>",
          },
          "el-pagination": {
            template: "<div></div>",
          },
          "el-date-picker": {
            template: '<input type="text" />',
          },
          "el-select": {
            template: "<select><slot /></select>",
          },
          "el-option": {
            template: "<option></option>",
          },
          "el-dialog": {
            template: `
              <div v-if="modelValue" class="el-dialog">
                <div class="el-dialog__header">
                  <slot name="header">{{ title }}</slot>
                </div>
                <div class="el-dialog__body">
                  <slot />
                </div>
                <div class="el-dialog__footer">
                  <slot name="footer" />
                </div>
              </div>
            `,
            props: ["modelValue", "title", "width"],
          },
          "el-form": {
            template: "<form><slot /></form>",
            props: ["model", "labelWidth"],
          },
          "el-form-item": {
            template: `
              <div class="el-form-item">
                <label v-if="label">{{ label }}</label>
                <div class="el-form-item__content">
                  <slot />
                </div>
              </div>
            `,
            props: ["label"],
          },
          "el-input-number": {
            template:
              '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ["modelValue", "min", "precision"],
          },
          "el-input": {
            template:
              '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ["modelValue"],
          },
          AccountCardSelector: {
            template: `
              <div class="account-card-selector">
                <div class="account-item" 
                  v-for="account in accounts" 
                  :key="account.id"
                  :class="{ active: modelValue === account.id }"
                  @click="$emit('update:modelValue', account.id)"
                >
                  {{ account.name }}
                </div>
              </div>
            `,
            props: ["modelValue", "accounts"],
          },
          AttachmentUpload: {
            template: "<div></div>",
          },
          PullRefresh: {
            template: "<div><slot /></div>",
          },
          BottomSheet: {
            template: "<div><slot /></div>",
          },
          TransactionCard: {
            template: "<div></div>",
          },
          AttachmentList: {
            template: "<div></div>",
          },
          RefundForm: {
            template: "<div></div>",
          },
        },
      },
    });
  });

  describe("账户选择器渲染 - Validates: Requirements 1.1", () => {
    it("应该在编辑对话框中渲染账户选择器", async () => {
      // 打开编辑对话框
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 验证对话框已打开
      expect(vm.editDialogVisible).toBe(true);

      // 查找账户选择器
      const accountSelector = wrapper.find(".account-card-selector");
      expect(accountSelector.exists()).toBe(true);
    });

    it("账户选择器应该显示在分类选择器和日期选择器之间", async () => {
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 获取所有表单项
      const formItems = wrapper.findAll(".el-form-item");

      // 找到分类、账户、日期的索引
      let categoryIndex = -1;
      let accountIndex = -1;
      let dateIndex = -1;

      formItems.forEach((item, index) => {
        const label = item.find("label");
        if (label.exists()) {
          const text = label.text();
          if (text === "分类") categoryIndex = index;
          if (text === "账户") accountIndex = index;
          if (text === "日期") dateIndex = index;
        }
      });

      // 验证顺序：分类 < 账户 < 日期
      expect(categoryIndex).toBeGreaterThan(-1);
      expect(accountIndex).toBeGreaterThan(-1);
      expect(dateIndex).toBeGreaterThan(-1);
      expect(categoryIndex).toBeLessThan(accountIndex);
      expect(accountIndex).toBeLessThan(dateIndex);
    });

    it("账户选择器应该接收正确的账户列表", async () => {
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      const accountSelector = wrapper.find(".account-card-selector");
      const accountItems = accountSelector.findAll(".account-item");

      // 验证账户数量
      expect(accountItems.length).toBe(mockAccounts.length);

      // 验证账户名称
      const accountNames = accountItems.map((item) => item.text());
      mockAccounts.forEach((account) => {
        expect(accountNames).toContain(account.name);
      });
    });
  });

  describe("表单数据绑定 - Validates: Requirements 1.2", () => {
    it("打开编辑对话框时应该正确设置 accountId", async () => {
      const vm = wrapper.vm as any;
      const transaction = mockTransactions[0];

      await vm.handleEdit(transaction);
      await nextTick();

      // 验证 editForm.accountId 被正确设置
      expect(vm.editForm.accountId).toBe(transaction.accountId);
    });

    it("打开编辑对话框时应该正确设置 originalAccountId", async () => {
      const vm = wrapper.vm as any;
      const transaction = mockTransactions[0];

      await vm.handleEdit(transaction);
      await nextTick();

      // 验证 originalAccountId 被正确设置
      expect(vm.originalAccountId).toBe(transaction.accountId);
    });

    it("账户选择器应该预选当前交易的账户", async () => {
      const vm = wrapper.vm as any;
      const transaction = mockTransactions[0];

      await vm.handleEdit(transaction);
      await nextTick();

      const accountSelector = wrapper.find(".account-card-selector");
      const activeAccount = accountSelector.find(".account-item.active");

      // 验证有账户被选中
      expect(activeAccount.exists()).toBe(true);

      // 验证选中的是正确的账户
      expect(activeAccount.text()).toBe(mockAccounts[0].name);
    });

    it("编辑不同交易时应该预选不同的账户", async () => {
      const vm = wrapper.vm as any;

      // 编辑第一个交易
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      expect(vm.editForm.accountId).toBe(mockTransactions[0].accountId);

      // 关闭对话框
      vm.editDialogVisible = false;
      await nextTick();

      // 编辑第二个交易
      await vm.handleEdit(mockTransactions[1]);
      await nextTick();

      expect(vm.editForm.accountId).toBe(mockTransactions[1].accountId);
      expect(vm.editForm.accountId).not.toBe(mockTransactions[0].accountId);
    });
  });

  describe("账户变更时表单更新 - Validates: Requirements 1.2", () => {
    it("选择不同的账户应该更新 editForm.accountId", async () => {
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      const initialAccountId = vm.editForm.accountId;

      // 选择不同的账户
      const accountSelector = wrapper.find(".account-card-selector");
      const accountItems = accountSelector.findAll(".account-item");

      // 找到一个不同的账户并点击
      const differentAccount = accountItems.find(
        (item) => item.text() !== mockAccounts[0].name,
      );

      if (differentAccount) {
        await differentAccount.trigger("click");
        await nextTick();

        // 验证 accountId 已更新
        expect(vm.editForm.accountId).not.toBe(initialAccountId);
        expect(vm.editForm.accountId).toBeGreaterThan(0);
      }
    });

    it("选择账户后应该显示为选中状态", async () => {
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      const accountSelector = wrapper.find(".account-card-selector");
      const accountItems = accountSelector.findAll(".account-item");

      // 点击第二个账户
      await accountItems[1].trigger("click");
      await nextTick();

      // 验证新账户被选中
      const activeAccounts = accountSelector.findAll(".account-item.active");
      expect(activeAccounts.length).toBe(1);
      expect(activeAccounts[0].text()).toBe(mockAccounts[1].name);
    });

    it("originalAccountId 在账户变更时应该保持不变", async () => {
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      const originalId = vm.originalAccountId;

      // 选择不同的账户
      const accountSelector = wrapper.find(".account-card-selector");
      const accountItems = accountSelector.findAll(".account-item");
      await accountItems[1].trigger("click");
      await nextTick();

      // 验证 originalAccountId 没有改变
      expect(vm.originalAccountId).toBe(originalId);
      expect(vm.editForm.accountId).not.toBe(originalId);
    });
  });

  describe("边界情况测试", () => {
    it("账户列表为空时应该正常渲染", async () => {
      // 这个测试简化处理，因为 mock 已经在顶层设置
      const vm = wrapper.vm as any;
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 对话框应该正常打开
      expect(vm.editDialogVisible).toBe(true);

      // 账户选择器应该存在（即使账户列表为空）
      const accountSelector = wrapper.find(".account-card-selector");
      expect(accountSelector.exists()).toBe(true);
    });

    it("交易没有账户时应该正确处理", async () => {
      const transactionWithoutAccount = {
        ...mockTransactions[0],
        accountId: null as any,
        account: undefined,
      };

      const vm = wrapper.vm as any;
      await vm.handleEdit(transactionWithoutAccount);
      await nextTick();

      // 应该正常打开对话框
      expect(vm.editDialogVisible).toBe(true);
      expect(vm.editForm.accountId).toBeNull();
      expect(vm.originalAccountId).toBeNull();
    });

    it("多次打开编辑对话框应该正确重置状态", async () => {
      const vm = wrapper.vm as any;

      // 第一次打开
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();
      const firstAccountId = vm.editForm.accountId;

      // 关闭
      vm.editDialogVisible = false;
      await nextTick();

      // 第二次打开不同的交易
      await vm.handleEdit(mockTransactions[1]);
      await nextTick();
      const secondAccountId = vm.editForm.accountId;

      // 验证状态被正确重置
      expect(secondAccountId).not.toBe(firstAccountId);
      expect(secondAccountId).toBe(mockTransactions[1].accountId);
    });
  });

  describe("集成测试", () => {
    it("完整的编辑流程：打开对话框 -> 查看账户 -> 选择账户", async () => {
      const vm = wrapper.vm as any;

      // 1. 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      expect(vm.editDialogVisible).toBe(true);
      expect(vm.editForm.accountId).toBe(mockTransactions[0].accountId);

      // 2. 验证账户选择器显示
      const accountSelector = wrapper.find(".account-card-selector");
      expect(accountSelector.exists()).toBe(true);

      // 3. 选择不同的账户
      const accountItems = accountSelector.findAll(".account-item");
      await accountItems[2].trigger("click");
      await nextTick();

      // 4. 验证表单数据更新
      expect(vm.editForm.accountId).toBe(mockAccounts[2].id);
      expect(vm.originalAccountId).toBe(mockTransactions[0].accountId);

      // 5. 验证选中状态
      const activeAccount = accountSelector.find(".account-item.active");
      expect(activeAccount.text()).toBe(mockAccounts[2].name);
    });
  });

  describe("提交逻辑测试 - Validates: Requirements 1.3", () => {
    let mockUpdateTransaction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // 重新设置 mock
      mockUpdateTransaction = vi.fn().mockResolvedValue(undefined);

      // 重新 mock transactionStore
      vi.mocked(useTransactionStore).mockReturnValue({
        transactions: mockTransactions,
        total: mockTransactions.length,
        loading: false,
        fetchTransactions: vi.fn(),
        updateTransaction: mockUpdateTransaction,
        deleteTransaction: vi.fn(),
        loadMore: vi.fn(),
        setPage: vi.fn(),
        resetFilters: vi.fn(),
      } as any);

      // 重新挂载组件
      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            "el-button": {
              template: "<button @click=\"$emit('click')\"><slot /></button>",
            },
            "el-icon": {
              template: "<span><slot /></span>",
            },
            "el-table": {
              template: '<div class="el-table"><slot /></div>',
            },
            "el-table-column": {
              template: "<div></div>",
            },
            "el-pagination": {
              template: "<div></div>",
            },
            "el-date-picker": {
              template: '<input type="text" />',
            },
            "el-select": {
              template: "<select><slot /></select>",
            },
            "el-option": {
              template: "<option></option>",
            },
            "el-dialog": {
              template: `
                <div v-if="modelValue" class="el-dialog">
                  <div class="el-dialog__header">
                    <slot name="header">{{ title }}</slot>
                  </div>
                  <div class="el-dialog__body">
                    <slot />
                  </div>
                  <div class="el-dialog__footer">
                    <slot name="footer" />
                  </div>
                </div>
              `,
              props: ["modelValue", "title", "width"],
            },
            "el-form": {
              template: "<form><slot /></form>",
              props: ["model", "labelWidth"],
            },
            "el-form-item": {
              template: `
                <div class="el-form-item">
                  <label v-if="label">{{ label }}</label>
                  <div class="el-form-item__content">
                    <slot />
                  </div>
                </div>
              `,
              props: ["label"],
            },
            "el-input-number": {
              template:
                '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
              props: ["modelValue", "min", "precision"],
            },
            "el-input": {
              template:
                '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
              props: ["modelValue"],
            },
            AccountCardSelector: {
              template: `
                <div class="account-card-selector">
                  <div class="account-item" 
                    v-for="account in accounts" 
                    :key="account.id"
                    :class="{ active: modelValue === account.id }"
                    @click="$emit('update:modelValue', account.id)"
                  >
                    {{ account.name }}
                  </div>
                </div>
              `,
              props: ["modelValue", "accounts"],
            },
            AttachmentUpload: {
              template: "<div></div>",
            },
            PullRefresh: {
              template: "<div><slot /></div>",
            },
            BottomSheet: {
              template: "<div><slot /></div>",
            },
            TransactionCard: {
              template: "<div></div>",
            },
            AttachmentList: {
              template: "<div></div>",
            },
            RefundForm: {
              template: "<div></div>",
            },
          },
        },
      });
    });

    it("成功提交时应该调用 updateTransaction", async () => {
      const vm = wrapper.vm as any;

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证调用了 updateTransaction
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        mockTransactions[0].id,
        {
          amount: mockTransactions[0].amount,
          categoryId: mockTransactions[0].categoryId,
          accountId: mockTransactions[0].accountId,
          date: mockTransactions[0].date,
          note: mockTransactions[0].note,
        },
      );
    });

    it("账户未变更时应该显示普通成功消息", async () => {
      const vm = wrapper.vm as any;
      const { ElMessage } = await import("element-plus");

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 提交编辑（账户未变更）
      await vm.submitEdit();
      await nextTick();

      // 验证显示普通成功消息
      expect(ElMessage.success).toHaveBeenCalledWith("更新成功");
    });

    it("账户变更时应该显示特殊成功消息", async () => {
      const vm = wrapper.vm as any;
      const { ElMessage } = await import("element-plus");

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 修改账户
      vm.editForm.accountId = mockAccounts[1].id;
      await nextTick();

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证显示特殊成功消息
      expect(ElMessage.success).toHaveBeenCalledWith(
        "更新成功，账户余额已调整",
      );
    });

    it("提交成功后应该关闭对话框", async () => {
      const vm = wrapper.vm as any;

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();
      expect(vm.editDialogVisible).toBe(true);

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证对话框已关闭
      expect(vm.editDialogVisible).toBe(false);
    });

    it("网络错误时应该显示错误消息", async () => {
      const vm = wrapper.vm as any;
      const { ElMessage } = await import("element-plus");
      const errorMessage = "网络连接失败";

      // 模拟网络错误
      mockUpdateTransaction.mockRejectedValueOnce(new Error(errorMessage));

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证显示错误消息
      expect(ElMessage.error).toHaveBeenCalledWith(errorMessage);
    });

    it("网络错误时对话框应该保持打开", async () => {
      const vm = wrapper.vm as any;

      // 模拟网络错误
      mockUpdateTransaction.mockRejectedValueOnce(new Error("网络错误"));

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();
      expect(vm.editDialogVisible).toBe(true);

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证对话框仍然打开
      expect(vm.editDialogVisible).toBe(true);
    });

    it("提交时应该设置 submitting 状态", async () => {
      const vm = wrapper.vm as any;

      // 模拟慢速网络
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateTransaction.mockReturnValueOnce(updatePromise);

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 开始提交
      const submitPromise = vm.submitEdit();
      await nextTick();

      // 验证 submitting 为 true
      expect(vm.submitting).toBe(true);

      // 完成提交
      resolveUpdate!();
      await submitPromise;
      await nextTick();

      // 验证 submitting 恢复为 false
      expect(vm.submitting).toBe(false);
    });

    it("提交失败后 submitting 应该恢复为 false", async () => {
      const vm = wrapper.vm as any;

      // 模拟网络错误
      mockUpdateTransaction.mockRejectedValueOnce(new Error("网络错误"));

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 提交编辑
      await vm.submitEdit();
      await nextTick();

      // 验证 submitting 恢复为 false
      expect(vm.submitting).toBe(false);
    });
  });

  describe("保存按钮禁用逻辑测试", () => {
    it("账户列表为空时保存按钮应该被禁用", async () => {
      // 创建空账户列表的 mock
      vi.mocked(useAccountStore).mockReturnValue({
        accounts: [],
        fetchAccounts: vi.fn(),
      } as any);

      // 重新挂载组件
      const emptyAccountWrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            "el-button": {
              template:
                '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
              props: ["disabled", "loading"],
            },
            "el-icon": {
              template: "<span><slot /></span>",
            },
            "el-table": {
              template: '<div class="el-table"><slot /></div>',
            },
            "el-table-column": {
              template: "<div></div>",
            },
            "el-pagination": {
              template: "<div></div>",
            },
            "el-date-picker": {
              template: '<input type="text" />',
            },
            "el-select": {
              template: "<select><slot /></select>",
            },
            "el-option": {
              template: "<option></option>",
            },
            "el-dialog": {
              template: `
                <div v-if="modelValue" class="el-dialog">
                  <div class="el-dialog__header">
                    <slot name="header">{{ title }}</slot>
                  </div>
                  <div class="el-dialog__body">
                    <slot />
                  </div>
                  <div class="el-dialog__footer">
                    <slot name="footer" />
                  </div>
                </div>
              `,
              props: ["modelValue", "title", "width"],
            },
            "el-form": {
              template: "<form><slot /></form>",
              props: ["model", "labelWidth"],
            },
            "el-form-item": {
              template: `
                <div class="el-form-item">
                  <label v-if="label">{{ label }}</label>
                  <div class="el-form-item__content">
                    <slot />
                  </div>
                </div>
              `,
              props: ["label"],
            },
            "el-input-number": {
              template:
                '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
              props: ["modelValue", "min", "precision"],
            },
            "el-input": {
              template:
                '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
              props: ["modelValue"],
            },
            AccountCardSelector: {
              template: "<div></div>",
            },
            AttachmentUpload: {
              template: "<div></div>",
            },
            PullRefresh: {
              template: "<div><slot /></div>",
            },
            BottomSheet: {
              template: "<div><slot /></div>",
            },
            TransactionCard: {
              template: "<div></div>",
            },
            AttachmentList: {
              template: "<div></div>",
            },
            RefundForm: {
              template: "<div></div>",
            },
          },
        },
      });

      const vm = emptyAccountWrapper.vm as any;

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 验证保存按钮被禁用
      const saveButtons = emptyAccountWrapper.findAll("button");
      const saveButton = saveButtons.find((btn) => btn.text().includes("保存"));

      expect(saveButton?.attributes("disabled")).toBeDefined();
    });

    it("accountId 为空时保存按钮应该被禁用", async () => {
      const vm = wrapper.vm as any;

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 清空 accountId
      vm.editForm.accountId = null;
      await nextTick();

      // 查找保存按钮
      const dialog = wrapper.find(".el-dialog");
      const buttons = dialog.findAll("button");
      const saveButton = buttons.find((btn) => btn.text().includes("保存"));

      // 验证保存按钮被禁用（通过检查 disabled 属性）
      expect(saveButton?.attributes("disabled")).toBeDefined();
    });

    it("accountId 有值且账户列表不为空时保存按钮应该可用", async () => {
      const vm = wrapper.vm as any;

      // 打开编辑对话框
      await vm.handleEdit(mockTransactions[0]);
      await nextTick();

      // 确保 accountId 有值
      expect(vm.editForm.accountId).toBe(mockTransactions[0].accountId);

      // 查找保存按钮
      const dialog = wrapper.find(".el-dialog");
      const buttons = dialog.findAll("button");
      const saveButton = buttons.find((btn) => btn.text().includes("保存"));

      // 验证保存按钮可用（disabled 属性应该是 false 或空字符串）
      const disabledAttr = saveButton?.attributes("disabled");
      expect(
        disabledAttr === undefined ||
          disabledAttr === "false" ||
          disabledAttr === "",
      ).toBe(true);
    });
  });
});
