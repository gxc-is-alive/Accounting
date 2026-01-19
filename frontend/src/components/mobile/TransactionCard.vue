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
            <!-- 退款标识 -->
            <el-tag v-if="transaction.type === 'refund'" type="warning" size="small" class="transaction-card__refund-tag">
              退款
            </el-tag>
            <!-- 附件图标 -->
            <span v-if="hasAttachments" class="transaction-card__attachment-icon" title="有附件">📎</span>
          </span>
          <span
            class="transaction-card__amount"
            :class="`transaction-card__amount--${transaction.type}`"
          >
            {{ amountPrefix }}¥{{ formatAmount(transaction.amount) }}
          </span>
        </div>
        <div class="transaction-card__sub">
          <span class="transaction-card__note">{{ displayNote }}</span>
          <span class="transaction-card__date">{{ formatDate(transaction.date) }}</span>
        </div>
      </div>
      <!-- 操作按钮区域 -->
      <div v-if="showActions" class="transaction-card__actions">
        <button
          class="transaction-card__action-btn transaction-card__action-btn--edit"
          @click.stop="emit('edit', transaction)"
          aria-label="编辑"
        >
          <el-icon :size="20"><Edit /></el-icon>
        </button>
        <button
          class="transaction-card__action-btn transaction-card__action-btn--delete"
          @click.stop="emit('delete', transaction)"
          aria-label="删除"
        >
          <el-icon :size="20"><Delete /></el-icon>
        </button>
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
  hasAttachments?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  hasAttachments: false
})

const emit = defineEmits<{
  click: [transaction: Transaction]
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()

// 金额前缀
const amountPrefix = computed(() => {
  switch (props.transaction.type) {
    case 'income':
    case 'refund':
      return '+'
    default:
      return '-'
  }
})

// 显示备注（退款交易显示原交易信息）
const displayNote = computed(() => {
  if (props.transaction.type === 'refund' && props.transaction.originalTransaction) {
    return `退款自: ${props.transaction.originalTransaction.category?.name || '未知'}`
  }
  return props.transaction.note || '-'
})

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

.transaction-card__icon--refund {
  background: rgba(230, 162, 60, 0.1);
  color: var(--color-warning);
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

.transaction-card__amount--refund {
  color: var(--color-warning);
}

.transaction-card__refund-tag {
  margin-left: 4px;
  vertical-align: middle;
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

.transaction-card__attachment-icon {
  margin-left: 4px;
  font-size: 12px;
}

/* 操作按钮区域 */
.transaction-card__actions {
  display: flex;
  gap: 8px;
  margin-left: var(--spacing-sm);
  flex-shrink: 0;
}

.transaction-card__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.transaction-card__action-btn:active {
  transform: scale(0.95);
}

.transaction-card__action-btn--edit {
  color: var(--color-primary, #409eff);
}

.transaction-card__action-btn--edit:hover {
  background: rgba(64, 158, 255, 0.1);
}

.transaction-card__action-btn--edit:active {
  background: rgba(64, 158, 255, 0.2);
}

.transaction-card__action-btn--delete {
  color: var(--color-danger, #f56c6c);
}

.transaction-card__action-btn--delete:hover {
  background: rgba(245, 108, 108, 0.1);
}

.transaction-card__action-btn--delete:active {
  background: rgba(245, 108, 108, 0.2);
}

/* 确保触摸设备上有足够的点击区域 */
@media (hover: none) {
  .transaction-card__action-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* 小屏幕优化 */
@media (max-width: 360px) {
  .transaction-card {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .transaction-card__actions {
    gap: 4px;
    margin-left: 4px;
  }
  
  .transaction-card__action-btn {
    width: 40px;
    height: 40px;
  }
  
  .transaction-card__category {
    font-size: 14px;
  }
  
  .transaction-card__amount {
    font-size: 15px;
  }
}
</style>
