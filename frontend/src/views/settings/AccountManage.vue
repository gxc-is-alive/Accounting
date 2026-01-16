<template>
  <div class="account-manage-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">账户管理</h3>
        <el-button type="primary" @click="handleAddAccount">
          <el-icon><Plus /></el-icon>
          {{ isMobile ? '' : '添加账户' }}
        </el-button>
      </div>

      <el-empty v-if="!accounts.length" description="暂无账户，点击上方按钮添加" />

      <!-- 移动端列表 -->
      <div v-else-if="isMobile" class="account-list-mobile">
        <!-- 信用账户单独展示 -->
        <template v-if="creditAccounts.length">
          <div class="section-label">信用账户</div>
          <CreditAccountCard
            v-for="account in creditAccounts"
            :key="account.id"
            :account="account"
            @repay="goToRepayment(account)"
            @detail="handleAccountClick(account)"
          />
        </template>

        <!-- 普通账户 -->
        <template v-if="normalAccounts.length">
          <div class="section-label">普通账户</div>
          <SwipeAction
            v-for="account in normalAccounts"
            :key="account.id"
            :actions="swipeActions"
            @action="(action: { key: string }) => handleSwipeAction(action, account)"
          >
            <div class="account-card-mobile" @click="handleAccountClick(account)">
              <div class="account-icon">
                <el-icon size="24"><Wallet /></el-icon>
              </div>
              <div class="account-info">
                <div class="account-name">{{ account.name }}</div>
                <div class="account-type">{{ accountTypeLabels[account.type] }}</div>
              </div>
              <div class="account-balance-mobile">
                <span class="balance-value">¥ {{ account.balance.toFixed(2) }}</span>
              </div>
            </div>
          </SwipeAction>
        </template>
      </div>

      <!-- 桌面端列表 -->
      <div v-else class="account-list">
        <!-- 信用账户 -->
        <template v-if="creditAccounts.length">
          <div class="section-label">信用账户</div>
          <div class="credit-cards-grid">
            <CreditAccountCard
              v-for="account in creditAccounts"
              :key="account.id"
              :account="account"
              @repay="goToRepayment(account)"
              @detail="handleEdit(account)"
            />
          </div>
        </template>

        <!-- 普通账户 -->
        <template v-if="normalAccounts.length">
          <div class="section-label">普通账户</div>
          <div v-for="account in normalAccounts" :key="account.id" class="account-card">
            <div class="account-info">
              <div class="account-icon">
                <el-icon size="24"><Wallet /></el-icon>
              </div>
              <div class="account-detail">
                <div class="account-name">{{ account.name }}</div>
                <div class="account-type">{{ accountTypeLabels[account.type] }}</div>
              </div>
            </div>
            <div class="account-balance">
              <div class="balance-label">余额</div>
              <div class="balance-value">¥ {{ account.balance.toFixed(2) }}</div>
            </div>
            <div class="account-actions">
              <el-button type="success" link @click="handleQuickBalance(account)">平账</el-button>
              <el-button type="primary" link @click="handleEdit(account)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(account)">删除</el-button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 桌面端对话框 -->
    <el-dialog v-if="!isMobile" v-model="dialogVisible" :title="isEdit ? '编辑账户' : '添加账户'" width="450px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="form.name" placeholder="如：招商银行" />
        </el-form-item>
        <el-form-item label="账户类型" prop="type">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%" @change="onTypeChange">
            <el-option
              v-for="(label, value) in accountTypeLabels"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <!-- 非信用卡账户显示初始余额 -->
        <el-form-item v-if="!isEdit && form.type !== 'credit'" label="初始余额" prop="initialBalance">
          <el-input-number
            v-model="form.initialBalance"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <!-- 信用账户额外字段 -->
        <template v-if="form.type === 'credit'">
          <el-form-item label="信用额度" prop="creditLimit">
            <el-input-number
              v-model="form.creditLimit"
              :min="0"
              :precision="2"
              placeholder="信用额度"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="账单日" prop="billingDay">
            <el-select v-model="form.billingDay" placeholder="选择账单日" style="width: 100%">
              <el-option v-for="day in 28" :key="day" :label="`每月${day}日`" :value="day" />
            </el-select>
          </el-form-item>
          <el-form-item label="还款日" prop="dueDay">
            <el-select v-model="form.dueDay" placeholder="选择还款日" style="width: 100%">
              <el-option v-for="day in 28" :key="day" :label="`每月${day}日`" :value="day" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动端账户详情（备用，实际会导航到编辑页面） -->
    <BottomSheet
      v-if="isMobile && !isMobile"
      v-model:visible="detailVisible"
      title="账户详情"
    >
      <div v-if="selectedAccount" class="account-detail-sheet">
        <div class="detail-header">
          <div class="detail-icon" :class="{ 'credit-icon': selectedAccount.type === 'credit' }">
            <el-icon size="32"><CreditCard v-if="selectedAccount.type === 'credit'" /><Wallet v-else /></el-icon>
          </div>
          <div class="detail-name">{{ selectedAccount.name }}</div>
          <div class="detail-type">{{ accountTypeLabels[selectedAccount.type] }}</div>
        </div>
        <div class="detail-balance">
          <span class="label">当前余额</span>
          <span class="value">¥ {{ selectedAccount.balance.toFixed(2) }}</span>
        </div>
        <!-- 信用账户额外信息 -->
        <template v-if="selectedAccount.type === 'credit'">
          <div class="detail-credit-info">
            <div class="credit-info-item">
              <span class="label">信用额度</span>
              <span class="value">¥ {{ (selectedAccount.creditLimit ?? 0).toFixed(2) }}</span>
            </div>
            <div class="credit-info-item">
              <span class="label">账单日</span>
              <span class="value">每月{{ selectedAccount.billingDay }}日</span>
            </div>
            <div class="credit-info-item">
              <span class="label">还款日</span>
              <span class="value">每月{{ selectedAccount.dueDay }}日</span>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="handleEdit(selectedAccount!)" style="flex: 1">编辑</el-button>
          <el-button type="danger" @click="handleDelete(selectedAccount!)" style="flex: 1">删除</el-button>
        </div>
      </template>
    </BottomSheet>

    <!-- 快速平账对话框 -->
    <QuickBalanceForm
      v-model="quickBalanceVisible"
      :account="quickBalanceAccount"
      @success="handleQuickBalanceSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Wallet, CreditCard } from '@element-plus/icons-vue';
import { useAccountStore } from '@/stores/account';
import { useDevice } from '@/composables/useDevice';
import SwipeAction from '@/components/mobile/SwipeAction.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import CreditAccountCard from '@/components/credit/CreditAccountCard.vue';
import QuickBalanceForm from '@/components/account/QuickBalanceForm.vue';
import type { Account, AccountType } from '@/types';

const router = useRouter();
const { isMobile } = useDevice();
const accountStore = useAccountStore();
const accounts = computed(() => accountStore.accounts);

// 快速平账
const quickBalanceVisible = ref(false);
const quickBalanceAccount = ref<Account | undefined>(undefined);

function handleQuickBalance(account: Account) {
  quickBalanceAccount.value = account;
  quickBalanceVisible.value = true;
}

function handleQuickBalanceSuccess() {
  accountStore.fetchAccounts();
}

// 分离信用账户和普通账户
const creditAccounts = computed(() => accounts.value.filter(a => a.type === 'credit'));
const normalAccounts = computed(() => accounts.value.filter(a => a.type !== 'credit'));

const detailVisible = ref(false);
const selectedAccount = ref<Account | null>(null);

// 滑动操作
const swipeActions = [
  { key: 'balance', text: '平账', color: '#67c23a' },
  { key: 'edit', text: '编辑', color: '#409eff' },
  { key: 'delete', text: '删除', color: '#f56c6c' }
];

function handleSwipeAction(action: { key: string }, account: Account) {
  if (action.key === 'balance') {
    handleQuickBalance(account);
  } else if (action.key === 'edit') {
    navigateToEditAccount(account);
  } else if (action.key === 'delete') {
    handleDelete(account);
  }
}

// 移动端导航到编辑页面
function navigateToEditAccount(account: Account) {
  router.push(`/settings/accounts/form/${account.id}`);
}

// 移动端导航到添加页面
function navigateToAddAccount() {
  router.push('/settings/accounts/form');
}

// 处理添加账户按钮点击
function handleAddAccount() {
  if (isMobile.value) {
    navigateToAddAccount();
  } else {
    showAddDialog();
  }
}

// 处理账户点击
function handleAccountClick(account: Account) {
  if (isMobile.value) {
    navigateToEditAccount(account);
  } else {
    showAccountDetail(account);
  }
}

function showAccountDetail(account: Account) {
  selectedAccount.value = account;
  detailVisible.value = true;
}

function goToRepayment(account: Account) {
  router.push({ name: 'CreditRepayment', query: { accountId: account.id } });
}

const accountTypeLabels: Record<AccountType, string> = {
  cash: '现金',
  bank: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  credit: '信用卡',
  investment: '投资账户',
  other: '其他',
};

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
  name: '',
  type: 'bank' as AccountType,
  initialBalance: 0,
  // 信用账户字段
  creditLimit: 0,
  billingDay: 1,
  dueDay: 20,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
  creditLimit: [{ required: true, message: '请输入信用额度', trigger: 'blur' }],
  billingDay: [{ required: true, message: '请选择账单日', trigger: 'change' }],
  dueDay: [{ required: true, message: '请选择还款日', trigger: 'change' }],
};

const onTypeChange = (type: AccountType) => {
  // 切换到信用账户时设置默认值
  if (type === 'credit') {
    form.creditLimit = form.creditLimit || 10000;
    form.billingDay = form.billingDay || 1;
    form.dueDay = form.dueDay || 20;
    // 信用卡初始余额强制为0
    form.initialBalance = 0;
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  editId.value = null;
  form.name = '';
  form.type = 'bank';
  form.initialBalance = 0;
  form.creditLimit = 10000;
  form.billingDay = 1;
  form.dueDay = 20;
  dialogVisible.value = true;
};

const handleEdit = (account: Account) => {
  isEdit.value = true;
  editId.value = account.id;
  form.name = account.name;
  form.type = account.type;
  form.creditLimit = account.creditLimit ?? 10000;
  form.billingDay = account.billingDay ?? 1;
  form.dueDay = account.dueDay ?? 20;
  detailVisible.value = false;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  // 移动端没有 formRef，需要手动验证
  if (isMobile.value) {
    // 简单验证：账户名称必填
    if (!form.name.trim()) {
      ElMessage.error('请输入账户名称');
      return;
    }
  } else {
    // 桌面端使用 el-form 验证
    if (!formRef.value) return;
    try {
      await formRef.value.validate();
    } catch {
      return;
    }
  }
  
  submitting.value = true;
  try {
    const data: Partial<Account> = {
      name: form.name,
      type: form.type,
    };

    // 信用账户额外字段
    if (form.type === 'credit') {
      data.creditLimit = form.creditLimit;
      data.billingDay = form.billingDay;
      data.dueDay = form.dueDay;
    }

    if (isEdit.value && editId.value) {
      await accountStore.updateAccount(editId.value, data);
      ElMessage.success('更新成功');
    } else {
      // 信用卡账户初始余额强制为0
      (data as Record<string, unknown>).initialBalance = form.type === 'credit' ? 0 : form.initialBalance;
      await accountStore.createAccount(data);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (account: Account) => {
  try {
    await ElMessageBox.confirm(`确定要删除账户"${account.name}"吗？`, '提示', {
      type: 'warning',
    });
    await accountStore.deleteAccount(account.id);
    ElMessage.success('删除成功');
    detailVisible.value = false;
  } catch {
    // 取消删除
  }
};

onMounted(() => {
  accountStore.fetchAccounts();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #909399;
  margin: 16px 0 12px;
}

.section-label:first-child {
  margin-top: 0;
}

.credit-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.account-list {
  display: grid;
  gap: 16px;
}

.account-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.account-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.account-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.account-type {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.account-balance {
  text-align: right;
  margin-right: 24px;
}

.balance-label {
  font-size: 13px;
  color: #909399;
}

.balance-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: row;
  justify-content: space-between;
}

.account-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-card-mobile {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  gap: 12px;
}

.account-card-mobile .account-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.account-card-mobile .account-info {
  flex: 1;
  min-width: 0;
}

.account-card-mobile .account-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.account-card-mobile .account-type {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.account-balance-mobile {
  text-align: right;
}

.account-balance-mobile .balance-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.mobile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-form .form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-form .form-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.mobile-form-footer {
  display: flex;
  gap: 12px;
}

.account-detail-sheet {
  text-align: center;
}

.detail-header {
  padding: 20px 0;
}

.detail-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.detail-icon.credit-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.detail-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-type {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.detail-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-top: 16px;
}

.detail-balance .label {
  color: #909399;
}

.detail-balance .value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.detail-credit-info {
  margin-top: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
}

.credit-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.credit-info-item:last-child {
  border-bottom: none;
}

.credit-info-item .label {
  color: #909399;
  font-size: 14px;
}

.credit-info-item .value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .account-manage-page .page-card {
    padding: 16px;
  }
}
</style>
