<template>
  <div class="refund-form">
    <!-- 原交易信息 -->
    <div class="original-info">
      <div class="info-header">原交易信息</div>
      <div class="info-row">
        <span class="info-label">分类</span>
        <span class="info-value">{{ transaction.category?.name || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">金额</span>
        <span class="info-value amount-expense">¥{{ transaction.amount.toFixed(2) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">日期</span>
        <span class="info-value">{{ transaction.date }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">备注</span>
        <span class="info-value">{{ transaction.note || '-' }}</span>
      </div>
    </div>

    <!-- 退款信息 -->
    <div class="refund-info">
      <div class="info-row highlight">
        <span class="info-label">可退款金额</span>
        <span class="info-value amount-success">¥{{ refundableAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 退款表单 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="form-content"
    >
      <el-form-item label="退款金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :max="refundableAmount"
          :precision="2"
          :step="1"
          style="width: 100%"
        />
        <div class="quick-amount">
          <el-button size="small" text @click="form.amount = refundableAmount">
            全额退款
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="退款日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="退款原因（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <!-- 已退款记录 -->
    <div v-if="refunds.length > 0" class="refund-history">
      <div class="info-header">退款记录</div>
      <div v-for="refund in refunds" :key="refund.id" class="refund-item">
        <div class="refund-item-main">
          <span class="refund-amount">+¥{{ refund.amount.toFixed(2) }}</span>
          <span class="refund-date">{{ refund.date }}</span>
        </div>
        <div v-if="refund.note" class="refund-note">{{ refund.note }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { refundApi } from '@/api'
import type { Transaction, CreateRefundParams } from '@/types'

interface Props {
  transaction: Transaction
  initialRefundableAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialRefundableAmount: 0
})

const emit = defineEmits<{
  submit: [data: CreateRefundParams]
}>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const refundableAmount = ref(props.initialRefundableAmount)
const refunds = ref<Transaction[]>([])

const form = reactive({
  amount: props.initialRefundableAmount,
  date: new Date().toISOString().split('T')[0],
  note: ''
})

const rules: FormRules = {
  amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('退款金额必须大于0'))
        } else if (value > refundableAmount.value) {
          callback(new Error(`退款金额不能超过可退款金额 ¥${refundableAmount.value.toFixed(2)}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  date: [
    { required: true, message: '请选择退款日期', trigger: 'change' }
  ]
}

// 获取退款信息
const fetchRefundInfo = async () => {
  loading.value = true
  try {
    const res = await refundApi.getTransactionRefunds(props.transaction.id)
    if (res.data.success && res.data.data) {
      refundableAmount.value = res.data.data.refundableAmount
      refunds.value = res.data.data.refunds || []
      // 更新表单默认金额
      if (form.amount === 0 || form.amount > refundableAmount.value) {
        form.amount = refundableAmount.value
      }
    }
  } catch (error) {
    console.error('获取退款信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 提交表单
const submit = async () => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    emit('submit', {
      originalTransactionId: props.transaction.id,
      amount: form.amount,
      date: form.date,
      note: form.note || undefined
    })
    return true
  } catch {
    return false
  }
}

onMounted(() => {
  if (props.initialRefundableAmount === 0) {
    fetchRefundInfo()
  } else {
    // 如果有初始值，也获取完整信息（包括退款记录）
    fetchRefundInfo()
  }
})

// 暴露方法
defineExpose({
  submit,
  refresh: fetchRefundInfo
})
</script>

<style scoped>
.refund-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.original-info,
.refund-info,
.refund-history {
  background: var(--bg-page);
  border-radius: 8px;
  padding: var(--spacing-md);
}

.info-header {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.info-row.highlight {
  background: rgba(103, 194, 58, 0.1);
  padding: var(--spacing-sm);
  border-radius: 4px;
  margin: 0 calc(-1 * var(--spacing-sm));
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.amount-expense {
  color: var(--color-danger);
  font-weight: 500;
}

.amount-success {
  color: var(--color-success);
  font-weight: 600;
  font-size: 16px;
}

.form-content {
  margin-top: var(--spacing-sm);
}

.quick-amount {
  margin-top: var(--spacing-xs);
}

.refund-item {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.refund-item:last-child {
  border-bottom: none;
}

.refund-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refund-amount {
  color: var(--color-success);
  font-weight: 500;
}

.refund-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.refund-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
