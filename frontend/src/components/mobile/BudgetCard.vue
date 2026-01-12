<template>
  <SwipeAction
    :actions="swipeActions"
    @action="handleAction"
  >
    <div class="budget-card" @click="$emit('click')">
      <div class="budget-header">
        <div class="budget-icon" :style="{ backgroundColor: iconBgColor }">
          <span>{{ iconText }}</span>
        </div>
        <div class="budget-info">
          <div class="budget-name">{{ budget.categoryName || budget.category?.name || '总预算' }}</div>
          <div class="budget-month">{{ budget.month || '' }}</div>
        </div>
        <div class="budget-amount">
          <div class="spent">已用 ¥{{ formatAmount(spentAmount) }}</div>
          <div class="total">预算 ¥{{ formatAmount(budgetAmount) }}</div>
        </div>
      </div>
      
      <div class="budget-progress">
        <el-progress
          :percentage="Math.min(percentage, 100)"
          :stroke-width="10"
          :status="progressStatus"
          :show-text="false"
        />
        <div class="progress-text">
          <span :class="['percentage', progressStatus]">{{ percentage.toFixed(0) }}%</span>
          <span class="remaining">剩余 ¥{{ formatAmount(remainingAmount) }}</span>
        </div>
      </div>
    </div>
  </SwipeAction>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SwipeAction from './SwipeAction.vue'
import type { Budget } from '@/types'

interface Props {
  budget: Budget
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

// 计算属性
const spentAmount = computed(() => props.budget.spentAmount || props.budget.spent || 0)
const budgetAmount = computed(() => props.budget.budgetAmount || props.budget.amount || 0)
const percentage = computed(() => {
  if (budgetAmount.value <= 0) return 0
  return (spentAmount.value / budgetAmount.value) * 100
})
const remainingAmount = computed(() => Math.max(budgetAmount.value - spentAmount.value, 0))

const progressStatus = computed(() => {
  if (percentage.value > 100) return 'exception'
  if (percentage.value > 80) return 'warning'
  return ''
})

const iconText = computed(() => {
  const name = props.budget.categoryName || props.budget.category?.name || '总'
  return name.charAt(0)
})

const iconBgColor = computed(() => {
  if (percentage.value > 100) return '#f56c6c'
  if (percentage.value > 80) return '#e6a23c'
  return '#409eff'
})

// 滑动操作
const swipeActions = [
  { key: 'edit', text: '编辑', color: '#409eff' },
  { key: 'delete', text: '删除', color: '#f56c6c' }
]

function formatAmount(amount: number) {
  return (amount || 0).toFixed(2)
}

function handleAction(action: { key: string }) {
  if (action.key === 'edit') {
    emit('edit')
  } else if (action.key === 'delete') {
    emit('delete')
  }
}
</script>

<style scoped>
.budget-card {
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  padding: 16px;
  cursor: pointer;
}

.budget-card:active {
  background: var(--bg-hover, #f5f7fa);
}

.budget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.budget-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  flex-shrink: 0;
}

.budget-info {
  flex: 1;
  min-width: 0;
}

.budget-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary, #303133);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.budget-month {
  font-size: 13px;
  color: var(--text-secondary, #909399);
  margin-top: 2px;
}

.budget-amount {
  text-align: right;
  flex-shrink: 0;
}

.budget-amount .spent {
  font-size: 14px;
  color: var(--text-primary, #303133);
  font-weight: 500;
}

.budget-amount .total {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-top: 2px;
}

.budget-progress {
  margin-top: 8px;
}

.budget-progress :deep(.el-progress-bar__outer) {
  border-radius: 5px;
}

.budget-progress :deep(.el-progress-bar__inner) {
  border-radius: 5px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
}

.percentage {
  font-weight: 500;
  color: #67c23a;
}

.percentage.warning {
  color: #e6a23c;
}

.percentage.exception {
  color: #f56c6c;
}

.remaining {
  color: var(--text-secondary, #909399);
}
</style>
