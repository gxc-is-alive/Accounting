<template>
  <div class="account-selector">
    <div class="section-title">选择账户</div>
    <div v-if="sortedAccounts.length === 0" class="empty-tip">
      暂无账户，请先创建账户
    </div>
    <div v-else class="account-grid" :class="{ 'account-grid--mobile': isMobile }">
      <div
        v-for="account in sortedAccounts"
        :key="account.id"
        class="account-item"
        :class="{ active: modelValue === account.id }"
        :title="`${getAccountTypeName(account.type)} - ${account.name}`"
        @click="selectAccount(account.id)"
      >
        <el-icon><component :is="getAccountIcon(account)" /></el-icon>
        <span class="account-type">{{ getAccountTypeName(account.type) }}</span>
        <span class="account-name">{{ account.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Account } from '@/types';
import { getAccountIcon } from '@/utils/iconMap';
import { useDevice } from '@/composables/useDevice';

interface Props {
  modelValue: number | null;
  accounts: Account[];
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

// 账户类型名称映射
const accountTypeNames: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  credit: '信用卡',
  investment: '投资',
  other: '其他',
};

const getAccountTypeName = (type: string): string => {
  return accountTypeNames[type] || type;
};

// 直接使用传入的账户列表（排序由父组件处理）
const sortedAccounts = computed(() => props.accounts);

const selectAccount = (accountId: number) => {
  emit('update:modelValue', accountId);
};
</script>

<style scoped>
.account-selector {
  margin-bottom: 24px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.account-grid--mobile {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-sm, 8px);
}

.account-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
  min-height: var(--touch-target-min, 44px);
  min-width: 0;
  overflow: hidden;
}

.account-item:hover {
  background: #e6f7ff;
}

.account-item:active {
  transform: scale(0.95);
}

.account-item.active {
  background: #409eff;
  color: #fff;
}

.account-item.active .account-type {
  color: rgba(255, 255, 255, 0.8);
}

.account-type {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
}

.account-name {
  font-size: 12px;
  margin-top: 2px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
  line-height: 1.3;
}
</style>
