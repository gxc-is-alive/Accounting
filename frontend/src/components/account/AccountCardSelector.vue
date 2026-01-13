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
        @click="selectAccount(account.id)"
      >
        <el-icon><component :is="getAccountIcon(account)" /></el-icon>
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

// 直接使用传入的账户列表（排序由父组件处理）
const sortedAccounts = computed(() => props.accounts);

const selectAccount = (accountId: number) => {
  emit('update:modelValue', accountId);
};
</script>

<style scoped>
.account-selector {
  margin-bottom: 24px;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.account-grid--mobile {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm, 8px);
}

.account-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
  min-height: var(--touch-target-min, 44px);
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

.account-name {
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
