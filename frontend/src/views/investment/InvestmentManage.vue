<template>
  <div class="investment-page" :class="{ 'is-mobile': isMobile }">
    <!-- 投资概览 -->
    <div class="investment-overview">
      <div class="overview-card">
        <div class="overview-header">
          <h3 class="section-title">投资概览</h3>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加投资
          </el-button>
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="2" animated />
        </div>

        <div v-else class="overview-stats">
          <div class="stat-item">
            <span class="stat-label">总投入</span>
            <span class="stat-value">¥ {{ formatAmount(summary.totalCost) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前市值</span>
            <span class="stat-value highlight">¥ {{ formatAmount(summary.totalValue) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总盈亏</span>
            <span class="stat-value" :class="summary.totalProfit >= 0 ? 'profit-up' : 'profit-down'">
              {{ summary.totalProfit >= 0 ? '+' : '' }}¥ {{ formatAmount(summary.totalProfit) }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">收益率</span>
            <span class="stat-value" :class="summary.profitRate >= 0 ? 'profit-up' : 'profit-down'">
              {{ summary.profitRate >= 0 ? '+' : '' }}{{ summary.profitRate.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量更新净值按钮 -->
    <div v-if="accounts.length > 0" class="batch-actions">
      <el-button @click="showBatchUpdateDialog">
        <el-icon><Refresh /></el-icon>
        批量更新净值
      </el-button>
    </div>

    <!-- 投资账户列表 -->
    <div class="accounts-section">
      <el-empty v-if="!loading && accounts.length === 0" description="暂无投资账户">
        <el-button type="primary" @click="showAddDialog">添加投资账户</el-button>
      </el-empty>

      <div v-else class="accounts-grid">
        <InvestmentAccountCard
          v-for="account in accounts"
          :key="account.id"
          :account="account"
          @buy="handleBuy"
          @sell="handleSell"
          @update-value="handleUpdateValue"
          @click="showAccountDetail(account)"
        />
      </div>
    </div>

    <!-- 添加/编辑投资账户对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      :title="editingAccount ? '编辑投资账户' : '添加投资账户'"
      :width="isMobile ? '90%' : '500px'"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
        :label-position="isMobile ? 'top' : 'right'"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="addForm.name" placeholder="如：招商中证白酒" />
        </el-form-item>

        <template v-if="!editingAccount">
          <el-form-item label="初始份额" prop="shares">
            <el-input-number
              v-model="addForm.shares"
              :min="0"
              :precision="4"
              :step="1"
              placeholder="持仓份额"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="成本价" prop="costPrice">
            <el-input-number
              v-model="addForm.costPrice"
              :min="0.0001"
              :precision="4"
              :step="0.01"
              placeholder="每份成本价"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="当前净值" prop="currentNetValue">
            <el-input-number
              v-model="addForm.currentNetValue"
              :min="0.0001"
              :precision="4"
              :step="0.01"
              placeholder="当前净值"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <el-form-item label="图标">
          <el-input v-model="addForm.icon" placeholder="可选，如 📈" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button
          v-if="editingAccount"
          type="danger"
          @click="handleDelete"
          :loading="deleteLoading"
        >
          删除
        </el-button>
        <el-button type="primary" @click="handleAddSubmit" :loading="addLoading">
          {{ editingAccount ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 买入/卖出表单 -->
    <InvestmentForm
      v-model="tradeDialogVisible"
      :account="selectedAccount"
      :initial-type="tradeType"
      @success="loadData"
    />

    <!-- 净值更新（单个） -->
    <NetValueUpdateSheet
      v-model="updateValueDialogVisible"
      :account="selectedAccount"
      @success="loadData"
    />

    <!-- 批量净值更新 -->
    <NetValueUpdateSheet
      v-model="batchUpdateDialogVisible"
      :accounts="accounts"
      @success="loadData"
    />

    <!-- 账户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="selectedAccount?.name || '账户详情'"
      :width="isMobile ? '90%' : '600px'"
    >
      <div v-if="selectedAccount" class="account-detail">
        <div class="detail-section">
          <h4>持仓信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">持仓份额</span>
              <span class="value">{{ selectedAccount.shares.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">成本价</span>
              <span class="value">¥ {{ selectedAccount.costPrice.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">当前净值</span>
              <span class="value">¥ {{ selectedAccount.currentNetValue.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">当前市值</span>
              <span class="value highlight">¥ {{ selectedAccount.balance.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">持仓成本</span>
              <span class="value">¥ {{ selectedAccount.totalCost.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">盈亏金额</span>
              <span class="value" :class="selectedAccount.profit >= 0 ? 'profit-up' : 'profit-down'">
                {{ selectedAccount.profit >= 0 ? '+' : '' }}¥ {{ selectedAccount.profit.toFixed(2) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="label">收益率</span>
              <span class="value" :class="selectedAccount.profitRate >= 0 ? 'profit-up' : 'profit-down'">
                {{ selectedAccount.profitRate >= 0 ? '+' : '' }}{{ selectedAccount.profitRate.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <div v-if="accountDetail?.valuationHistory?.length" class="detail-section">
          <h4>估值历史</h4>
          <div class="valuation-list">
            <div
              v-for="record in accountDetail.valuationHistory.slice(0, 10)"
              :key="record.id"
              class="valuation-item"
            >
              <span class="date">{{ record.date }}</span>
              <span class="net-value">净值: ¥{{ record.netValue.toFixed(4) }}</span>
              <span class="market-value">市值: ¥{{ record.marketValue.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button @click="handleEditAccount">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import { investmentApi } from '@/api';
import { InvestmentAccountCard, InvestmentForm, NetValueUpdateSheet } from '@/components/investment';
import type { InvestmentAccount, InvestmentAccountDetail, InvestmentSummary } from '@/types';

const { isMobile } = useDevice();

const loading = ref(false);
const accounts = ref<InvestmentAccount[]>([]);
const summary = reactive({
  totalCost: 0,
  totalValue: 0,
  totalProfit: 0,
  profitRate: 0,
});

// 添加/编辑对话框
const addDialogVisible = ref(false);
const addFormRef = ref<FormInstance>();
const addLoading = ref(false);
const deleteLoading = ref(false);
const editingAccount = ref<InvestmentAccount | null>(null);
const addForm = reactive({
  name: '',
  shares: 0,
  costPrice: 0,
  currentNetValue: 0,
  icon: '',
});

const addFormRules: FormRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  shares: [{ required: true, message: '请输入份额', trigger: 'blur' }],
  costPrice: [{ required: true, message: '请输入成本价', trigger: 'blur' }],
  currentNetValue: [{ required: true, message: '请输入当前净值', trigger: 'blur' }],
};

// 交易对话框
const tradeDialogVisible = ref(false);
const tradeType = ref<'buy' | 'sell'>('buy');
const selectedAccount = ref<InvestmentAccount | undefined>();

// 净值更新对话框
const updateValueDialogVisible = ref(false);
const batchUpdateDialogVisible = ref(false);

// 详情对话框
const detailDialogVisible = ref(false);
const accountDetail = ref<InvestmentAccountDetail | null>(null);

const formatAmount = (amount: number) => {
  return Math.abs(amount).toFixed(2);
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await investmentApi.list() as unknown as { success: boolean; data: InvestmentSummary };
    if (res.success && res.data) {
      accounts.value = res.data.accounts || [];
      summary.totalCost = res.data.totalCost;
      summary.totalValue = res.data.totalValue;
      summary.totalProfit = res.data.totalProfit;
      summary.profitRate = res.data.profitRate;
    }
  } catch (error) {
    console.error('加载投资数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  editingAccount.value = null;
  Object.assign(addForm, {
    name: '',
    shares: 0,
    costPrice: 0,
    currentNetValue: 0,
    icon: '',
  });
  addDialogVisible.value = true;
};

const handleAddSubmit = async () => {
  if (!addFormRef.value) return;

  try {
    await addFormRef.value.validate();
  } catch {
    return;
  }

  addLoading.value = true;
  try {
    if (editingAccount.value) {
      await investmentApi.update(editingAccount.value.id, {
        name: addForm.name,
        icon: addForm.icon || undefined,
      });
      ElMessage.success('更新成功');
    } else {
      await investmentApi.create({
        name: addForm.name,
        shares: addForm.shares,
        costPrice: addForm.costPrice,
        currentNetValue: addForm.currentNetValue,
        icon: addForm.icon || undefined,
      });
      ElMessage.success('添加成功');
    }
    addDialogVisible.value = false;
    await loadData();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '操作失败');
  } finally {
    addLoading.value = false;
  }
};

const handleDelete = async () => {
  if (!editingAccount.value) return;

  try {
    await ElMessageBox.confirm(
      '删除后将无法恢复，确定要删除该投资账户吗？',
      '确认删除',
      { type: 'warning' }
    );
  } catch {
    return;
  }

  deleteLoading.value = true;
  try {
    await investmentApi.delete(editingAccount.value.id);
    ElMessage.success('删除成功');
    addDialogVisible.value = false;
    detailDialogVisible.value = false;
    await loadData();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

const handleBuy = (account: InvestmentAccount) => {
  selectedAccount.value = account;
  tradeType.value = 'buy';
  tradeDialogVisible.value = true;
};

const handleSell = (account: InvestmentAccount) => {
  selectedAccount.value = account;
  tradeType.value = 'sell';
  tradeDialogVisible.value = true;
};

const handleUpdateValue = (account: InvestmentAccount) => {
  selectedAccount.value = account;
  updateValueDialogVisible.value = true;
};

const showBatchUpdateDialog = () => {
  batchUpdateDialogVisible.value = true;
};

const showAccountDetail = async (account: InvestmentAccount) => {
  selectedAccount.value = account;
  detailDialogVisible.value = true;

  try {
    const res = await investmentApi.getById(account.id) as unknown as { success: boolean; data: InvestmentAccountDetail };
    if (res.success && res.data) {
      accountDetail.value = res.data;
    }
  } catch (error) {
    console.error('加载账户详情失败:', error);
  }
};

const handleEditAccount = () => {
  if (!selectedAccount.value) return;
  editingAccount.value = selectedAccount.value;
  Object.assign(addForm, {
    name: selectedAccount.value.name,
    icon: selectedAccount.value.icon || '',
  });
  detailDialogVisible.value = false;
  addDialogVisible.value = true;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.investment-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.investment-page.is-mobile {
  padding: 16px;
}

.investment-overview {
  margin-bottom: 20px;
}

.overview-card {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  padding: 24px;
  color: #fff;
}

.is-mobile .overview-card {
  padding: 16px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.overview-header .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

.overview-header .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.is-mobile .overview-stats {
  grid-template-columns: repeat(2, 1fr);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.is-mobile .stat-value {
  font-size: 16px;
}

.stat-value.highlight {
  color: #ffd93d;
}

.stat-value.profit-up {
  color: #fff;
}

.stat-value.profit-down {
  color: #ff4d4f;
}

.batch-actions {
  margin-bottom: 16px;
}

.accounts-section {
  margin-bottom: 20px;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.is-mobile .accounts-grid {
  grid-template-columns: 1fr;
}

.loading-state {
  padding: 20px 0;
}

/* 详情对话框样式 */
.account-detail {
  padding: 0 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  color: #909399;
  font-size: 14px;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.detail-item .value.highlight {
  color: #11998e;
}

.detail-item .value.profit-up {
  color: #67c23a;
}

.detail-item .value.profit-down {
  color: #f56c6c;
}

.valuation-list {
  max-height: 200px;
  overflow-y: auto;
}

.valuation-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.valuation-item:last-child {
  border-bottom: none;
}

.valuation-item .date {
  color: #909399;
}

.valuation-item .net-value,
.valuation-item .market-value {
  color: #606266;
}
</style>
