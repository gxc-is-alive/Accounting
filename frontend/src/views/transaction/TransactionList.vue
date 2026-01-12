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
            {{ selectedTransaction.type === 'income' ? '+' : '-' }}¥{{ selectedTransaction.amount.toFixed(2) }}
          </div>
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">类型</span>
              <span class="detail-value">
                <el-tag :type="selectedTransaction.type === 'income' ? 'success' : 'danger'" size="small">
                  {{ selectedTransaction.type === 'income' ? '收入' : '支出' }}
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
          </div>
        </div>
        <template #footer>
          <div class="detail-actions">
            <el-button @click="handleEdit(selectedTransaction!)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(selectedTransaction!)">删除</el-button>
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
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Filter } from '@element-plus/icons-vue';
import { useTransactionStore } from '@/stores/transaction';
import { useCategoryStore } from '@/stores/category';
import { useDevice } from '@/composables/useDevice';
import PullRefresh from '@/components/mobile/PullRefresh.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import TransactionCard from '@/components/mobile/TransactionCard.vue';
import type { Transaction, TransactionFilters } from '@/types';

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
const submitting = ref(false);

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
const handleCardClick = (transaction: Transaction) => {
  selectedTransaction.value = transaction;
  showDetailSheet.value = true;
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
const handleEdit = (row: Transaction) => {
  showDetailSheet.value = false;
  editForm.id = row.id;
  editForm.amount = row.amount;
  editForm.categoryId = row.categoryId;
  editForm.date = row.date;
  editForm.note = row.note || '';
  editDialogVisible.value = true;
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
