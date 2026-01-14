<template>
  <el-dialog
    v-model="visible"
    title="单次买入转换"
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
      <el-form-item label="资金来源" prop="sourceAccountId">
        <el-select v-model="form.sourceAccountId" placeholder="选择扣款账户" style="width: 100%">
          <el-option
            v-for="acc in sourceAccounts"
            :key="acc.id"
            :label="`${acc.name} (¥${acc.balance.toFixed(2)})`"
            :value="acc.id"
            :disabled="acc.id === form.targetAccountId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="目标账户" prop="targetAccountId">
        <el-select v-model="form.targetAccountId" placeholder="选择目标账户" style="width: 100%">
          <el-option
            v-for="acc in targetAccounts"
            :key="acc.id"
            :label="`${acc.name} (¥${acc.balance.toFixed(2)})`"
            :value="acc.id"
            :disabled="acc.id === form.sourceAccountId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="实际支付" prop="paidAmount">
        <el-input-number
          v-model="form.paidAmount"
          :min="0.01"
          :precision="2"
          :step="10"
          placeholder="实际支付金额"
          style="width: 100%"
        />
        <div class="form-tip">实际从账户扣除的金额</div>
      </el-form-item>

      <el-form-item label="获得金额" prop="investedAmount">
        <el-input-number
          v-model="form.investedAmount"
          :min="0.01"
          :precision="2"
          :step="10"
          placeholder="获得的投资金额"
          style="width: 100%"
        />
        <div class="form-tip">实际获得的投资金额（可能因优惠券等大于支付金额）</div>
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

      <!-- 折扣预览 -->
      <div v-if="form.paidAmount && form.investedAmount" class="discount-preview">
        <div class="preview-title">交易预览</div>
        <div class="preview-item">
          <span>折扣率</span>
          <span class="value" :class="{ discount: discountRate < 1 }">
            {{ (discountRate * 100).toFixed(2) }}%
          </span>
        </div>
        <div v-if="discountRate < 1" class="preview-item">
          <span>节省金额</span>
          <span class="value savings">¥ {{ savedAmount.toFixed(2) }}</span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="loading" @click="handleSubmit">
        确认买入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { autoInvestmentApi, accountApi } from '@/api';
import type { Account } from '@/types';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [];
}>();

const { isMobile } = useDevice();
const formRef = ref<FormInstance>();
const loading = ref(false);
const sourceAccounts = ref<Account[]>([]);
const targetAccounts = ref<Account[]>([]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({
  sourceAccountId: undefined as number | undefined,
  targetAccountId: undefined as number | undefined,
  paidAmount: undefined as number | undefined,
  investedAmount: undefined as number | undefined,
  date: new Date().toISOString().split('T')[0],
});

const rules: FormRules = {
  sourceAccountId: [{ required: true, message: '请选择资金来源账户', trigger: 'change' }],
  targetAccountId: [{ required: true, message: '请选择目标投资账户', trigger: 'change' }],
  paidAmount: [
    { required: true, message: '请输入实际支付金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' },
  ],
  investedAmount: [
    { required: true, message: '请输入获得投资金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' },
  ],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
};

const discountRate = computed(() => {
  if (!form.value.paidAmount || !form.value.investedAmount) return 1;
  return form.value.paidAmount / form.value.investedAmount;
});

const savedAmount = computed(() => {
  if (!form.value.paidAmount || !form.value.investedAmount) return 0;
  return form.value.investedAmount - form.value.paidAmount;
});

const loadAccounts = async () => {
  try {
    const accountRes = await accountApi.list() as unknown as { success: boolean; data: Account[] };

    if (accountRes.success && accountRes.data) {
      // 所有账户都可以作为来源和目标
      sourceAccounts.value = accountRes.data;
      targetAccounts.value = accountRes.data;
    }
  } catch (error) {
    console.error('加载账户列表失败:', error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    await autoInvestmentApi.oneTimeBuy({
      sourceAccountId: form.value.sourceAccountId!,
      targetAccountId: form.value.targetAccountId!,
      paidAmount: form.value.paidAmount!,
      investedAmount: form.value.investedAmount!,
      date: form.value.date,
    });

    const msg = discountRate.value < 1
      ? `买入成功，节省 ¥${savedAmount.value.toFixed(2)}`
      : '买入成功';
    ElMessage.success(msg);

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
    sourceAccountId: undefined,
    targetAccountId: undefined,
    paidAmount: undefined,
    investedAmount: undefined,
    date: new Date().toISOString().split('T')[0],
  };
};

watch(visible, (val) => {
  if (val) {
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

.discount-preview {
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

.preview-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.preview-item .value.discount {
  color: #67c23a;
}

.preview-item .value.savings {
  color: #67c23a;
}
</style>
