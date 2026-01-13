<template>
  <PullRefresh
    v-if="isMobile"
    :loading="refreshing"
    @refresh="onRefresh"
  >
    <div class="dashboard" :class="{ 'dashboard--mobile': isMobile }">
      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card income">
          <div class="stat-icon">
            <el-icon size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月收入</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.totalIncome) }}</div>
          </div>
        </div>
        <div class="stat-card expense">
          <div class="stat-icon">
            <el-icon size="32"><Goods /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月支出</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.totalExpense) }}</div>
          </div>
        </div>
        <div class="stat-card balance">
          <div class="stat-icon">
            <el-icon size="32"><Wallet /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月结余</div>
            <div class="stat-value">¥ {{ formatAmount(statistics.balance) }}</div>
          </div>
        </div>
      </div>

      <!-- 家庭概览 -->
      <FamilyOverviewCard
        v-if="hasFamilies"
        ref="familyOverviewRef"
        class="page-card"
        @view-detail="goToFamilyReport"
      />

      <!-- 投资概览 -->
      <InvestmentOverviewCard
        ref="investmentOverviewRef"
        class="page-card"
        @view-detail="goToInvestment"
        @add="goToInvestment"
      />

      <!-- 最近交易 -->
      <div class="page-card">
        <h3 class="page-title">最近交易</h3>
        <el-empty v-if="!recentTransactions.length" description="暂无交易记录" />
        <div v-else class="transaction-list">
          <div
            v-for="item in recentTransactions"
            :key="item.id"
            class="transaction-item"
          >
            <div class="transaction-info">
              <span class="transaction-category">{{ item.category?.name || '未分类' }}</span>
              <span class="transaction-note">{{ item.note || '-' }}</span>
            </div>
            <div
              class="transaction-amount"
              :class="item.type === 'income' ? 'amount-income' : 'amount-expense'"
            >
              {{ item.type === 'income' ? '+' : '-' }}¥{{ formatAmount(item.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 预算概览 -->
      <div class="page-card">
        <h3 class="page-title">预算概览</h3>
        <el-empty v-if="!budgets.length" description="暂无预算" />
        <div v-else class="budget-list">
          <div v-for="budget in budgets" :key="budget.budgetId || budget.id" class="budget-item">
            <div class="budget-header">
              <span>{{ budget.categoryName || budget.category?.name || '总预算' }}</span>
              <span>{{ budget.spentAmount || budget.spent || 0 }}/{{ budget.budgetAmount || budget.amount || 0 }}</span>
            </div>
            <el-progress
              :percentage="Math.min(budget.percentage || (budget.progress || 0) * 100, 100)"
              :status="(budget.percentage || 0) > 100 ? 'exception' : (budget.percentage || 0) > 80 ? 'warning' : ''"
              :stroke-width="isMobile ? 10 : 6"
            />
          </div>
        </div>
      </div>

      <!-- 还款提醒 -->
      <div class="page-card">
        <RepaymentReminder ref="reminderRef" />
      </div>
    </div>
  </PullRefresh>

  <!-- 桌面端布局 -->
  <div v-else class="dashboard dashboard--desktop">
    <div class="stat-cards-desktop">
      <div class="stat-card income">
        <div class="stat-icon">
          <el-icon size="32"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalIncome) }}</div>
        </div>
      </div>
      <div class="stat-card expense">
        <div class="stat-icon">
          <el-icon size="32"><Goods /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.totalExpense) }}</div>
        </div>
      </div>
      <div class="stat-card balance">
        <div class="stat-icon">
          <el-icon size="32"><Wallet /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">本月结余</div>
          <div class="stat-value">¥ {{ formatAmount(statistics.balance) }}</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="main-content">
        <!-- 家庭概览 -->
        <FamilyOverviewCard
          v-if="hasFamilies"
          ref="familyOverviewRef"
          class="page-card family-card"
          @view-detail="goToFamilyReport"
        />

        <!-- 投资概览 -->
        <InvestmentOverviewCard
          ref="investmentOverviewRef"
          class="page-card"
          @view-detail="goToInvestment"
          @add="goToInvestment"
        />

        <div class="page-card transactions-card">
          <h3 class="page-title">最近交易</h3>
          <el-empty v-if="!recentTransactions.length" description="暂无交易记录" />
          <div v-else class="transaction-list">
            <div
              v-for="item in recentTransactions"
              :key="item.id"
              class="transaction-item"
            >
              <div class="transaction-info">
                <span class="transaction-category">{{ item.category?.name || '未分类' }}</span>
                <span class="transaction-note">{{ item.note || '-' }}</span>
              </div>
              <div
                class="transaction-amount"
                :class="item.type === 'income' ? 'amount-income' : 'amount-expense'"
              >
                {{ item.type === 'income' ? '+' : '-' }}¥{{ formatAmount(item.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="sidebar-cards">
        <div class="page-card budget-card">
          <h3 class="page-title">预算概览</h3>
          <el-empty v-if="!budgets.length" description="暂无预算" />
          <div v-else class="budget-list">
            <div v-for="budget in budgets" :key="budget.budgetId || budget.id" class="budget-item">
              <div class="budget-header">
                <span>{{ budget.categoryName || budget.category?.name || '总预算' }}</span>
                <span>{{ budget.spentAmount || budget.spent || 0 }}/{{ budget.budgetAmount || budget.amount || 0 }}</span>
              </div>
              <el-progress
                :percentage="Math.min(budget.percentage || (budget.progress || 0) * 100, 100)"
                :status="(budget.percentage || 0) > 100 ? 'exception' : (budget.percentage || 0) > 80 ? 'warning' : ''"
              />
            </div>
          </div>
        </div>
        <RepaymentReminder ref="reminderRef" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { TrendCharts, Goods, Wallet } from '@element-plus/icons-vue';
import type { Transaction, Budget, MonthlyStatistics, Family } from '@/types';
import { statisticsApi, transactionApi, budgetApi, familyApi } from '@/api';
import { useDevice } from '@/composables/useDevice';
import PullRefresh from '@/components/mobile/PullRefresh.vue';
import RepaymentReminder from '@/components/credit/RepaymentReminder.vue';
import FamilyOverviewCard from '@/components/family/FamilyOverviewCard.vue';
import { InvestmentOverviewCard } from '@/components/investment';

const router = useRouter();
const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const reminderRef = ref<InstanceType<typeof RepaymentReminder>>();
const familyOverviewRef = ref<InstanceType<typeof FamilyOverviewCard>>();
const investmentOverviewRef = ref<InstanceType<typeof InvestmentOverviewCard>>();

const statistics = ref<MonthlyStatistics>({
  month: '',
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  categoryBreakdown: [],
});

const recentTransactions = ref<Transaction[]>([]);
const budgets = ref<Budget[]>([]);
const refreshing = ref(false);
const hasFamilies = ref(false);

const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const loadStatistics = async () => {
  try {
    const month = getCurrentMonth();
    const res = await statisticsApi.monthly(month) as unknown as { success: boolean; data: MonthlyStatistics };
    if (res.success && res.data) {
      statistics.value = res.data;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

const loadRecentTransactions = async () => {
  try {
    const res = await transactionApi.list({ page: 1, pageSize: 5 }) as unknown as { success: boolean; data: { items: Transaction[] } };
    if (res.success && res.data) {
      recentTransactions.value = res.data.items || [];
    }
  } catch (error) {
    console.error('加载最近交易失败:', error);
  }
};

const loadBudgets = async () => {
  try {
    const res = await budgetApi.status() as unknown as { success: boolean; data: Budget[] };
    if (res.success && res.data) {
      budgets.value = res.data || [];
    }
  } catch (error) {
    console.error('加载预算失败:', error);
  }
};

const checkFamilies = async () => {
  try {
    const res = await familyApi.list() as unknown as { success: boolean; data: Family[] };
    if (res.success && res.data) {
      hasFamilies.value = res.data.length > 0;
    }
  } catch (error) {
    console.error('检查家庭失败:', error);
    hasFamilies.value = false;
  }
};

const goToFamilyReport = () => {
  router.push('/family/report');
};

const goToInvestment = () => {
  router.push('/investment');
};

const loadAllData = async () => {
  await Promise.all([
    loadStatistics(),
    loadRecentTransactions(),
    loadBudgets(),
    checkFamilies(),
  ]);
};

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true;
  try {
    await loadAllData();
    reminderRef.value?.refresh();
    familyOverviewRef.value?.refresh();
    investmentOverviewRef.value?.refresh();
  } finally {
    refreshing.value = false;
  }
};

onMounted(async () => {
  await loadAllData();
});
</script>

<style scoped>
.dashboard {
  padding: var(--spacing-md);
  width: 100%;
  max-width: 100%;
}

.dashboard--mobile {
  padding: var(--spacing-sm);
}

/* 移动端统计卡片 */
.dashboard--mobile .stat-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.dashboard--mobile .stat-card {
  padding: var(--spacing-md);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.dashboard--mobile .stat-icon {
  width: 48px;
  height: 48px;
  margin-right: var(--spacing-sm);
}

.stat-card.income .stat-icon {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.stat-card.expense .stat-icon {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.stat-card.balance .stat-icon {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.dashboard--mobile .stat-label {
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.dashboard--mobile .stat-value {
  font-size: 20px;
}

/* 移动端页面卡片 */
.dashboard--mobile .page-card {
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.dashboard--mobile .page-title {
  font-size: 16px;
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-primary);
}

.transaction-list {
  max-height: 400px;
  overflow-y: auto;
}

.dashboard--mobile .transaction-list {
  max-height: none;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  min-height: var(--touch-target-min);
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard--mobile .transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-category {
  font-weight: 500;
  margin-right: 12px;
}

.dashboard--mobile .transaction-category {
  margin-right: 0;
  font-size: 14px;
}

.transaction-note {
  color: #909399;
  font-size: 13px;
}

.dashboard--mobile .transaction-note {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-amount {
  font-weight: 600;
  flex-shrink: 0;
}

.amount-income {
  color: var(--color-success);
}

.amount-expense {
  color: var(--color-danger);
}

.budget-item {
  margin-bottom: 16px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.dashboard--mobile .budget-header {
  font-size: 13px;
}

/* 移动端预算进度条更粗 */
.dashboard--mobile :deep(.el-progress-bar__outer) {
  height: 10px !important;
}

/* 桌面端布局 */
.dashboard--desktop {
  padding: 20px;
}

.stat-cards-desktop {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transactions-card {
  min-height: 300px;
}

.budget-card {
  min-height: 200px;
}

.family-card {
  margin-bottom: 0;
}
</style>
