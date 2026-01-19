<template>
  <div class="transaction-list-page" :class="{ 'transaction-list-page--mobile': isMobile }">
    <!-- 移动端布局 -->
    <template v-if="isMobile">
      <PullRefresh :loading="refreshing" @refresh="onRefresh">
        <div class="mobile-content">
          <!-- 筛选按钮 -->
          <div class="mobile-filter-bar">
            <el-button size="small" @click="showFilterSheet = true">
              <el-icon><Filter /></el-icon>
              筛选
            </el-button>
            <span class="filter-summary" v-if="hasFilters">
              已筛选
            </span>
          </div>

          <!-- 交易卡片列表 -->
          <div class="transaction-cards" v-if="transactions.length">
            <TransactionCard
              v-for="item in transactions"
              :key="item.id"
              :transaction="item"
              :has-attachments="!!(item.attachmentCount && item.attachmentCount > 0)"
              @click="handleCardClick"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </div>
          <el-empty v-else description="暂无交易记录" />

          <!-- 加载更多 -->
          <div class="load-more" v-if="hasMore">
            <el-button
              :loading="loadingMore"
              text
              @click="loadMore"
            >
              加载更多
            </el-button>
          </div>
        </div>
      </PullRefresh>

      <!-- 筛选面板 -->
      <BottomSheet v-model:visible="showFilterSheet" title="筛选条件">
        <div class="filter-form">
          <div class="filter-item">
            <label>日期范围</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              :teleported="false"
            />
          </div>
          <div class="filter-item">
            <label>类型</label>
            <el-radio-group v-model="filters.type">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="expense">支出</el-radio-button>
              <el-radio-button label="income">收入</el-radio-button>
              <el-radio-button label="refund">退款</el-radio-button>
            </el-radio-group>
          </div>
          <div class="filter-item">
            <label>分类</label>
            <el-select
              v-model="filters.categoryId"
              placeholder="全部分类"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </div>
        </div>
        <template #footer>
          <div class="filter-actions">
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="primary" @click="applyFilters">确定</el-button>
          </div>
        </template>
      </BottomSheet>

      <!-- 交易详情面板 -->
      <BottomSheet v-model:visible="showDetailSheet" title="交易详情">
        <div class="detail-content" v-if="selectedTransaction">
          <div class="detail-amount" :class="`detail-amount--${selectedTransaction.type}`">
            {{ getAmountPrefix(selectedTransaction) }}¥{{ selectedTransaction.amount.toFixed(2) }}
          </div>
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">类型</span>
              <span class="detail-value">
                <el-tag :type="getTypeTagType(selectedTransaction.type)" size="small">
                  {{ getTypeLabel(selectedTransaction.type) }}
                </el-tag>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分类</span>
              <span class="detail-value">{{ selectedTransaction.category?.name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">账户</span>
              <span class="detail-value">{{ selectedTransaction.account?.name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">日期</span>
              <span class="detail-value">{{ selectedTransaction.date }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">备注</span>
              <span class="detail-value">{{ selectedTransaction.note || '-' }}</span>
            </div>
            <!-- 退款交易显示原交易信息 -->
            <div class="detail-item" v-if="selectedTransaction.type === 'refund' && selectedTransaction.originalTransaction">
              <span class="detail-label">原交易</span>
              <span class="detail-value">
                {{ selectedTransaction.originalTransaction.category?.name || '-' }} - 
                ¥{{ selectedTransaction.originalTransaction.amount?.toFixed(2) }}
              </span>
            </div>
            <!-- 附件列表 -->
            <div class="detail-item detail-item--attachments" v-if="selectedTransaction.attachmentCount && selectedTransaction.attachmentCount > 0">
              <span class="detail-label">附件 ({{ selectedTransaction.attachmentCount }})</span>
              <div class="detail-attachments">
                <div v-if="loadingAttachments" class="attachments-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  加载中...
                </div>
                <AttachmentList
                  v-else-if="selectedAttachments.length > 0"
                  :attachments="selectedAttachments"
                  :readonly="true"
                />
                <span v-else class="no-attachments">暂无附件</span>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="detail-actions">
            <!-- 支出交易显示退款按钮 -->
            <el-button 
              v-if="selectedTransaction?.type === 'expense'" 
              type="warning" 
              @click="handleRefund(selectedTransaction!)"
            >
              退款
            </el-button>
            <el-button @click="handleEdit(selectedTransaction!)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(selectedTransaction!)">删除</el-button>
          </div>
        </template>
      </BottomSheet>

      <!-- 退款面板 -->
      <BottomSheet v-model:visible="showRefundSheet" title="申请退款">
        <RefundForm
          v-if="refundTransaction"
          ref="refundFormRef"
          :transaction="refundTransaction"
          @submit="submitRefund"
        />
        <template #footer>
          <div class="detail-actions">
            <el-button @click="showRefundSheet = false">取消</el-button>
            <el-button 
              type="primary" 
              :loading="refundSubmitting" 
              :disabled="!refundDataLoaded"
              @click="confirmRefund"
            >
              确认退款
            </el-button>
          </div>
        </template>
      </BottomSheet>
    </template>

    <!-- 桌面端布局 -->
    <template v-else>
      <div class="page-card">
        <div class="page-header">
          <h3 class="page-title">交易记录</h3>
          <el-button type="primary" @click="$router.push('/add')">
            <el-icon><Plus /></el-icon>
            记一笔
          </el-button>
        </div>

        <!-- 筛选条件 -->
        <div class="filter-section">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleFilter"
          />
          <el-select
            v-model="filters.type"
            placeholder="类型"
            clearable
            @change="handleFilter"
          >
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
            <el-option label="退款" value="refund" />
          </el-select>
          <el-select
            v-model="filters.categoryId"
            placeholder="分类"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <!-- 交易列表 -->
        <el-table :data="transactions" v-loading="loading" style="width: 100%">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="100">
            <template #default="{ row }">
              {{ row.category?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="账户" width="100">
            <template #default="{ row }">
              {{ row.account?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注" show-overflow-tooltip />
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">
              <span :class="row.type === 'income' ? 'amount-income' : 'amount-expense'">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </template>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑交易" :width="isMobile ? '90%' : '500px'">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="金额">
          <el-input-number v-model="editForm.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.categoryId" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.note" />
        </el-form-item>
        <el-form-item label="附件">
          <div v-if="loadingEditAttachments" class="attachments-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            加载中...
          </div>
          <AttachmentUpload v-else v-model="editAttachments" :max-count="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Filter, Loading } from '@element-plus/icons-vue';
import { useTransactionStore } from '@/stores/transaction';
import { useCategoryStore } from '@/stores/category';
import { useDevice } from '@/composables/useDevice';
import PullRefresh from '@/components/mobile/PullRefresh.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import TransactionCard from '@/components/mobile/TransactionCard.vue';
import AttachmentList from '@/components/attachment/AttachmentList.vue';
import AttachmentUpload from '@/components/attachment/AttachmentUpload.vue';
import { RefundForm } from '@/components/refund';
import { attachmentApi, refundApi } from '@/api';
import type { Transaction, TransactionFilters, Attachment, CreateRefundParams } from '@/types';

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();

const transactions = computed(() => transactionStore.transactions);
const total = computed(() => transactionStore.total);
const loading = computed(() => transactionStore.loading);
const categories = computed(() => categoryStore.categories);

const page = ref(1);
const pageSize = ref(20);
const dateRange = ref<[string, string] | null>(null);
const filters = reactive<TransactionFilters>({});

// 移动端状态
const refreshing = ref(false);
const loadingMore = ref(false);
const showFilterSheet = ref(false);
const showDetailSheet = ref(false);
const selectedTransaction = ref<Transaction | null>(null);
const selectedAttachments = ref<Attachment[]>([]);
const loadingAttachments = ref(false);

const hasFilters = computed(() => {
  return dateRange.value || filters.type || filters.categoryId;
});

const hasMore = computed(() => {
  return transactions.value.length < total.value;
});

const editDialogVisible = ref(false);
const editForm = reactive({
  id: 0,
  amount: 0,
  categoryId: null as number | null,
  date: '',
  note: '',
});
const editAttachments = ref<Attachment[]>([]);
const loadingEditAttachments = ref(false);
const submitting = ref(false);

// 退款相关状态
const showRefundSheet = ref(false);
const refundTransaction = ref<Transaction | null>(null);
const refundFormRef = ref<InstanceType<typeof RefundForm> | null>(null);
const refundSubmitting = ref(false);
const refundDataLoaded = computed(() => refundFormRef.value?.dataLoaded ?? false);

// 类型相关辅助函数
const getAmountPrefix = (transaction: Transaction) => {
  switch (transaction.type) {
    case 'income':
    case 'refund':
      return '+';
    default:
      return '-';
  }
};

const getTypeTagType = (type: string) => {
  switch (type) {
    case 'income':
      return 'success';
    case 'expense':
      return 'danger';
    case 'refund':
      return 'warning';
    default:
      return 'info';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'income':
      return '收入';
    case 'expense':
      return '支出';
    case 'refund':
      return '退款';
    case 'repayment':
      return '还款';
    default:
      return type;
  }
};

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true;
  try {
    page.value = 1;
    await transactionStore.fetchTransactions({ ...filters, page: 1, pageSize: pageSize.value });
  } finally {
    refreshing.value = false;
  }
};

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  try {
    page.value++;
    await transactionStore.loadMore({ ...filters, page: page.value, pageSize: pageSize.value });
  } finally {
    loadingMore.value = false;
  }
};

// 点击卡片显示详情
const handleCardClick = async (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  selectedAttachments.value = [];
  showDetailSheet.value = true;
  
  // 加载附件列表
  if (transaction.attachmentCount && transaction.attachmentCount > 0) {
    loadingAttachments.value = true;
    try {
      const attachments = await attachmentApi.listByTransaction(transaction.id);
      selectedAttachments.value = attachments;
    } catch (error) {
      console.error('加载附件失败:', error);
    } finally {
      loadingAttachments.value = false;
    }
  }
};

// 应用筛选
const applyFilters = () => {
  showFilterSheet.value = false;
  handleFilter();
};

// 筛选
const handleFilter = () => {
  const newFilters: TransactionFilters = { ...filters };
  if (dateRange.value) {
    newFilters.startDate = dateRange.value[0];
    newFilters.endDate = dateRange.value[1];
  }
  page.value = 1;
  transactionStore.fetchTransactions(newFilters);
};

// 重置筛选
const resetFilters = () => {
  dateRange.value = null;
  filters.type = undefined;
  filters.categoryId = undefined;
  page.value = 1;
  transactionStore.resetFilters();
  if (isMobile.value) {
    showFilterSheet.value = false;
  }
};

// 分页
const handlePageChange = (newPage: number) => {
  transactionStore.setPage(newPage);
};

// 编辑
const handleEdit = async (row: Transaction) => {
  showDetailSheet.value = false;
  editForm.id = row.id;
  editForm.amount = row.amount;
  editForm.categoryId = row.categoryId;
  editForm.date = row.date;
  editForm.note = row.note || '';
  editAttachments.value = [];
  editDialogVisible.value = true;
  
  // 加载已有附件
  if (row.attachmentCount && row.attachmentCount > 0) {
    loadingEditAttachments.value = true;
    try {
      const attachments = await attachmentApi.listByTransaction(row.id);
      editAttachments.value = attachments;
    } catch (error) {
      console.error('加载附件失败:', error);
    } finally {
      loadingEditAttachments.value = false;
    }
  }
};

// 提交编辑
const submitEdit = async () => {
  submitting.value = true;
  try {
    await transactionStore.updateTransaction(editForm.id, {
      amount: editForm.amount,
      categoryId: editForm.categoryId!,
      date: editForm.date,
      note: editForm.note,
    });
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || '更新失败');
  } finally {
    submitting.value = false;
  }
};

// 删除
const handleDelete = async (row: Transaction) => {
  showDetailSheet.value = false;
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning',
    });
    await transactionStore.deleteTransaction(row.id);
    ElMessage.success('删除成功');
  } catch {
    // 取消删除
  }
};

// 退款
const handleRefund = (transaction: Transaction) => {
  showDetailSheet.value = false;
  refundTransaction.value = transaction;
  showRefundSheet.value = true;
};

// 提交退款
const submitRefund = async (data: CreateRefundParams) => {
  refundSubmitting.value = true;
  try {
    await refundApi.create(data);
    ElMessage.success('退款成功');
    showRefundSheet.value = false;
    refundTransaction.value = null;
    // 刷新列表
    await transactionStore.fetchTransactions({ ...filters, page: page.value, pageSize: pageSize.value });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }, message?: string };
    ElMessage.error(err.response?.data?.message || err.message || '退款失败');
  } finally {
    refundSubmitting.value = false;
  }
};

// 确认退款（触发表单提交）
const confirmRefund = async () => {
  if (refundFormRef.value) {
    await refundFormRef.value.submit();
  }
};

onMounted(async () => {
  await Promise.all([
    transactionStore.fetchTransactions(),
    categoryStore.fetchCategories(),
  ]);
});
</script>

<style scoped>
.transaction-list-page--mobile {
  height: 100%;
}

.mobile-content {
  min-height: 100%;
}

.mobile-filter-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.filter-summary {
  font-size: 12px;
  color: var(--color-primary);
}

.transaction-cards {
  display: flex;
  flex-direction: column;
}

.transaction-cards > * {
  border-bottom: 1px solid var(--border-color);
}

.transaction-cards > *:last-child {
  border-bottom: none;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
}

/* 筛选表单 */
.filter-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-item label {
  font-size: 14px;
  color: var(--text-secondary);
}

.filter-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-actions .el-button {
  flex: 1;
}

/* 详情面板 */
.detail-content {
  text-align: center;
}

.detail-amount {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.detail-amount--expense {
  color: var(--color-danger);
}

.detail-amount--income {
  color: var(--color-success);
}

.detail-list {
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value {
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.detail-actions .el-button {
  flex: 1;
}

/* 附件列表样式 */
.detail-item--attachments {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.detail-attachments {
  width: 100%;
  margin-top: var(--spacing-xs);
}

.attachments-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 14px;
}

.no-attachments {
  color: var(--text-secondary);
  font-size: 14px;
}

.detail-amount--refund {
  color: var(--color-warning);
}

/* 桌面端样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.amount-income {
  color: #67c23a;
  font-weight: 600;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 600;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
