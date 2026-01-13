import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Category } from "@/types";
import { categoryApi } from "@/api";

export const useCategoryStore = defineStore("category", () => {
  const categories = ref<Category[]>([]);
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

  // 初始化
  const init = async () => {
    await fetchCategories();
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

  return {
    categories,
    loading,
    incomeCategories,
    expenseCategories,
    fetchCategories,
    init,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});
