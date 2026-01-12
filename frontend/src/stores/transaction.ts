import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Transaction,
  TransactionFilters,
  PaginatedResponse,
} from "@/types";
import { transactionApi } from "@/api";

export const useTransactionStore = defineStore("transaction", () => {
  // 状态
  const transactions = ref<Transaction[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(20);
  const loading = ref(false);
  const filters = ref<TransactionFilters>({});

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

  // 获取交易列表
  const fetchTransactions = async (newFilters?: TransactionFilters) => {
    loading.value = true;
    try {
      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters };
      }
      const res = (await transactionApi.list({
        ...filters.value,
        page: page.value,
        pageSize: pageSize.value,
      })) as { data: PaginatedResponse<Transaction> };

      transactions.value = res.data.items;
      total.value = res.data.total;
    } finally {
      loading.value = false;
    }
  };

  // 创建交易
  const createTransaction = async (data: Partial<Transaction>) => {
    loading.value = true;
    try {
      const res = (await transactionApi.create(data)) as { data: Transaction };
      // 刷新列表
      await fetchTransactions();
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  // 更新交易
  const updateTransaction = async (id: number, data: Partial<Transaction>) => {
    loading.value = true;
    try {
      const res = (await transactionApi.update(id, data)) as {
        data: Transaction;
      };
      // 更新本地数据
      const index = transactions.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        transactions.value[index] = res.data;
      }
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  // 删除交易
  const deleteTransaction = async (id: number) => {
    loading.value = true;
    try {
      await transactionApi.delete(id);
      // 从本地移除
      transactions.value = transactions.value.filter((t) => t.id !== id);
      total.value -= 1;
    } finally {
      loading.value = false;
    }
  };

  // 设置页码
  const setPage = (newPage: number) => {
    page.value = newPage;
    fetchTransactions();
  };

  // 加载更多（移动端无限滚动）
  const loadMore = async (newFilters?: TransactionFilters) => {
    if (loading.value) return;

    loading.value = true;
    try {
      const requestFilters = newFilters || {
        ...filters.value,
        page: page.value,
        pageSize: pageSize.value,
      };

      const res = (await transactionApi.list(requestFilters)) as {
        data: PaginatedResponse<Transaction>;
      };

      // 追加到现有列表
      transactions.value = [...transactions.value, ...res.data.items];
      total.value = res.data.total;
    } finally {
      loading.value = false;
    }
  };

  // 重置筛选
  const resetFilters = () => {
    filters.value = {};
    page.value = 1;
    fetchTransactions();
  };

  return {
    transactions,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    filters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setPage,
    loadMore,
    resetFilters,
  };
});
