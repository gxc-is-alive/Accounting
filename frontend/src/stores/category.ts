import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Category, BillType } from "@/types";
import { categoryApi, billTypeApi } from "@/api";

export const useCategoryStore = defineStore("category", () => {
  const categories = ref<Category[]>([]);
  const billTypes = ref<BillType[]>([]);
  const loading = ref(false);

  // 按类型分组的分类
  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === "income")
  );

  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === "expense")
  );

  // 获取分类列表
  const fetchCategories = async () => {
    loading.value = true;
    try {
      const res = (await categoryApi.list()) as { data: Category[] };
      categories.value = res.data;
    } finally {
      loading.value = false;
    }
  };

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

  // 初始化：同时获取分类和账单类型
  const init = async () => {
    await Promise.all([fetchCategories(), fetchBillTypes()]);
  };

  // 创建分类
  const createCategory = async (data: Partial<Category>) => {
    const res = (await categoryApi.create(data)) as { data: Category };
    categories.value.push(res.data);
    return res.data;
  };

  // 更新分类
  const updateCategory = async (id: number, data: Partial<Category>) => {
    const res = (await categoryApi.update(id, data)) as { data: Category };
    const index = categories.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      categories.value[index] = res.data;
    }
    return res.data;
  };

  // 删除分类
  const deleteCategory = async (id: number) => {
    await categoryApi.delete(id);
    categories.value = categories.value.filter((c) => c.id !== id);
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
    categories,
    billTypes,
    loading,
    incomeCategories,
    expenseCategories,
    fetchCategories,
    fetchBillTypes,
    init,
    createCategory,
    updateCategory,
    deleteCategory,
    createBillType,
    updateBillType,
    deleteBillType,
  };
});
