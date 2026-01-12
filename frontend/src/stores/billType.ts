import { defineStore } from "pinia";
import { ref } from "vue";
import type { BillType } from "@/types";
import { billTypeApi } from "@/api";

export const useBillTypeStore = defineStore("billType", () => {
  const billTypes = ref<BillType[]>([]);
  const loading = ref(false);

  // 获取账单类型列表
  const fetchBillTypes = async () => {
    loading.value = true;
    try {
      const res = (await billTypeApi.list()) as { data: BillType[] };
      billTypes.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  // 创建账单类型
  const createBillType = async (data: Partial<BillType>) => {
    const res = (await billTypeApi.create(data)) as { data: BillType };
    billTypes.value.push(res.data);
    return res.data;
  };

  // 更新账单类型
  const updateBillType = async (id: number, data: Partial<BillType>) => {
    const res = (await billTypeApi.update(id, data)) as { data: BillType };
    const index = billTypes.value.findIndex((b) => b.id === id);
    if (index !== -1) {
      billTypes.value[index] = res.data;
    }
    return res.data;
  };

  // 删除账单类型
  const deleteBillType = async (id: number) => {
    await billTypeApi.delete(id);
    billTypes.value = billTypes.value.filter((b) => b.id !== id);
  };

  return {
    billTypes,
    loading,
    fetchBillTypes,
    createBillType,
    updateBillType,
    deleteBillType,
  };
});
