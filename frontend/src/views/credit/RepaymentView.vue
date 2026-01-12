<template>
  <div class="repayment-page" :class="{ 'is-mobile': isMobile }">
    <!-- 信用账户概览 -->
    <div class="credit-overview">
      <div class="overview-header">
        <h3 class="section-title">信用账户</h3>
        <el-button type="primary" link @click="goToAccountManage">
          管理账户
        </el-button>
      </div>

      <el-empty v-if="!creditAccounts.length" description="暂无信用账户">
        <el-button type="primary" @click="goToAccountManage">添加信用账户</el-button>
      </el-empty>

      <div v-else class="credit-cards">
        <CreditAccountCard
          v-for="account in creditAccounts"
          :key="account.id"
          :account="account"
          @repay="openRepayDialog(account)"
          @detail="showAccountDetail(account)"
        />
      </div>
    </div>

    <!-- 还款提醒 -->
    <div class="page-card">
      <RepaymentReminder ref="reminderRef" @repay="openRepayFromReminder" />
    </div>

    <!-- 还款历史 -->
    <div class="page-card">
      <div class="section-header">
        <h3 class="section-title">还款历史</h3>
        <el-select
          v-model="historyFilter.creditAccountId"
          placeholder="全部账户"
          clearable
          size="small"
          style="width: 140px"
        >
          <el-option
            v-for="account in creditAccounts"
            :key="account.id"
            :label="account.name"
            :value="account.id"
          />
        </el-select>
      </div>

      <el-empty v-if="!repaymentHistory.length && !historyLoading" description="暂无还款记录" />

      <div v-else-if="historyLoading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else class="history-list">
        <div
          v-for="item in repaymentHistory"
          :key="item.id"
          class="history-item"
        >
          <div class="history-info">
            <div class="history-account">{{ getAccountName(item.accountId) }}</div>
            <div class="history-meta">
              <span>{{ formatDate(item.date) }}</span>
              <span v-if="item.sourceAccountId">
                · 来源: {{ getAccountName(item.sourceAccountId) }}
              </span>
            </div>
            <div v-if="item.note" class="history-note">{{ item.note }}</div>
          </div>
          <div class="history-amount">
            <span class="amount-value">-¥ {{ item.amount.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="historyTotal > historyFilter.pageSize" class="pagination">
        <el-pagination
          v-model:current-page="historyFilter.page"
          :page-size="historyFilter.pageSize"
          :total="historyTotal"
          layout="prev, pager, next"
          small
          @current-change="loadRepaymentHistory"
        />
      </div>
    </div>

    <!-- 桌面端还款对话框 -->
    <el-dialog
      v-if="!isMobile"
      v-model="repayDialogVisible"
      title="还款"
      width="500px"
    >
      <RepaymentForm
        v-if="repayDialogVisible"
        :initial-credit-account-id="selectedCreditAccountId"
        :category-id="defaultCategoryId"
        :bill-type-id="defaultBillTypeId"
        @cancel="repayDialogVisible = false"
        @success="onRepaySuccess"
      />
    </el-dialog>

    <!-- 移动端还款底部弹窗 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="repayDialogVisible"
      title="还款"
    >
      <RepaymentForm
        v-if="repayDialogVisible"
        :initial-credit-account-id="selectedCreditAccountId"
        :category-id="defaultCategoryId"
        :bill-type-id="defaultBillTypeId"
        @cancel="repayDialogVisible = false"
        @success="onRepaySuccess"
      />
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDevice } from '@/composables/useDevice';
import { useAccountStore } from '@/stores/account';
import { repaymentApi } from '@/api';
import CreditAccountCard from '@/components/credit/CreditAccountCard.vue';
import RepaymentForm from '@/components/credit/RepaymentForm.vue';
import RepaymentReminder from '@/components/credit/RepaymentReminder.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import type { Account, Transaction, DueReminder } from '@/types';

const router = useRouter();
const { isMobile } = useDevice();
const accountStore = useAccountStore();

const reminderRef = ref<InstanceType<typeof RepaymentReminder>>();
const repayDialogVisible = ref(false);
const selectedCreditAccountId = ref<number | undefined>();

// 默认分类和账单类型 ID（需要根据实际情况配置）
const defaultCategoryId = 1;
const defaultBillTypeId = 1;

// 信用账户列表
const creditAccounts = computed(() =>
  accountStore.accounts.filter(a => a.type === 'credit')
);

// 还款历史
const repaymentHistory = ref<Transaction[]>([]);
const historyLoading = ref(false);
const historyTotal = ref(0);
const historyFilter = reactive({
  creditAccountId: undefined as number | undefined,
  page: 1,
  pageSize: 10,
});

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getAccountName = (accountId: number) => {
  const account = accountStore.accounts.find(a => a.id === accountId);
  return account?.name || '未知账户';
};

const goToAccountManage = () => {
  router.push('/settings/accounts');
};

const openRepayDialog = (account: Account) => {
  selectedCreditAccountId.value = account.id;
  repayDialogVisible.value = true;
};

const openRepayFromReminder = (reminder: DueReminder) => {
  selectedCreditAccountId.value = reminder.accountId;
  repayDialogVisible.value = true;
};

const showAccountDetail = (account: Account) => {
  // 可以跳转到账户详情页或显示详情弹窗
  console.log('查看账户详情:', account);
};

const loadRepaymentHistory = async () => {
  historyLoading.value = true;
  try {
    const res = await repaymentApi.list({
      creditAccountId: historyFilter.creditAccountId,
      page: historyFilter.page,
      pageSize: historyFilter.pageSize,
    }) as unknown as { success: boolean; data: { items: Transaction[]; total: number } };

    if (res.success && res.data) {
      repaymentHistory.value = res.data.items || [];
      historyTotal.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('加载还款历史失败:', error);
  } finally {
    historyLoading.value = false;
  }
};

const onRepaySuccess = async () => {
  repayDialogVisible.value = false;
  // 刷新数据
  await Promise.all([
    accountStore.fetchAccounts(),
    loadRepaymentHistory(),
  ]);
  // 刷新提醒组件
  reminderRef.value?.refresh();
};

// 监听筛选条件变化
watch(() => historyFilter.creditAccountId, () => {
  historyFilter.page = 1;
  loadRepaymentHistory();
});

onMounted(async () => {
  await accountStore.fetchAccounts();
  await loadRepaymentHistory();
});
</script>

<style scoped>
.repayment-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.repayment-page.is-mobile {
  padding: 16px;
}

.credit-overview {
  margin-bottom: 20px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.is-mobile .section-title {
  font-size: 16px;
}

.credit-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.is-mobile .credit-cards {
  grid-template-columns: 1fr;
}

.page-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.is-mobile .page-card {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.loading-state {
  padding: 20px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-account {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.history-meta {
  font-size: 13px;
  color: #909399;
}

.history-note {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.history-amount {
  text-align: right;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
