<template>
  <div class="investment-overview-card" :class="{ 'is-mobile': isMobile }">
    <div class="card-header">
      <h3 class="card-title">
        <el-icon><TrendCharts /></el-icon>
        投资概览
      </h3>
      <el-button type="primary" link size="small" @click="$emit('view-detail')">
        查看详情
      </el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="2" animated />
    </div>

    <div v-else-if="summary.accountCount === 0" class="empty-state">
      <span>暂无投资账户</span>
      <el-button type="primary" link size="small" @click="$emit('add')">
        添加投资
      </el-button>
    </div>

    <div v-else class="overview-content">
      <div class="main-stats">
        <div class="stat-row">
          <span class="label">总市值</span>
          <span class="value highlight">¥ {{ formatAmount(summary.totalValue) }}</span>
        </div>
        <div class="stat-row">
          <span class="label">总投入</span>
          <span class="value">¥ {{ formatAmount(summary.totalCost) }}</span>
        </div>
      </div>

      <div class="profit-stats">
        <div class="profit-item">
          <span class="label">总盈亏</span>
          <span class="value" :class="summary.totalProfit >= 0 ? 'profit-up' : 'profit-down'">
            {{ summary.totalProfit >= 0 ? '+' : '' }}¥ {{ formatAmount(summary.totalProfit) }}
          </span>
        </div>
        <div class="profit-item">
          <span class="label">收益率</span>
          <span class="value" :class="summary.profitRate >= 0 ? 'profit-up' : 'profit-down'">
            {{ summary.profitRate >= 0 ? '+' : '' }}{{ summary.profitRate.toFixed(2) }}%
          </span>
        </div>
      </div>

      <div class="account-count">
        持有 {{ summary.accountCount }} 个投资产品
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TrendCharts } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import { investmentApi } from '@/api';
import type { InvestmentOverview } from '@/types';

defineEmits<{
  'view-detail': [];
  add: [];
}>();

const { isMobile } = useDevice();
const loading = ref(false);
const summary = ref<InvestmentOverview>({
  totalCost: 0,
  totalValue: 0,
  totalProfit: 0,
  profitRate: 0,
  accountCount: 0,
});

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2);
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await investmentApi.getSummary() as unknown as { success: boolean; data: InvestmentOverview };
    if (res.success && res.data) {
      summary.value = res.data;
    }
  } catch (error) {
    console.error('加载投资概览失败:', error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  loadData();
};

defineExpose({ refresh });

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.investment-overview-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
}

.investment-overview-card.is-mobile {
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.card-header .el-button {
  color: rgba(255, 255, 255, 0.9);
}

.card-header .el-button:hover {
  color: #fff;
}

.loading-state {
  padding: 20px 0;
}

.loading-state :deep(.el-skeleton__item) {
  background: rgba(255, 255, 255, 0.2);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  opacity: 0.9;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row .label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-row .value {
  font-size: 18px;
  font-weight: 600;
}

.stat-row .value.highlight {
  color: #ffd93d;
}

.profit-stats {
  display: flex;
  gap: 24px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.is-mobile .profit-stats {
  flex-direction: column;
  gap: 8px;
}

.profit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.profit-item .label {
  font-size: 13px;
  opacity: 0.9;
}

.profit-item .value {
  font-size: 16px;
  font-weight: 600;
}

.profit-item .value.profit-up {
  color: #fff;
}

.profit-item .value.profit-down {
  color: #ff6b6b;
}

.account-count {
  font-size: 12px;
  opacity: 0.8;
  text-align: center;
}
</style>
