import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ElMessage } from "element-plus";
import TransactionList from "../TransactionList.vue";
import type { Transaction } from "@/types";

// Mock dependencies
vi.mock("@/api", () => ({
  attachmentApi: {
    listByTransaction: vi.fn().mockResolvedValue([]),
  },
  refundApi: {
    create: vi.fn().mockResolvedValue({ success: true }),
    getTransactionRefunds: vi.fn().mockResolvedValue({
      success: true,
      data: {
        refundableAmount: 100,
        refunds: [],
      },
    }),
  },
}));

vi.mock("@/composables/useDevice", () => ({
  useDevice: () => ({
    device: { value: { isMobile: false } },
  }),
}));

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

describe("TransactionList - PC 端退款功能", () => {
  let wrapper: any;
  let pinia: any;

  const mockExpenseTransaction: Transaction = {
    id: 1,
    type: "expense",
    amount: 100,
    date: "2024-01-01",
    categoryId: 1,
    accountId: 1,
    userId: 1,
    note: "测试支出",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  const mockIncomeTransaction: Transaction = {
    id: 2,
    type: "income",
    amount: 200,
    date: "2024-01-01",
    categoryId: 2,
    accountId: 1,
    userId: 1,
    note: "测试收入",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  const mockRefundTransaction: Transaction = {
    id: 3,
    type: "refund",
    amount: 50,
    date: "2024-01-01",
    categoryId: 1,
    accountId: 1,
    userId: 1,
    originalTransactionId: 1,
    note: "测试退款",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  describe("7.1 测试退款按钮显示逻辑", () => {
    it("支出交易应该显示退款按钮", async () => {
      const transactionStore = {
        transactions: [mockExpenseTransaction],
        total: 1,
        loading: false,
        fetchTransactions: vi.fn(),
        setPage: vi.fn(),
        resetFilters: vi.fn(),
      };

      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElTable: false,
            ElTableColumn: false,
            ElButton: false,
            ElDialog: true,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 模拟 store 数据
      const store = wrapper.vm.$pinia.state.value.transaction;
      if (store) {
        store.transactions = [mockExpenseTransaction];
        store.total = 1;
        store.loading = false;
      }

      await wrapper.vm.$nextTick();

      // 验证退款按钮存在
      const buttons = wrapper.findAll("button");
      const refundButton = buttons.find((btn: any) =>
        btn.text().includes("退款"),
      );

      expect(refundButton).toBeDefined();
    });

    it("收入交易不应该显示退款按钮", async () => {
      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElTable: false,
            ElTableColumn: false,
            ElButton: false,
            ElDialog: true,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 模拟 store 数据
      const store = wrapper.vm.$pinia.state.value.transaction;
      if (store) {
        store.transactions = [mockIncomeTransaction];
        store.total = 1;
        store.loading = false;
      }

      await wrapper.vm.$nextTick();

      // 验证退款按钮不存在（通过检查按钮文本）
      const buttons = wrapper.findAll("button");
      const refundButton = buttons.find((btn: any) =>
        btn.text().includes("退款"),
      );

      expect(refundButton).toBeUndefined();
    });

    it("退款类型交易不应该显示退款按钮", async () => {
      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElTable: false,
            ElTableColumn: false,
            ElButton: false,
            ElDialog: true,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 模拟 store 数据
      const store = wrapper.vm.$pinia.state.value.transaction;
      if (store) {
        store.transactions = [mockRefundTransaction];
        store.total = 1;
        store.loading = false;
      }

      await wrapper.vm.$nextTick();

      // 验证退款按钮不存在
      const buttons = wrapper.findAll("button");
      const refundButton = buttons.find((btn: any) =>
        btn.text().includes("退款"),
      );

      expect(refundButton).toBeUndefined();
    });
  });

  describe("7.2 测试对话框交互", () => {
    it("点击退款按钮应该打开对话框", async () => {
      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElDialog: false,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 调用 handleRefundDesktop 方法
      await wrapper.vm.handleRefundDesktop(mockExpenseTransaction);
      await wrapper.vm.$nextTick();

      // 验证对话框可见性
      expect(wrapper.vm.refundDialogVisible).toBe(true);
      expect(wrapper.vm.refundTransactionDesktop).toEqual(
        mockExpenseTransaction,
      );
    });

    it("点击取消按钮应该关闭对话框", async () => {
      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElDialog: false,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 先打开对话框
      await wrapper.vm.handleRefundDesktop(mockExpenseTransaction);
      expect(wrapper.vm.refundDialogVisible).toBe(true);

      // 关闭对话框
      wrapper.vm.refundDialogVisible = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.refundDialogVisible).toBe(false);
    });
  });

  describe("7.3 测试退款提交流程", () => {
    it("成功提交后应该显示成功消息并关闭对话框", async () => {
      const { refundApi } = await import("@/api");
      vi.mocked(refundApi.create).mockResolvedValue({ success: true } as any);

      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElDialog: false,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 打开对话框
      await wrapper.vm.handleRefundDesktop(mockExpenseTransaction);
      expect(wrapper.vm.refundDialogVisible).toBe(true);

      // 提交退款
      await wrapper.vm.submitRefundDesktop({
        originalTransactionId: 1,
        amount: 50,
        date: "2024-01-02",
        note: "部分退款",
      });

      // 验证成功消息
      expect(ElMessage.success).toHaveBeenCalledWith("退款成功");

      // 验证对话框关闭
      expect(wrapper.vm.refundDialogVisible).toBe(false);
      expect(wrapper.vm.refundTransactionDesktop).toBeNull();
    });

    it("失败提交后应该显示错误消息并保持对话框打开", async () => {
      const { refundApi } = await import("@/api");
      const errorMessage = "退款金额超过可退款金额";
      vi.mocked(refundApi.create).mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      wrapper = mount(TransactionList, {
        global: {
          plugins: [pinia],
          stubs: {
            ElDialog: false,
            RefundForm: true,
          },
          mocks: {
            $router: { push: vi.fn() },
          },
        },
      });

      // 打开对话框
      await wrapper.vm.handleRefundDesktop(mockExpenseTransaction);
      expect(wrapper.vm.refundDialogVisible).toBe(true);

      // 提交退款
      await wrapper.vm.submitRefundDesktop({
        originalTransactionId: 1,
        amount: 150,
        date: "2024-01-02",
        note: "超额退款",
      });

      // 验证错误消息
      expect(ElMessage.error).toHaveBeenCalledWith(errorMessage);

      // 验证对话框保持打开
      expect(wrapper.vm.refundDialogVisible).toBe(true);
    });
  });
});
