<template>
  <div class="investment-reminder">
    <div v-if="reminders.length > 0" class="reminder-badge" @click="showDrawer = true">
      <el-badge :value="reminders.length" :max="99">
        <el-button :icon="Bell" circle size="small" />
      </el-badge>
    </div>

    <el-drawer
      v-model="showDrawer"
      title="投资提醒"
      :size="isMobile ? '100%' : '400px'"
      direction="rtl"
    >
      <div class="reminder-header">
        <span>{{ reminders.length }} 条未读提醒</span>
        <el-button
          v-if="reminders.length > 0"
          type="primary"
          link
          size="small"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>

      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="reminders.length === 0" class="empty-state">
        <el-empty description="暂无提醒" />
      </div>

      <div v-else class="reminder-list">
        <div
          v-for="reminder in reminders"
          :key="reminder.id"
          class="reminder-item"
          :class="reminderTypeClass(reminder.type)"
        >
          <div class="reminder-icon">
            <el-icon v-if="reminder.type === 'execution_failed'"><CircleClose /></el-icon>
            <el-icon v-else><Warning /></el-icon>
          </div>
          <div class="reminder-content">
            <div class="reminder-title">
              {{ reminderTypeText(reminder.type) }}
            </div>
            <div class="reminder-message">{{ reminder.message }}</div>
            <div class="reminder-time">{{ formatTime(reminder.createdAt) }}</div>
          </div>
          <el-button
            type="primary"
            link
            size="small"
            @click="handleMarkRead(reminder.id)"
          >
            已读
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bell, CircleClose, Warning } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { autoInvestmentApi } from '@/api';
import type { InvestmentReminder } from '@/types';

const { isMobile } = useDevice();
const showDrawer = ref(false);
const loading = ref(false);
const reminders = ref<InvestmentReminder[]>([]);

const reminderTypeClass = (type: string) => {
  return type === 'execution_failed' ? 'type-error' : 'type-warning';
};

const reminderTypeText = (type: string) => {
  switch (type) {
    case 'execution_failed': return '执行失败';
    case 'insufficient_balance': return '余额不足';
    default: return type;
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

const loadReminders = async () => {
  loading.value = true;
  try {
    const res = await autoInvestmentApi.listReminders() as unknown as {
      success: boolean;
      data: InvestmentReminder[];
    };
    if (res.success && res.data) {
      reminders.value = res.data;
    }
  } catch (error) {
    console.error('加载提醒失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleMarkRead = async (id: number) => {
  try {
    await autoInvestmentApi.markReminderRead(id);
    reminders.value = reminders.value.filter(r => r.id !== id);
    ElMessage.success('已标记为已读');
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const handleMarkAllRead = async () => {
  try {
    await autoInvestmentApi.markAllRemindersRead();
    reminders.value = [];
    ElMessage.success('已全部标记为已读');
  } catch (error) {
    console.error('标记全部已读失败:', error);
  }
};

// 暴露刷新方法
defineExpose({
  refresh: loadReminders,
});

onMounted(() => {
  loadReminders();
});
</script>

<style scoped>
.investment-reminder {
  display: inline-block;
}

.reminder-badge {
  cursor: pointer;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.loading-state,
.empty-state {
  padding: 32px 0;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.reminder-item.type-error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.reminder-item.type-warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.reminder-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
}

.type-error .reminder-icon {
  color: #f56c6c;
}

.type-warning .reminder-icon {
  color: #e6a23c;
}

.reminder-content {
  flex: 1;
  min-width: 0;
}

.reminder-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.reminder-message {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  word-break: break-word;
}

.reminder-time {
  font-size: 12px;
  color: #909399;
}
</style>
