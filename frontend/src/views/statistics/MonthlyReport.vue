<template>
  <div class="monthly-report-page" :class="{ 'monthly-report-page--mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 v-if="!isMobile" class="page-title">月度报表</h3>
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          placeholder="选择月份"
          format="YYYY年MM月"
          value-format="YYYY-MM"
          :teleported="false"
          @change="loadData"
        />
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card income">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalIncome) }}</div>
        </div>
        <div class="stat-card expense">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalExpense) }}</div>
        </div>
        <div class="stat-card balance">
          <div class="stat-label">本月结余</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.balance) }}</div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="category-section">
        <div class="chart-card">
          <h4>支出分类占比</h4>
          <el-empty v-if="!expenseCategories.length" description="暂无支出数据" />
          <div v-else class="category-list">
            <div v-for="item in expenseCategories" :key="item.categoryId" class="category-item">
              <div class="category-info">
                <span class="category-name">{{ item.categoryName }}</span>
                <span class="category-percent">{{ item.percentage }}%</span>
              </div>
              <el-progress :percentage="item.percentage" :show-text="false" :stroke-width="isMobile ? 10 : 6" />
              <div class="category-amount">¥ {{ formatAmount(item.amount) }}</div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h4>收入分类占比</h4>
          <el-empty v-if="!incomeCategories.length" description="暂无收入数据" />
          <div v-else class="category-list">
            <div v-for="item in incomeCategories" :key="item.categoryId" class="category-item">
              <div class="category-info">
                <span class="category-name">{{ item.categoryName }}</span>
                <span class="category-percent">{{ item.percentage }}%</span>
              </div>
              <el-progress :percentage="item.percentage" status="success" :show-text="false" :stroke-width="isMobile ? 10 : 6" />
              <div class="category-amount">¥ {{ formatAmount(item.amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { statisticsApi } from '@/api';
import { useDevice } from '@/composables/useDevice';

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  amount: number;
  percentage: number;
}

interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const selectedMonth = ref(getCurrentMonth());
const statistics = ref<MonthlyStats>({ totalIncome: 0, totalExpense: 0, balance: 0 });
const expenseCategories = ref<CategoryStat[]>([]);
const incomeCategories = ref<CategoryStat[]>([]);

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatAmount(amount: number) {
  return (amount || 0).toFixed(2);
}

async function loadData() {
  if (!selectedMonth.value) return;
  await Promise.all([loadStatistics(), loadCategoryStats()]);
}

async function loadStatistics() {
  try {
    const res = await statisticsApi.monthly(selectedMonth.value) as unknown as { success: boolean; data: MonthlyStats };
    if (res.success && res.data) {
      statistics.value = res.data;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

async function loadCategoryStats() {
  try {
    const [year, month] = selectedMonth.value.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

    const [expenseRes, incomeRes] = await Promise.all([
      statisticsApi.category({ startDate, endDate, type: 'expense' }) as unknown as { success: boolean; data: { categories: CategoryStat[] } },
      statisticsApi.category({ startDate, endDate, type: 'income' }) as unknown as { success: boolean; data: { categories: CategoryStat[] } },
    ]);

    if (expenseRes.success && expenseRes.data) {
      expenseCategories.value = expenseRes.data.categories || [];
    }
    if (incomeRes.success && incomeRes.data) {
      incomeCategories.value = incomeRes.data.categories || [];
    }
  } catch (error) {
    console.error('加载分类统计失败:', error);
  }
}

onMounted(loadData);
</script>

<style scoped>
.monthly-report-page--mobile .page-card {
  padding: var(--spacing-md);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.monthly-report-page--mobile .page-header {
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.monthly-report-page--mobile .stat-cards {
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.monthly-report-page--mobile .stat-card {
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
}

.stat-card.income {
  background: rgba(103, 194, 58, 0.1);
}

.stat-card.expense {
  background: rgba(245, 108, 108, 0.1);
}

.stat-card.balance {
  background: rgba(64, 158, 255, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.monthly-report-page--mobile .stat-label {
  margin-bottom: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.monthly-report-page--mobile .stat-value {
  font-size: 20px;
}

.stat-card.income .stat-value { color: #67c23a; }
.stat-card.expense .stat-value { color: #f56c6c; }
.stat-card.balance .stat-value { color: #409eff; }

.category-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.monthly-report-page--mobile .category-section {
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

.chart-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.monthly-report-page--mobile .chart-card {
  padding: var(--spacing-md);
}

.chart-card h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
}

.category-item {
  margin-bottom: 16px;
  min-height: var(--touch-target-min);
}

.category-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.category-name {
  color: #606266;
}

.category-percent {
  color: #909399;
}

.category-amount {
  text-align: right;
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
</style>
