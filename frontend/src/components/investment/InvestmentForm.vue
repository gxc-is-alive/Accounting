<template>
  <el-dialog
    v-model="visible"
    :title="formTitle"
    :width="isMobile ? '90%' : '500px'"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item label="操作类型">
        <el-radio-group v-model="form.type" @change="handleTypeChange">
          <el-radio-button value="buy">买入</el-radio-button>
          <el-radio-button value="sell">卖出</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="份额" prop="shares">
        <el-input-number
          v-model="form.shares"
          :min="0.01"
          :precision="4"
          :step="1"
          placeholder="请输入份额"
          style="width: 100%"
        />
        <div v-if="form.type === 'sell' && account" class="form-tip">
          可卖出份额：{{ account.shares.toFixed(4) }}
        </div>
      </el-form-item>

      <el-form-item label="价格" prop="price">
        <el-input-number
          v-model="form.price"
          :min="0.0001"
          :precision="4"
          :step="0.01"
          placeholder="请输入价格"
          style="width: 100%"
        />
        <div v-if="account" class="form-tip">
          当前净值：{{ account.currentNetValue.toFixed(4) }}
        </div>
      </el-form-item>

      <el-form-item label="交易日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item v-if="form.type === 'buy'" label="资金来源">
        <el-select
          v-model="form.sourceAccountId"
          placeholder="选择资金来源账户（可选）"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="acc in availableAccounts"
            :key="acc.id"
            :label="`${acc.name} (¥${acc.balance.toFixed(2)})`"
            :value="acc.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.type === 'sell'" label="资金转入">
        <el-select
          v-model="form.targetAccountId"
          placeholder="选择资金转入账户（可选）"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="acc in availableAccounts"
            :key="acc.id"
            :label="acc.name"
            :value="acc.id"
          />
        </el-select>
      </el-form-item>

      <!-- 交易预览 -->
      <div v-if="form.shares && form.price" class="trade-preview">
        <div class="preview-title">交易预览</div>
        <div class="preview-item">
          <span>交易金额</span>
          <span class="amount">¥ {{ tradeAmount.toFixed(2) }}</span>
        </div>
        <div v-if="form.type === 'sell' && account" class="preview-item">
          <span>预计盈亏</span>
          <span :class="estimatedProfit >= 0 ? 'profit-up' : 'profit-down'">
            {{ estimatedProfit >= 0 ? '+' : '' }}¥ {{ estimatedProfit.toFixed(2) }}
          </span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认{{ form.type === 'buy' ? '买入' : '卖出' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { investmentApi, accountApi } from '@/api';
import type { InvestmentAccount, Account } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  account?: InvestmentAccount;
  initialType?: 'buy' | 'sell';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [];
}>();

const { isMobile } = useDevice();
const formRef = ref<FormInstance>();
const loading = ref(false);
const availableAccounts = ref<Account[]>([]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({
  type: 'buy' as 'buy' | 'sell',
  shares: undefined as number | undefined,
  price: undefined as number | undefined,
  date: new Date().toISOString().split('T')[0],
  sourceAccountId: undefined as number | undefined,
  targetAccountId: undefined as number | undefined,
});

const rules: FormRules = {
  shares: [
    { required: true, message: '请输入份额', trigger: 'blur' },
    { type: 'number', min: 0.0001, message: '份额必须大于0', trigger: 'blur' },
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0.0001, message: '价格必须大于0', trigger: 'blur' },
  ],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
};

const formTitle = computed(() => {
  if (!props.account) return '交易';
  return `${props.account.name} - ${form.value.type === 'buy' ? '买入' : '卖出'}`;
});

const tradeAmount = computed(() => {
  return (form.value.shares || 0) * (form.value.price || 0);
});

const estimatedProfit = computed(() => {
  if (!props.account || form.value.type !== 'sell') return 0;
  const shares = form.value.shares || 0;
  const price = form.value.price || 0;
  return shares * (price - props.account.costPrice);
});

const handleTypeChange = () => {
  form.value.sourceAccountId = undefined;
  form.value.targetAccountId = undefined;
};

const loadAccounts = async () => {
  try {
    const res = await accountApi.list() as unknown as { success: boolean; data: Account[] };
    if (res.success && res.data) {
      // 过滤掉投资账户
      availableAccounts.value = res.data.filter(acc => acc.type !== 'investment');
    }
  } catch (error) {
    console.error('加载账户列表失败:', error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value || !props.account) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  // 卖出时验证份额
  if (form.value.type === 'sell' && (form.value.shares || 0) > props.account.shares) {
    ElMessage.error('卖出份额不能超过持仓份额');
    return;
  }

  loading.value = true;
  try {
    if (form.value.type === 'buy') {
      await investmentApi.buy(props.account.id, {
        shares: form.value.shares!,
        price: form.value.price!,
        date: form.value.date,
        sourceAccountId: form.value.sourceAccountId,
      });
      ElMessage.success('买入成功');
    } else {
      const res = await investmentApi.sell(props.account.id, {
        shares: form.value.shares!,
        price: form.value.price!,
        date: form.value.date,
        targetAccountId: form.value.targetAccountId,
      }) as unknown as { success: boolean; data: { realizedProfit?: number } };
      if (res.success && res.data?.realizedProfit !== undefined) {
        const profit = res.data.realizedProfit;
        ElMessage.success(`卖出成功，实现盈亏：${profit >= 0 ? '+' : ''}¥${profit.toFixed(2)}`);
      } else {
        ElMessage.success('卖出成功');
      }
    }
    emit('success');
    handleClose();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  form.value = {
    type: 'buy',
    shares: undefined,
    price: undefined,
    date: new Date().toISOString().split('T')[0],
    sourceAccountId: undefined,
    targetAccountId: undefined,
  };
};

watch(visible, (val) => {
  if (val) {
    form.value.type = props.initialType || 'buy';
    if (props.account) {
      form.value.price = props.account.currentNetValue;
    }
    loadAccounts();
  }
});
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.trade-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item span:first-child {
  color: #606266;
}

.preview-item .amount {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.preview-item .profit-up {
  color: #67c23a;
  font-weight: 600;
}

.preview-item .profit-down {
  color: #f56c6c;
  font-weight: 600;
}
</style>
