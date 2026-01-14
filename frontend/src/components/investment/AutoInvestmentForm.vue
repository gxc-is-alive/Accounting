<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑定投计划' : '新建定投计划'"
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
      <el-form-item label="计划名称" prop="name">
        <el-input v-model="form.name" placeholder="如：每月定投沪深300" maxlength="100" />
      </el-form-item>

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

      <el-form-item label="定投金额" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="0.01"
          :precision="2"
          :step="100"
          placeholder="请输入金额"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="执行频率" prop="frequency">
        <el-radio-group v-model="form.frequency" @change="handleFrequencyChange">
          <el-radio-button value="daily">每日</el-radio-button>
          <el-radio-button value="weekly">每周</el-radio-button>
          <el-radio-button value="monthly">每月</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.frequency === 'weekly'" label="执行日" prop="executionDay">
        <el-select v-model="form.executionDay" placeholder="选择周几" style="width: 100%">
          <el-option label="周一" :value="1" />
          <el-option label="周二" :value="2" />
          <el-option label="周三" :value="3" />
          <el-option label="周四" :value="4" />
          <el-option label="周五" :value="5" />
          <el-option label="周六" :value="6" />
          <el-option label="周日" :value="7" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.frequency === 'monthly'" label="执行日" prop="executionDay">
        <el-select v-model="form.executionDay" placeholder="选择日期" style="width: 100%">
          <el-option v-for="d in 31" :key="d" :label="`${d}日`" :value="d" />
        </el-select>
        <div class="form-tip">如当月无该日期，将在当月最后一天执行</div>
      </el-form-item>

      <el-form-item label="执行时间" prop="executionTime">
        <el-time-picker
          v-model="executionTimeValue"
          format="HH:mm"
          placeholder="选择时间"
          style="width: 100%"
          @change="handleTimeChange"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" :disabled="loading" @click="handleSubmit">
        {{ isEdit ? '保存' : '创建' }}
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
import type { AutoInvestmentPlan, Account } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  plan?: AutoInvestmentPlan;
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

const isEdit = computed(() => !!props.plan);

const form = ref({
  name: '',
  sourceAccountId: undefined as number | undefined,
  targetAccountId: undefined as number | undefined,
  amount: undefined as number | undefined,
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
  executionDay: 1,
  executionTime: '09:00',
});

const executionTimeValue = ref<Date | null>(null);

const rules: FormRules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  sourceAccountId: [{ required: true, message: '请选择资金来源账户', trigger: 'change' }],
  targetAccountId: [{ required: true, message: '请选择目标投资账户', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入定投金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' },
  ],
  frequency: [{ required: true, message: '请选择执行频率', trigger: 'change' }],
  executionDay: [{ required: true, message: '请选择执行日', trigger: 'change' }],
};

const handleFrequencyChange = () => {
  if (form.value.frequency === 'weekly') {
    form.value.executionDay = 1;
  } else if (form.value.frequency === 'monthly') {
    form.value.executionDay = 1;
  }
};

const handleTimeChange = (val: Date | null) => {
  if (val) {
    const hours = val.getHours().toString().padStart(2, '0');
    const minutes = val.getMinutes().toString().padStart(2, '0');
    form.value.executionTime = `${hours}:${minutes}`;
  }
};

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
    const params = {
      name: form.value.name,
      sourceAccountId: form.value.sourceAccountId!,
      targetAccountId: form.value.targetAccountId!,
      amount: form.value.amount!,
      frequency: form.value.frequency,
      executionDay: form.value.frequency !== 'daily' ? form.value.executionDay : undefined,
      executionTime: form.value.executionTime,
    };

    if (isEdit.value && props.plan) {
      await autoInvestmentApi.updatePlan(props.plan.id, params);
      ElMessage.success('定投计划更新成功');
    } else {
      await autoInvestmentApi.createPlan(params);
      ElMessage.success('定投计划创建成功');
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
  resetForm();
};

const resetForm = () => {
  form.value = {
    name: '',
    sourceAccountId: undefined,
    targetAccountId: undefined,
    amount: undefined,
    frequency: 'monthly',
    executionDay: 1,
    executionTime: '09:00',
  };
  executionTimeValue.value = null;
};

watch(visible, (val) => {
  if (val) {
    loadAccounts();
    if (props.plan) {
      form.value = {
        name: props.plan.name,
        sourceAccountId: props.plan.sourceAccountId,
        targetAccountId: props.plan.targetAccountId,
        amount: props.plan.amount,
        frequency: props.plan.frequency,
        executionDay: props.plan.executionDay || 1,
        executionTime: props.plan.executionTime,
      };
      const [hours, minutes] = props.plan.executionTime.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      executionTimeValue.value = timeDate;
    } else {
      resetForm();
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0);
      executionTimeValue.value = defaultTime;
    }
  }
});
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
