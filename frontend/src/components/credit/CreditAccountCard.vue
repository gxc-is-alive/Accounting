<template>
  <div class="credit-account-card" :class="{ 'is-mobile': isMobile }">
    <div class="card-header">
      <div class="account-icon">
        <el-icon size="24"><CreditCard /></el-icon>
      </div>
      <div class="account-info">
        <div class="account-name">{{ account.name }}</div>
        <div class="account-dates">
          账单日 {{ account.billingDay }}日 · 还款日 {{ account.dueDay }}日
        </div>
      </div>
    </div>

    <div class="card-body">
      <div class="credit-info">
        <div class="info-item">
          <span class="label">待还金额</span>
          <span class="value outstanding">¥ {{ formatAmount(details?.outstandingBalance ?? 0) }}</span>
        </div>
        <div class="info-item">
          <span class="label">可用额度</span>
          <span class="value available">¥ {{ formatAmount(details?.availableCredit ?? account.creditLimit ?? 0) }}</span>
        </div>
        <div class="info-item">
          <span class="label">信用额度</span>
          <span class="value">¥ {{ formatAmount(account.creditLimit ?? 0) }}</span>
        </div>
      </div>

      <!-- 额度使用进度条 -->
      <div class="credit-progress">
        <el-progress
          :percentage="usagePercentage"
          :status="usageStatus"
          :stroke-width="isMobile ? 10 : 8"
          :show-text="false"
        />
        <div class="progress-label">
          已用 {{ usagePercentage.toFixed(1) }}%
        </div>
      </div>
    </div>

    <div class="card-footer">
      <el-button type="primary" size="small" @click="$emit('repay', account)">
        <el-icon><Money /></el-icon>
        还款
      </el-button>
      <el-button size="small" @click="$emit('detail', account)">
        <el-icon><View /></el-icon>
        详情
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CreditCard, Money, View } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import { accountApi } from '@/api';
import type { Account, CreditAccountDetails } from '@/types';

const props = defineProps<{
  account: Account;
}>();

defineEmits<{
  repay: [account: Account];
  detail: [account: Account];
}>();

const { isMobile } = useDevice();
const details = ref<CreditAccountDetails | null>(null);

const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

const usagePercentage = computed(() => {
  const limit = props.account.creditLimit ?? 0;
  const outstanding = details.value?.outstandingBalance ?? 0;
  if (limit <= 0) return 0;
  return Math.min((outstanding / limit) * 100, 100);
});

const usageStatus = computed(() => {
  if (usagePercentage.value > 90) return 'exception';
  if (usagePercentage.value > 70) return 'warning';
  return '';
});

const loadCreditDetails = async () => {
  try {
    const res = await accountApi.getCreditDetails(props.account.id) as unknown as { success: boolean; data: CreditAccountDetails };
    if (res.success && res.data) {
      details.value = res.data;
    }
  } catch (error) {
    console.error('加载信用账户详情失败:', error);
  }
};

onMounted(() => {
  if (props.account.type === 'credit') {
    loadCreditDetails();
  }
});
</script>

<style scoped>
.credit-account-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.credit-account-card.is-mobile {
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

.account-name {
  font-size: 18px;
  font-weight: 600;
}

.account-dates {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.card-body {
  margin-bottom: 16px;
}

.credit-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.is-mobile .credit-info {
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

.info-item .value.outstanding {
  color: #ffd93d;
}

.info-item .value.available {
  color: #6bcb77;
}

.credit-progress {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
}

.credit-progress :deep(.el-progress-bar__outer) {
  background: rgba(255, 255, 255, 0.3);
}

.credit-progress :deep(.el-progress-bar__inner) {
  background: #fff;
}

.progress-label {
  font-size: 12px;
  text-align: right;
  margin-top: 8px;
  opacity: 0.9;
}

.card-footer {
  display: flex;
  gap: 12px;
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
  color: #667eea;
}

.card-footer .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.9);
}
</style>
