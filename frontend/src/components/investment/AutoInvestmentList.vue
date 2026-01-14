<template>
  <div class="auto-investment-list">
    <div class="list-header">
      <span class="title">定投计划</span>
      <el-button type="primary" size="small" @click="$emit('add')">
        <el-icon><Plus /></el-icon>
        新建计划
      </el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="plans.length === 0" class="empty-state">
      <el-empty description="暂无定投计划" />
    </div>

    <div v-else class="plan-list">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        :class="{ paused: plan.status === 'paused' }"
      >
        <div class="plan-header">
          <span class="plan-name">{{ plan.name }}</span>
          <el-tag :type="statusTagType(plan.status)" size="small">
            {{ statusText(plan.status) }}
          </el-tag>
        </div>

        <div class="plan-info">
          <div class="info-row">
            <span class="label">定投金额</span>
            <span class="value amount">¥ {{ plan.amount.toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">执行频率</span>
            <span class="value">{{ frequencyText(plan) }}</span>
          </div>
          <div class="info-row">
            <span class="label">下次执行</span>
            <span class="value">{{ plan.nextExecutionDate }}</span>
          </div>
        </div>

        <div class="plan-accounts">
          <span class="from">{{ plan.sourceAccount?.name || '来源账户' }}</span>
          <el-icon><Right /></el-icon>
          <span class="to">{{ plan.targetAccount?.name || '目标账户' }}</span>
        </div>

        <div class="plan-actions">
          <el-button
            v-if="plan.status === 'active'"
            size="small"
            @click="$emit('pause', plan)"
          >
            暂停
          </el-button>
          <el-button
            v-if="plan.status === 'paused'"
            type="primary"
            size="small"
            @click="$emit('resume', plan)"
          >
            恢复
          </el-button>
          <el-button size="small" @click="$emit('edit', plan)">编辑</el-button>
          <el-button size="small" @click="$emit('records', plan)">记录</el-button>
          <el-button size="small" type="danger" @click="$emit('delete', plan)">
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Right } from '@element-plus/icons-vue';
import type { AutoInvestmentPlan } from '@/types';

defineProps<{
  plans: AutoInvestmentPlan[];
  loading?: boolean;
}>();

defineEmits<{
  add: [];
  edit: [plan: AutoInvestmentPlan];
  pause: [plan: AutoInvestmentPlan];
  resume: [plan: AutoInvestmentPlan];
  delete: [plan: AutoInvestmentPlan];
  records: [plan: AutoInvestmentPlan];
}>();

const statusTagType = (status: string) => {
  switch (status) {
    case 'active': return 'success';
    case 'paused': return 'warning';
    default: return 'info';
  }
};

const statusText = (status: string) => {
  switch (status) {
    case 'active': return '运行中';
    case 'paused': return '已暂停';
    default: return status;
  }
};

const frequencyText = (plan: AutoInvestmentPlan) => {
  switch (plan.frequency) {
    case 'daily':
      return `每日 ${plan.executionTime}`;
    case 'weekly':
      const weekDays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      return `每${weekDays[plan.executionDay || 1]} ${plan.executionTime}`;
    case 'monthly':
      return `每月${plan.executionDay}日 ${plan.executionTime}`;
    default:
      return plan.frequency;
  }
};
</script>

<style scoped>
.auto-investment-list {
  padding: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.loading-state,
.empty-state {
  padding: 32px 0;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.plan-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plan-card.paused {
  opacity: 0.7;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.plan-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.plan-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.info-row .label {
  font-size: 13px;
  color: #909399;
}

.info-row .value {
  font-size: 13px;
  color: #606266;
}

.info-row .amount {
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
}

.plan-accounts {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.plan-accounts .el-icon {
  color: #909399;
}

.plan-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
