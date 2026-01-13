<template>
  <div class="investment-account-card" :class="{ 'is-mobile': isMobile }">
    <div class="card-header">
      <div class="account-icon">
        <el-icon size="24"><TrendCharts /></el-icon>
      </div>
      <div class="account-info">
        <div class="account-name">{{ account.name }}</div>
        <div class="account-shares">持仓 {{ formatShares(account.shares) }} 份</div>
      </div>
      <div class="profit-badge" :class="profitClass">
        {{ profitText }}
      </div>
    </div>

    <div class="card-body">
      <div class="investment-info">
        <div class="info-item">
          <span class="label">当前市值</span>
          <span class="value market-value">¥ {{ formatAmount(account.balance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">持仓成本</span>
          <span class="value">¥ {{ formatAmount(account.totalCost) }}</span>
        </div>
        <div class="info-item">
          <span class="label">盈亏金额</span>
          <span class="value" :class="profitClass">
            {{ account.profit >= 0 ? '+' : '' }}¥ {{ formatAmount(account.profit) }}
          </span>
        </div>
      </div>

      <div class="price-info">
        <div class="price-item">
          <span class="label">成本价</span>
          <span class="value">¥ {{ formatPrice(account.costPrice) }}</span>
        </div>
        <div class="price-item">
          <span class="label">当前净值</span>
          <span class="value">¥ {{ formatPrice(account.currentNetValue) }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <el-button type="primary" size="small" @click="$emit('buy', account)">
        <el-icon><Plus /></el-icon>
        买入
      </el-button>
      <el-button size="small" @click="$emit('sell', account)">
        <el-icon><Minus /></el-icon>
        卖出
      </el-button>
      <el-button size="small" @click="$emit('update-value', account)">
        <el-icon><Refresh /></el-icon>
        更新净值
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TrendCharts, Plus, Minus, Refresh } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import type { InvestmentAccount } from '@/types';

const props = defineProps<{
  account: InvestmentAccount;
}>();

defineEmits<{
  buy: [account: InvestmentAccount];
  sell: [account: InvestmentAccount];
  'update-value': [account: InvestmentAccount];
}>();

const { isMobile } = useDevice();

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2);
};

const formatShares = (shares: number) => {
  return shares.toFixed(2);
};

const formatPrice = (price: number) => {
  return price.toFixed(4);
};

const profitClass = computed(() => {
  if (props.account.profit > 0) return 'profit-up';
  if (props.account.profit < 0) return 'profit-down';
  return 'profit-zero';
});

const profitText = computed(() => {
  const rate = props.account.profitRate;
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(2)}%`;
});
</script>

<style scoped>
.investment-account-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 15px rgba(17, 153, 142, 0.4);
}

.investment-account-card.is-mobile {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: 18px;
  font-weight: 600;
}

.account-shares {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.profit-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.profit-badge.profit-up {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.profit-badge.profit-down {
  background: rgba(255, 77, 79, 0.8);
  color: #fff;
}

.profit-badge.profit-zero {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.card-body {
  margin-bottom: 16px;
}

.investment-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.is-mobile .investment-info {
  grid-template-columns: 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.is-mobile .info-item {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.is-mobile .info-item .label {
  margin-bottom: 0;
}

.info-item .value {
  font-size: 16px;
  font-weight: 600;
}

.info-item .value.market-value {
  color: #ffd93d;
}

.info-item .value.profit-up {
  color: #fff;
}

.info-item .value.profit-down {
  color: #ff4d4f;
}

.price-info {
  display: flex;
  gap: 24px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px;
}

.is-mobile .price-info {
  flex-direction: column;
  gap: 8px;
}

.price-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-mobile .price-item {
  justify-content: space-between;
}

.price-item .label {
  font-size: 12px;
  opacity: 0.8;
}

.price-item .value {
  font-size: 14px;
  font-weight: 500;
}

.card-footer {
  display: flex;
  gap: 8px;
}

.card-footer .el-button {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

.card-footer .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.card-footer .el-button--primary {
  background: #fff;
  color: #11998e;
}

.card-footer .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.9);
}
</style>
