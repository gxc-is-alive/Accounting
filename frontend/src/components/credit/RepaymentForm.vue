<template>
  <div class="repayment-form" :class="{ 'is-mobile': isMobile }">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-width="isMobile ? '0' : '100px'"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item label="信用账户" prop="creditAccountId">
        <el-select
          v-model="form.creditAccountId"
          placeholder="选择信用账户"
          style="width: 100%"
          :teleported="!isMobile"
          @change="onCreditAccountChange"
        >
          <el-option
            v-for="account in creditAccounts"
            :key="account.id"
            :label="account.name"
            :value="account.id"
          >
            <div class="account-option">
              <span>{{ account.name }}</span>
              <span class="outstanding">待还 ¥{{ (account.creditLimit ?? 0).toFixed(2) }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="还款来源" prop="sourceAccountId">
        <el-select
          v-model="form.sourceAccountId"
          placeholder="选择还款账户"
          style="width: 100%"
          :teleported="!isMobile"
        >
          <el-option
            v-for="account in sourceAccounts"
            :key="account.id"
            :label="account.name"
            :value="account.id"
          >
            <div class="account-option">
              <span>{{ account.name }}</span>
              <span class="balance">余额 ¥{{ account.balance.toFixed(2) }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="还款金额" prop="amount">
        <div class="amount-input-wrapper">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :max="maxRepayAmount"
            :precision="2"
            :controls="false"
            placeholder="输入还款金额"
            style="width: 100%"
          />
          <el-button
            v-if="selectedCreditAccount"
            type="primary"
            link
            class="full-repay-btn"
            @click="setFullRepay"
          >
            全额还款
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="还款日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          :teleported="!isMobile"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="可选备注"
        />
      </el-form-item>
    </el-form>

    <!-- 还款预览 -->
    <div v-if="form.creditAccountId && form.sourceAccountId && form.amount" class="repay-preview">
      <div class="preview-title">还款预览</div>
      <div class="preview-item">
        <span>还款后待还金额</span>
        <span class="value">¥ {{ previewOutstanding.toFixed(2) }}</span>
      </div>
      <div class="preview-item">
        <span>还款后来源余额</span>
        <span class="value">¥ {{ previewSourceBalance.toFixed(2) }}</span>
      </div>
    </div>

    <div class="form-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确认还款
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useDevice } from '@/composables/useDevice';
import { useAccountStore } from '@/stores/account';
import { repaymentApi, accountApi } from '@/api';
import type { Account, CreditAccountDetails } from '@/types';

const props = defineProps<{
  initialCreditAccountId?: number;
  categoryId: number;
}>();

const emit = defineEmits<{
  cancel: [];
  success: [];
}>();

const { isMobile } = useDevice();
const accountStore = useAccountStore();
const formRef = ref<FormInstance>();
const submitting = ref(false);

// 信用账户详情缓存
const creditDetailsMap = ref<Map<number, CreditAccountDetails>>(new Map());

const form = reactive({
  creditAccountId: props.initialCreditAccountId ?? null as number | null,
  sourceAccountId: null as number | null,
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  note: '',
});

const rules: FormRules = {
  creditAccountId: [{ required: true, message: '请选择信用账户', trigger: 'change' }],
  sourceAccountId: [{ required: true, message: '请选择还款来源账户', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入还款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' },
  ],
  date: [{ required: true, message: '请选择还款日期', trigger: 'change' }],
};

// 信用账户列表
const creditAccounts = computed(() =>
  accountStore.accounts.filter(a => a.type === 'credit')
);

// 非信用账户列表（作为还款来源）
const sourceAccounts = computed(() =>
  accountStore.accounts.filter(a => a.type !== 'credit')
);

// 选中的信用账户
const selectedCreditAccount = computed(() =>
  creditAccounts.value.find(a => a.id === form.creditAccountId)
);

// 选中的来源账户
const selectedSourceAccount = computed(() =>
  sourceAccounts.value.find(a => a.id === form.sourceAccountId)
);

// 获取信用账户的待还金额
const getOutstandingBalance = (accountId: number): number => {
  return creditDetailsMap.value.get(accountId)?.outstandingBalance ?? 0;
};

// 最大可还款金额
const maxRepayAmount = computed(() => {
  const sourceBalance = selectedSourceAccount.value?.balance ?? 0;
  const outstanding = form.creditAccountId ? getOutstandingBalance(form.creditAccountId) : 0;
  // 确保 max 至少为 0.01，避免 min > max 的错误
  const max = Math.min(sourceBalance > 0 ? sourceBalance : Infinity, outstanding > 0 ? outstanding : Infinity);
  return max > 0 ? max : 999999999;
});

// 预览：还款后待还金额
const previewOutstanding = computed(() => {
  if (!form.creditAccountId) return 0;
  const outstanding = getOutstandingBalance(form.creditAccountId);
  return Math.max(0, outstanding - (form.amount || 0));
});

// 预览：还款后来源余额
const previewSourceBalance = computed(() => {
  const balance = selectedSourceAccount.value?.balance ?? 0;
  return Math.max(0, balance - (form.amount || 0));
});

// 加载信用账户详情
const loadCreditDetails = async (accountId: number) => {
  try {
    const res = await accountApi.getCreditDetails(accountId) as unknown as { success: boolean; data: CreditAccountDetails };
    if (res.success && res.data) {
      creditDetailsMap.value.set(accountId, res.data);
    }
  } catch (error) {
    console.error('加载信用账户详情失败:', error);
  }
};

// 信用账户变更时加载详情
const onCreditAccountChange = async (accountId: number) => {
  if (accountId && !creditDetailsMap.value.has(accountId)) {
    await loadCreditDetails(accountId);
  }
};

// 设置全额还款
const setFullRepay = () => {
  if (form.creditAccountId) {
    const outstanding = getOutstandingBalance(form.creditAccountId);
    const sourceBalance = selectedSourceAccount.value?.balance ?? 0;
    form.amount = Math.min(outstanding, sourceBalance);
  }
};

// 提交还款
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const res = await repaymentApi.create({
        creditAccountId: form.creditAccountId!,
        sourceAccountId: form.sourceAccountId!,
        amount: form.amount,
        date: form.date,
        note: form.note || undefined,
        categoryId: props.categoryId,
      }) as unknown as { success: boolean; data: { error?: string } };

      if (res.success) {
        ElMessage.success('还款成功');
        // 刷新账户列表
        await accountStore.fetchAccounts();
        emit('success');
      } else {
        ElMessage.error(res.data?.error || '还款失败');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      ElMessage.error(err.message || '还款失败');
    } finally {
      submitting.value = false;
    }
  });
};

onMounted(async () => {
  await accountStore.fetchAccounts();
  // 预加载所有信用账户详情
  for (const account of creditAccounts.value) {
    await loadCreditDetails(account.id);
  }
  // 如果有初始信用账户，加载其详情
  if (props.initialCreditAccountId) {
    await loadCreditDetails(props.initialCreditAccountId);
  }
});
</script>

<style scoped>
.repayment-form {
  padding: 16px;
}

.repayment-form.is-mobile {
  padding: 0;
}

.account-option {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.account-option .outstanding {
  color: #f56c6c;
  font-size: 12px;
}

.account-option .balance {
  color: #67c23a;
  font-size: 12px;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.amount-input-wrapper .el-input-number {
  flex: 1;
}

.full-repay-btn {
  white-space: nowrap;
}

.repay-preview {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
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
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item .value {
  font-weight: 500;
  color: #303133;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.is-mobile .form-actions {
  justify-content: stretch;
}

.is-mobile .form-actions .el-button {
  flex: 1;
}
</style>
