<template>
  <el-button
    v-if="canRefund"
    type="warning"
    size="small"
    :loading="loading"
    @click="handleClick"
  >
    <el-icon><RefreshLeft /></el-icon>
    退款
  </el-button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import { refundApi } from '@/api'
import type { Transaction } from '@/types'

interface Props {
  transaction: Transaction
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [transaction: Transaction, refundableAmount: number]
}>()

const loading = ref(false)
const refundableAmount = ref(0)

// 只有支出类型的交易才能退款
const canRefund = computed(() => {
  return props.transaction.type === 'expense' && refundableAmount.value > 0
})

const fetchRefundableAmount = async () => {
  if (props.transaction.type !== 'expense') return
  
  loading.value = true
  try {
    const res = await refundApi.getRefundableAmount(props.transaction.id)
    if (res.data.success && res.data.data) {
      refundableAmount.value = res.data.data.refundableAmount
    }
  } catch (error) {
    console.error('获取可退款金额失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClick = () => {
  emit('click', props.transaction, refundableAmount.value)
}

onMounted(() => {
  fetchRefundableAmount()
})

// 暴露刷新方法
defineExpose({
  refresh: fetchRefundableAmount
})
</script>
