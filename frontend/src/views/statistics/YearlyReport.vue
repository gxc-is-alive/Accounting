<template>
  <div class="yearly-report-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">年度报表</h3>
        <el-date-picker
          v-model="selectedYear"
          type="year"
          placeholder="选择年份"
          format="YYYY年"
          value-format="YYYY"
          :teleported="false"
          @change="loadData"
        />
      </div>

      <!-- 移动端统计卡片 -->
      <div v-if="isMobile" class="stat-cards-mobile">
        <div class="stat-card income">
          <div class="stat-label">年度收入</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalIncome) }}</div>
        </div>
        <div class="stat-card expense">
          <div class="stat-label">年度支出</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalExpense) }}</div>
        </div>
        <div class="stat-card balance">
          <div class="stat-label">年度结余</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalBalance) }}</div>
        </div>
      </div>

      <!-- 桌面端统计卡片 -->
      <el-row v-else :gutter="20" class="stat-cards">
        <el-col :span="8">
          <div class="stat-card income">
            <div class="stat-label">年度收入</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.totalIncome) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card expense">
            <div class="stat-label">年度支出</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.totalExpense) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card balance">
            <div class="stat-label">年度结余</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.totalBalance) }}</div>
          </div>
        </el-col>
      </el-row>

      <div class="chart-card" style="margin-top: 20px;">
        <h4>月度趋势</h4>
        <el-empty v-if="!monthlyStats.length" description="暂无数据" />
        
        <!-- 移动端手风琴样式 -->
        <el-collapse v-else-if="isMobile" v-model="activeMonths" class="monthly-collapse">
          <el-collapse-item
            v-for="item in monthlyStats"
            :key="item.month"
            :name="item.month"
          >
            <template #title>
              <div class="collapse-title">
                <span class="month-name">{{ item.month }}月</span>
                <span class="month-summary">
                  <span class="income">+{{ formatAmount(item.totalIncome) }}</span>
                  <span class="expense">-{{ formatAmount(item.totalExpense) }}</span>
                </span>
              </div>
            </template>
            <div class="collapse-content">
              <div class="detail-row">
                <span class="detail-label">收入</span>
                <el-progress 
                  :percentage="getPercentage(item.totalIncome, maxIncome)" 
                  :show-text="false" 
                  status="success"
                  :stroke-width="8"
                />
                <span class="detail-value income">¥{{ formatAmount(item.totalIncome) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">支出</span>
                <el-progress 
                  :percentage="getPercentage(item.totalExpense, maxExpense)" 
                  :show-text="false"
                  :stroke-width="8"
                />
                <span class="detail-value expense">¥{{ formatAmount(item.totalExpense) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">结余</span>
                <span class="detail-value" :class="item.balance >= 0 ? 'income' : 'expense'">
                  ¥{{ formatAmount(item.balance) }}
                </span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 桌面端列表样式 -->
        <div v-else class="monthly-list">
          <div v-for="item in monthlyStats" :key="item.month" class="monthly-item">
            <div class="month-label">{{ item.month }}月</div>
            <div class="month-bars">
              <div class="bar-row">
                <span class="bar-label">收入</span>
                <el-progress 
                  :percentage="getPercentage(item.totalIncome, maxIncome)" 
                  :show-text="false" 
                  status="success"
                  style="flex: 1; margin: 0 10px;"
                />
                <span class="bar-value income">¥{{ formatAmount(item.totalIncome) }}</span>
              </div>
              <div class="bar-row">
                <span class="bar-label">支出</span>
                <el-progress 
                  :percentage="getPercentage(item.totalExpense, maxExpense)" 
                  :show-text="false"
                  style="flex: 1; margin: 0 10px;"
                />
                <span class="bar-value expense">¥{{ formatAmount(item.totalExpense) }}</span>
              </div>
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

interface MonthStat {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface YearlyStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  monthlyStats: MonthStat[];
}

const { isMobile } = useDevice();

const selectedYear = ref(String(new Date().getFullYear()));
const statistics = ref<YearlyStats>({ totalIncome: 0, totalExpense: 0, totalBalance: 0, monthlyStats: [] });
const monthlyStats = ref<MonthStat[]>([]);
const activeMonths = ref<string[]>([]);

const maxIncome = computed(() => Math.max(...monthlyStats.value.map(m => m.totalIncome), 1));
const maxExpense = computed(() => Math.max(...monthlyStats.value.map(m => m.totalExpense), 1));

function formatAmount(amount: number) {
  return (amount || 0).toFixed(2);
}

function getPercentage(value: number, max: number) {
  return max > 0 ? Math.round((value / max) * 100) : 0;
}

async function loadData() {
  if (!selectedYear.value) return;
  try {
    const res = await statisticsApi.yearly(Number(selectedYear.value)) as unknown as { success: boolean; data: YearlyStats };
    if (res.success && res.data) {
      statistics.value = res.data;
      monthlyStats.value = res.data.monthlyStats || [];
    }
  } catch (error) {
    console.error('加载年度统计失败:', error);
  }
}

onMounted(loadData);
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.income { background: rgba(103, 194, 58, 0.1); }
.stat-card.expense { background: rgba(245, 108, 108, 0.1); }
.stat-card.balance { background: rgba(64, 158, 255, 0.1); }

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-card.income .stat-value { color: #67c23a; }
.stat-card.expense .stat-value { color: #f56c6c; }
.stat-card.balance .stat-value { color: #409eff; }

.chart-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.chart-card h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #303133;
}

.monthly-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.monthly-item:last-child {
  border-bottom: none;
}

.month-label {
  width: 50px;
  font-weight: 500;
  color: #606266;
}

.month-bars {
  flex: 1;
}

.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.bar-row:last-child {
  margin-bottom: 0;
}

.bar-label {
  width: 40px;
  font-size: 12px;
  color: #909399;
}

.bar-value {
  width: 100px;
  text-align: right;
  font-size: 13px;
}

.bar-value.income { color: #67c23a; }
.bar-value.expense { color: #f56c6c; }

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.is-mobile .page-header :deep(.el-date-picker) {
  width: 100%;
}

.stat-cards-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-cards-mobile .stat-card {
  padding: 16px;
}

.stat-cards-mobile .stat-value {
  font-size: 20px;
}

/* 手风琴样式 */
.monthly-collapse {
  border: none;
}

.monthly-collapse :deep(.el-collapse-item__header) {
  height: auto;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.monthly-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.monthly-collapse :deep(.el-collapse-item__content) {
  padding: 12px 0;
}

.collapse-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 12px;
}

.month-name {
  font-weight: 500;
  color: #303133;
}

.month-summary {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.month-summary .income { color: #67c23a; }
.month-summary .expense { color: #f56c6c; }

.collapse-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  width: 40px;
  font-size: 13px;
  color: #909399;
}

.detail-row :deep(.el-progress) {
  flex: 1;
}

.detail-value {
  width: 90px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
}

.detail-value.income { color: #67c23a; }
.detail-value.expense { color: #f56c6c; }

@media (max-width: 768px) {
  .yearly-report-page .page-card {
    padding: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
}
</style>
