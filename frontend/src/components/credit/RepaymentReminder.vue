<template>
  <div class="repayment-reminder" :class="{ 'is-mobile': isMobile }">
    <div class="reminder-header">
      <el-icon class="header-icon"><Bell /></el-icon>
      <span class="header-title">还款提醒</span>
      <el-badge v-if="overdueCount > 0" :value="overdueCount" type="danger" />
    </div>

    <el-empty v-if="!reminders.length && !loading" description="暂无还款提醒" :image-size="60" />

    <div v-else-if="loading" class="loading-state">
      <el-skeleton :rows="2" animated />
    </div>

    <div v-else class="reminder-list">
      <div
        v-for="reminder in reminders"
        :key="reminder.accountId"
        class="reminder-item"
        :class="{ 'is-overdue': reminder.isOverdue, 'is-urgent': reminder.daysUntilDue <= 3 && !reminder.isOverdue }"
        @click="$emit('repay', reminder)"
      >
        <div class="reminder-info">
          <div class="account-name">{{ reminder.accountName }}</div>
          <div class="due-info">
            <template v-if="reminder.isOverdue">
              <el-tag type="danger" size="small">已逾期</el-tag>
            </template>
            <template v-else-if="reminder.daysUntilDue === 0">
              <el-tag type="warning" size="small">今日到期</el-tag>
            </template>
            <template v-else>
              <span class="days-left">{{ reminder.daysUntilDue }}天后到期</span>
            </template>
            <span class="due-day">（每月{{ reminder.dueDay }}日）</span>
          </div>
        </div>
        <div class="reminder-amount">
          <div class="amount-label">待还</div>
          <div class="amount-value">¥ {{ formatAmount(reminder.outstandingBalance) }}</div>
        </div>
        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Bell, ArrowRight } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import { repaymentApi } from '@/api';
import type { DueReminder } from '@/types';

defineEmits<{
  repay: [reminder: DueReminder];
}>();

const { isMobile } = useDevice();
const reminders = ref<DueReminder[]>([]);
const loading = ref(false);

const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

const overdueCount = computed(() =>
  reminders.value.filter(r => r.isOverdue).length
);

const loadReminders = async () => {
  loading.value = true;
  try {
    const res = await repaymentApi.getReminders() as unknown as { success: boolean; data: DueReminder[] };
    if (res.success && res.data) {
      // 按紧急程度排序：逾期 > 今日到期 > 即将到期
      reminders.value = res.data.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntilDue - b.daysUntilDue;
      });
    }
  } catch (error) {
    console.error('加载还款提醒失败:', error);
  } finally {
    loading.value = false;
  }
};

// 暴露刷新方法
defineExpose({ refresh: loadReminders });

onMounted(() => {
  loadReminders();
});
</script>

<style scoped>
.repayment-reminder {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.header-icon {
  color: #e6a23c;
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.loading-state {
  padding: 12px 0;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reminder-item:hover {
  background: #ebeef5;
}

.reminder-item.is-overdue {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.reminder-item.is-urgent {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.reminder-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.due-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.days-left {
  color: #e6a23c;
  font-weight: 500;
}

.is-overdue .days-left {
  color: #f56c6c;
}

.reminder-amount {
  text-align: right;
  margin-right: 8px;
}

.amount-label {
  font-size: 12px;
  color: #909399;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.arrow-icon {
  color: #c0c4cc;
}

/* 移动端样式 */
.is-mobile .reminder-item {
  padding: 14px 12px;
}

.is-mobile .account-name {
  font-size: 15px;
}

.is-mobile .amount-value {
  font-size: 15px;
}
</style>
