<template>
  <el-dialog
    v-model="visible"
    title="更新净值"
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
      <!-- 单个账户更新 -->
      <template v-if="account">
        <div class="account-info-header">
          <div class="account-name">{{ account.name }}</div>
          <div class="current-value">
            当前净值：¥ {{ account.currentNetValue.toFixed(4) }}
          </div>
        </div>

        <el-form-item label="新净值" prop="netValue">
          <el-input-number
            v-model="form.netValue"
            :min="0.0001"
            :precision="4"
            :step="0.01"
            placeholder="请输入新净值"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 更新预览 -->
        <div v-if="form.netValue" class="update-preview">
          <div class="preview-title">更新预览</div>
          <div class="preview-item">
            <span>新市值</span>
            <span class="value">¥ {{ newMarketValue.toFixed(2) }}</span>
          </div>
          <div class="preview-item">
            <span>市值变化</span>
            <span :class="marketValueChange >= 0 ? 'profit-up' : 'profit-down'">
              {{ marketValueChange >= 0 ? '+' : '' }}¥ {{ marketValueChange.toFixed(2) }}
            </span>
          </div>
          <div class="preview-item">
            <span>新盈亏</span>
            <span :class="newProfit >= 0 ? 'profit-up' : 'profit-down'">
              {{ newProfit >= 0 ? '+' : '' }}¥ {{ newProfit.toFixed(2) }}
            </span>
          </div>
        </div>
      </template>

      <!-- 批量更新 -->
      <template v-else-if="accounts.length > 0">
        <div class="batch-update-list">
          <div
            v-for="(item, index) in batchForm"
            :key="item.accountId"
            class="batch-item"
          >
            <div class="batch-item-header">
              <span class="account-name">{{ getAccountName(item.accountId) }}</span>
              <span class="current-value">
                当前：¥ {{ getAccountNetValue(item.accountId).toFixed(4) }}
              </span>
            </div>
            <el-input-number
              v-model="batchForm[index].netValue"
              :min="0.0001"
              :precision="4"
              :step="0.01"
              placeholder="新净值"
              style="width: 100%"
            />
          </div>
        </div>
      </template>

      <el-form-item label="估值日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认更新
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { investmentApi } from '@/api';
import type { InvestmentAccount } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  account?: InvestmentAccount; // 单个账户更新
  accounts?: InvestmentAccount[]; // 批量更新
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  success: [];
}>();

const { isMobile } = useDevice();
const formRef = ref<FormInstance>();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const form = ref({
  netValue: undefined as number | undefined,
  date: new Date().toISOString().split('T')[0],
});

const batchForm = ref<Array<{ accountId: number; netValue: number | undefined }>>([]);

const rules: FormRules = {
  netValue: [
    { required: true, message: '请输入净值', trigger: 'blur' },
    { type: 'number', min: 0.0001, message: '净值必须大于0', trigger: 'blur' },
  ],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
};

const accounts = computed(() => props.accounts || []);

const newMarketValue = computed(() => {
  if (!props.account || !form.value.netValue) return 0;
  return props.account.shares * form.value.netValue;
});

const marketValueChange = computed(() => {
  if (!props.account) return 0;
  return newMarketValue.value - props.account.balance;
});

const newProfit = computed(() => {
  if (!props.account) return 0;
  return newMarketValue.value - props.account.totalCost;
});

const getAccountName = (accountId: number) => {
  const acc = accounts.value.find(a => a.id === accountId);
  return acc?.name || '';
};

const getAccountNetValue = (accountId: number) => {
  const acc = accounts.value.find(a => a.id === accountId);
  return acc?.currentNetValue || 0;
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    if (props.account) {
      // 单个账户更新
      if (!form.value.netValue) {
        ElMessage.error('请输入净值');
        return;
      }
      await investmentApi.updateNetValue(props.account.id, {
        netValue: form.value.netValue,
        date: form.value.date,
      });
      ElMessage.success('净值更新成功');
    } else if (accounts.value.length > 0) {
      // 批量更新
      const validUpdates = batchForm.value.filter(item => item.netValue && item.netValue > 0);
      if (validUpdates.length === 0) {
        ElMessage.error('请至少输入一个有效的净值');
        return;
      }
      await investmentApi.updateNetValueBatch({
        valuations: validUpdates.map(item => ({
          accountId: item.accountId,
          netValue: item.netValue!,
        })),
        date: form.value.date,
      });
      ElMessage.success(`成功更新 ${validUpdates.length} 个账户的净值`);
    }
    emit('success');
    handleClose();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '更新失败');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  form.value = {
    netValue: undefined,
    date: new Date().toISOString().split('T')[0],
  };
  batchForm.value = [];
};

watch(visible, (val) => {
  if (val) {
    if (props.account) {
      form.value.netValue = props.account.currentNetValue;
    } else if (accounts.value.length > 0) {
      batchForm.value = accounts.value.map(acc => ({
        accountId: acc.id,
        netValue: acc.currentNetValue,
      }));
    }
  }
});
</script>

<style scoped>
.account-info-header {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.account-info-header .account-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.account-info-header .current-value {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.update-preview {
  background: #f0f9eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
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

.batch-update-list {
  max-height: 400px;
  overflow-y: auto;
}

.batch-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.batch-item:last-child {
  margin-bottom: 20px;
}

.batch-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.batch-item-header .account-name {
  font-weight: 500;
  color: #303133;
}

.batch-item-header .current-value {
  font-size: 12px;
  color: #909399;
}
</style>
