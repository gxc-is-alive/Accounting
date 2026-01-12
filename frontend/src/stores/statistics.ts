import { defineStore } from "pinia";
import { ref } from "vue";
import type { MonthlyStatistics, CategoryBreakdown, TrendData } from "@/types";
import { statisticsApi } from "@/api";

export const useStatisticsStore = defineStore("statistics", () => {
  const monthlyStats = ref<MonthlyStatistics | null>(null);
  const categoryBreakdown = ref<CategoryBreakdown[]>([]);
  const trendData = ref<TrendData[]>([]);
  const loading = ref(false);

  // 获取月度统计
  const fetchMonthlyStats = async (month?: string) => {
    loading.value = true;
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const res = (await statisticsApi.monthly(targetMonth)) as {
        data: MonthlyStatistics;
      };
      monthlyStats.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  // 获取分类统计
  const fetchCategoryBreakdown = async (startDate: string, endDate: string) => {
    loading.value = true;
    try {
      const res = (await statisticsApi.category({ startDate, endDate })) as {
        data: { breakdown: CategoryBreakdown[] };
      };
      categoryBreakdown.value = res.data.breakdown || [];
    } finally {
      loading.value = false;
    }
  };

  // 获取趋势数据
  const fetchTrendData = async (startDate: string, endDate: string) => {
    loading.value = true;
    try {
      const res = (await statisticsApi.trend({ startDate, endDate })) as {
        data: TrendData[];
      };
      trendData.value = res.data;
    } finally {
      loading.value = false;
    }
  };

  return {
    monthlyStats,
    categoryBreakdown,
    trendData,
    loading,
    fetchMonthlyStats,
    fetchCategoryBreakdown,
    fetchTrendData,
  };
});
