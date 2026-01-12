<template>
  <SwipeAction
    :right-actions="rightActions"
    @click="$emit('click', transaction)"
  >
    <div class="transaction-card">
      <div class="transaction-card__icon" :class="`transaction-card__icon--${transaction.type}`">
        <el-icon><Folder /></el-icon>
      </div>
      <div class="transaction-card__content">
        <div class="transaction-card__main">
          <span class="transaction-card__category">
            {{ transaction.category?.name || '未分类' }}
          </span>
          <span
            class="transaction-card__amount"
            :class="`transaction-card__amount--${transaction.type}`"
          >
            {{ transaction.type === 'income' ? '+' : '-' }}¥{{ formatAmount(transaction.amount) }}
          </span>
        </div>
        <div class="transaction-card__sub">
          <span class="transaction-card__note">{{ transaction.note || '-' }}</span>
          <span class="transaction-card__date">{{ formatDate(transaction.date) }}</span>
        </div>
      </div>
    </div>
  </SwipeAction>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Folder, Edit, Delete } from '@element-plus/icons-vue'
import SwipeAction from './SwipeAction.vue'
import type { Transaction } from '@/types'
import type { SwipeActionItem } from './SwipeAction.vue'

interface Props {
  transaction: Transaction
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<{
  click: [transaction: Transaction]
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

// 右滑操作按钮
const rightActions = computed<SwipeActionItem[]>(() => {
  if (!props.showActions) return []
  
  return [
    {
      text: '编辑',
      icon: Edit,
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
      onClick: () => emit('edit', props.transaction)
    },
    {
      text: '删除',
      icon: Delete,
      backgroundColor: 'var(--color-danger)',
      color: '#fff',
      onClick: () => emit('delete', props.transaction)
    }
  ]
})

// 格式化金额
const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2)
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}
</script>

<style scoped>
.transaction-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-card);
  min-height: var(--touch-target-min);
}

.transaction-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.transaction-card__icon--expense {
  background: rgba(245, 108, 108, 0.1);
  color: var(--color-danger);
}

.transaction-card__icon--income {
  background: rgba(103, 194, 58, 0.1);
  color: var(--color-success);
}

.transaction-card__content {
  flex: 1;
  min-width: 0;
}

.transaction-card__main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.transaction-card__category {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.transaction-card__amount {
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.transaction-card__amount--expense {
  color: var(--color-danger);
}

.transaction-card__amount--income {
  color: var(--color-success);
}

.transaction-card__sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-card__note {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: var(--spacing-sm);
}

.transaction-card__date {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
