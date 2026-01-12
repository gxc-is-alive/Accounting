import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Account } from "@/types";
import { accountApi } from "@/api";

export const useAccountStore = defineStore("account", () => {
  const accounts = ref<Account[]>([]);
  const loading = ref(false);

  // 计算总余额
  const totalBalance = computed(() =>
    accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
  );

  // 获取账户列表
  const fetchAccounts = async () => {
    loading.value = true;
    try {
      const res = (await accountApi.list()) as { data: Account[] };
      accounts.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  // 创建账户
  const createAccount = async (data: Partial<Account>) => {
    const res = (await accountApi.create(data)) as { data: Account };
    accounts.value.push(res.data);
    return res.data;
  };

  // 更新账户
  const updateAccount = async (id: number, data: Partial<Account>) => {
    const res = (await accountApi.update(id, data)) as { data: Account };
    const index = accounts.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      accounts.value[index] = res.data;
    }
    return res.data;
  };

  // 删除账户
  const deleteAccount = async (id: number) => {
    await accountApi.delete(id);
    accounts.value = accounts.value.filter((a) => a.id !== id);
  };

  return {
    accounts,
    loading,
    totalBalance,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
});
