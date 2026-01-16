<template>
  <div class="account-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-button class="back-btn" :icon="ArrowLeft" link @click="goBack" />
      <h3 class="page-title">{{ isEdit ? '编辑账户' : '添加账户' }}</h3>
      <div class="header-placeholder"></div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 表单内容 -->
    <div v-else class="form-content">
      <div class="form-card">
        <div class="form-item">
          <label class="form-label required">账户名称</label>
          <el-input
            v-model="form.name"
            placeholder="如：招商银行"
            maxlength="50"
            show-word-limit
          />
        </div>

        <div class="form-item">
          <label class="form-label required">账户类型</label>
          <el-select
            v-model="form.type"
            placeholder="选择类型"
            :teleported="false"
            style="width: 100%"
            @change="onTypeChange"
          >
            <el-option
              v-for="(label, value) in accountTypeLabels"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </div>

        <!-- 非信用卡账户显示初始余额 -->
        <div v-if="!isEdit && form.type !== 'credit'" class="form-item">
          <label class="form-label required">初始余额</label>
          <el-input
            v-model.number="form.initialBalance"
            type="number"
            inputmode="decimal"
            placeholder="请输入金额"
          />
        </div>

        <!-- 信用账户额外字段 -->
        <template v-if="form.type === 'credit'">
          <div class="form-item">
            <label class="form-label required">信用额度</label>
            <el-input
              v-model.number="form.creditLimit"
              type="number"
              inputmode="decimal"
              placeholder="请输入信用额度"
            />
          </div>
          <div class="form-item">
            <label class="form-label required">账单日</label>
            <el-select
              v-model="form.billingDay"
              placeholder="选择账单日"
              :teleported="false"
              style="width: 100%"
            >
              <el-option v-for="day in 28" :key="day" :label="`每月${day}日`" :value="day" />
            </el-select>
          </div>
          <div class="form-item">
            <label class="form-label required">还款日</label>
            <el-select
              v-model="form.dueDay"
              placeholder="选择还款日"
              :teleported="false"
              style="width: 100%"
            >
              <el-option v-for="day in 28" :key="day" :label="`每月${day}日`" :value="day" />
            </el-select>
          </div>
        </template>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button
          type="primary"
          size="large"
          :loading="submitting"
          :disabled="submitting"
          class="action-btn"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存修改' : '添加账户' }}
        </el-button>

        <el-button
          v-if="isEdit"
          type="danger"
          size="large"
          plain
          class="action-btn delete-btn"
          @click="handleDelete"
        >
          删除账户
        </el-button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { useAccountStore } from '@/stores/account';
import type { Account, AccountType } from '@/types';

const router = useRouter();
const route = useRoute();
const accountStore = useAccountStore();

// 路由参数
const accountId = computed(() => route.params.id ? Number(route.params.id) : null);
const isEdit = computed(() => accountId.value !== null);

// 状态
const loading = ref(false);
const submitting = ref(false);

// 账户类型标签
const accountTypeLabels: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  credit: '信用卡',
  investment: '投资账户',
  other: '其他',
};

// 表单数据
const form = reactive({
  name: '',
  type: 'bank' as AccountType,
  initialBalance: 0,
  creditLimit: 10000,
  billingDay: 1,
  dueDay: 20,
});

// 类型切换时设置默认值
const onTypeChange = (type: AccountType) => {
  if (type === 'credit') {
    form.creditLimit = form.creditLimit || 10000;
    form.billingDay = form.billingDay || 1;
    form.dueDay = form.dueDay || 20;
    // 信用卡初始余额强制为0
    form.initialBalance = 0;
  }
};

// 返回上一页
const goBack = () => {
  router.push('/settings/accounts');
};

// 加载账户数据（编辑模式）
const loadAccountData = async () => {
  if (!isEdit.value || !accountId.value) return;

  loading.value = true;
  try {
    await accountStore.fetchAccounts();
    const account = accountStore.accounts.find(a => a.id === accountId.value);
    
    if (!account) {
      ElMessage.error('账户不存在');
      goBack();
      return;
    }

    // 预填充表单
    form.name = account.name;
    form.type = account.type;
    form.creditLimit = account.creditLimit ?? 10000;
    form.billingDay = account.billingDay ?? 1;
    form.dueDay = account.dueDay ?? 20;
  } catch (error) {
    ElMessage.error('加载账户数据失败');
    goBack();
  } finally {
    loading.value = false;
  }
};

// 表单验证
const validateForm = (): boolean => {
  if (!form.name.trim()) {
    ElMessage.error('请输入账户名称');
    return false;
  }
  if (form.name.length > 50) {
    ElMessage.error('账户名称不能超过50个字符');
    return false;
  }
  if (!isEdit.value && form.initialBalance < 0) {
    ElMessage.error('初始余额不能为负数');
    return false;
  }
  if (form.type === 'credit') {
    if (form.creditLimit <= 0) {
      ElMessage.error('请输入有效的信用额度');
      return false;
    }
  }
  return true;
};

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  try {
    const data: Partial<Account> = {
      name: form.name,
      type: form.type,
    };

    if (form.type === 'credit') {
      data.creditLimit = form.creditLimit;
      data.billingDay = form.billingDay;
      data.dueDay = form.dueDay;
    }

    if (isEdit.value && accountId.value) {
      await accountStore.updateAccount(accountId.value, data);
      ElMessage.success('更新成功');
    } else {
      // 信用卡账户初始余额强制为0
      (data as Record<string, unknown>).initialBalance = form.type === 'credit' ? 0 : form.initialBalance;
      await accountStore.createAccount(data);
      ElMessage.success('添加成功');
    }
    goBack();
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 删除账户
const handleDelete = async () => {
  if (!accountId.value) return;

  try {
    await ElMessageBox.confirm('确定要删除这个账户吗？删除后无法恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    });

    await accountStore.deleteAccount(accountId.value);
    ElMessage.success('删除成功');
    goBack();
  } catch {
    // 用户取消删除
  }
};

onMounted(() => {
  loadAccountData();
});
</script>


<style scoped>
.account-form-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  font-size: 20px;
  padding: 8px;
}

.page-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-placeholder {
  width: 36px;
}

.loading-state {
  padding: 20px 16px;
}

.form-content {
  padding: 16px;
}

.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-label.required::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.form-actions {
  margin-top: 24px;
  padding: 0 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
}

:deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  height: 44px;
}

:deep(.el-button--large) {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}
</style>
