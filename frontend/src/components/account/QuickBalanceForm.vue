<template>
  <el-dialog
    v-model="visible"
    title="快速平账"
    :width="isMobile ? '90%' : '450px'"
    @close="handleClose"
  >
    <div class="balance-info">
      <div class="info-row">
        <span class="label">账户名称</span>
        <span class="value">{{ account?.name || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="label">当前余额</span>
        <span class="value current">¥{{ formatNumber(account?.balance || 0) }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item label="实际总额" prop="actualBalance">
        <el-input-number
          v-model="form.actualBalance"
          :min="0"
          :precision="2"
          :step="100"
          placeholder="请输入实际总额"
          style="width: 100%"
          @change="handleActualBalanceChange"
        />
      </el-form-item>

      <div v-if="preview" class="preview-section">
        <div class="preview-row">
          <span class="label">差额</span>
          <span :class="['value', preview.differenceType]">
            {{ preview.difference >= 0 ? '+' : '' }}¥{{ formatNumber(preview.difference) }}
          </span>
        </div>
        <div class="preview-row">
          <span class="label">类型</span>
          <el-tag :type="getDifferenceTagType(preview.differenceType)" size="small">
            {{ getDifferenceLabel(preview.differenceType) }}
          </el-tag>
        </div>
      </div>

      <el-form-item label="备注" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="可选，记录平账原因"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="!canSubmit || loading"
        @click="handleSubmit"
      >
        确认平账
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { accountApi } from '@/api';
import type { Account, BalancePreviewResponse, DifferenceType } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  account?: Account;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [];
}>();

const { isMobile } = useDevice();
const formRef = ref<FormInstance>();
const loading = ref(false);
const preview = ref<BalancePreviewResponse | null>(null);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({
  actualBalance: undefined as number | undefined,
  note: '',
});

const rules: FormRules = {
  actualBalance: [
    { required: true, message: '请输入实际总额', trigger: 'blur' },
    { type: 'number', min: 0, message: '实际总额不能为负数', trigger: 'blur' },
  ],
};

const canSubmit = computed(() => {
  return form.value.actualBalance !== undefined && 
         form.value.actualBalance >= 0 &&
         preview.value !== null &&
         preview.value.differenceType !== 'none';
});

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getDifferenceTagType = (type: DifferenceType) => {
  switch (type) {
    case 'profit': return 'success';
    case 'loss': return 'danger';
    default: return 'info';
  }
};

const getDifferenceLabel = (type: DifferenceType) => {
  switch (type) {
    case 'profit': return '盈余';
    case 'loss': return '亏损';
    default: return '无变化';
  }
};

const handleActualBalanceChange = async (val: number | undefined) => {
  if (val === undefined || val < 0 || !props.account) {
    preview.value = null;
    return;
  }

  // 本地计算预览，无需调用API
  const currentBalance = props.account.balance;
  const difference = val - currentBalance;
  let differenceType: DifferenceType = 'none';
  if (difference > 0) differenceType = 'profit';
  else if (difference < 0) differenceType = 'loss';

  preview.value = {
    accountId: props.account.id,
    accountName: props.account.name,
    currentBalance,
    actualBalance: val,
    difference,
    differenceType,
  };
};

const handleSubmit = async () => {
  if (!formRef.value || !props.account) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const res = await accountApi.executeQuickBalance(props.account.id, {
      actualBalance: form.value.actualBalance!,
      note: form.value.note || undefined,
    }) as unknown as { success: boolean; message?: string };

    if (res.success) {
      ElMessage.success('平账成功');
      emit('success');
      handleClose();
    } else {
      ElMessage.error(res.message || '平账失败');
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '平账失败');
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
    actualBalance: undefined,
    note: '',
  };
  preview.value = null;
};

watch(visible, (val) => {
  if (val && props.account) {
    // 初始化时设置当前余额为默认值
    form.value.actualBalance = props.account.balance;
    handleActualBalanceChange(props.account.balance);
  } else {
    resetForm();
  }
});
</script>

<style scoped>
.balance-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #e4e7ed;
}

.info-row .label {
  color: #909399;
  font-size: 14px;
}

.info-row .value {
  font-size: 14px;
  font-weight: 500;
}

.info-row .value.current {
  color: #409eff;
  font-size: 18px;
}

.preview-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.preview-row .label {
  color: #606266;
  font-size: 14px;
}

.preview-row .value {
  font-size: 16px;
  font-weight: 600;
}

.preview-row .value.profit {
  color: #67c23a;
}

.preview-row .value.loss {
  color: #f56c6c;
}

.preview-row .value.none {
  color: #909399;
}
</style>
