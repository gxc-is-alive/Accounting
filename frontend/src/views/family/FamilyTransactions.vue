<template>
  <div class="family-transactions-page" :class="{ 'family-transactions-page--mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">家庭账目</h3>
        <el-select v-model="selectedFamilyId" placeholder="选择家庭" @change="onFamilyChange">
          <el-option
            v-for="family in families"
            :key="family.id"
            :label="family.name"
            :value="family.id"
          />
        </el-select>
      </div>

      <!-- 筛选器 -->
      <div v-if="selectedFamilyId" class="filters-section">
        <el-select
          v-model="filters.memberId"
          placeholder="全部成员"
          clearable
          @change="onFilterChange"
        >
          <el-option
            v-for="member in members"
            :key="member.userId"
            :label="member.user?.nickname || '未知'"
            :value="member.userId"
          />
        </el-select>
        <el-select
          v-model="filters.type"
          placeholder="全部类型"
          clearable
          @change="onFilterChange"
        >
          <el-option label="收入" value="income" />
          <el-option label="支出" value="expense" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="onDateRangeChange"
        />
      </div>

      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <el-empty v-else-if="!selectedFamilyId" description="请先选择一个家庭" />
      <el-empty v-else-if="!transactions.length" description="暂无家庭账目记录" />
      
      <!-- 移动端卡片列表 -->
      <div v-else-if="isMobile" class="transaction-card-list">
        <div
          v-for="item in transactions"
          :key="item.id"
          class="transaction-card"
        >
          <div class="card-header">
            <div class="card-category">
              <span class="category-icon">{{ item.categoryIcon || '📝' }}</span>
              <span class="category-name">{{ item.categoryName || '未分类' }}</span>
            </div>
            <span
              class="card-amount"
              :class="item.type === 'income' ? 'amount-income' : 'amount-expense'"
            >
              {{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toFixed(2) }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-info">
              <span class="info-label">记录人：</span>
              <span class="info-value">{{ item.userNickname || '-' }}</span>
            </div>
            <div class="card-info">
              <span class="info-label">账户：</span>
              <span class="info-value">{{ item.accountName || '-' }}</span>
            </div>
            <div v-if="item.note" class="card-info">
              <span class="info-label">备注：</span>
              <span class="info-value">{{ item.note }}</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-date">{{ item.date }}</span>
          </div>
        </div>
      </div>

      <!-- PC端表格 -->
      <el-table v-else :data="transactions" style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <span>{{ row.categoryIcon || '' }} {{ row.categoryName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="记录人" width="100">
          <template #default="{ row }">{{ row.userNickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="账户" width="100">
          <template #default="{ row }">{{ row.accountName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'amount-income' : 'amount-expense'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedFamilyId && transactions.length" class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadTransactions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { familyApi, transactionApi } from '@/api';
import type { Family, FamilyMember, FamilyTransaction, FamilyTransactionFilters } from '@/types';
import { useDevice } from '@/composables/useDevice';

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const families = ref<Family[]>([]);
const members = ref<FamilyMember[]>([]);
const transactions = ref<FamilyTransaction[]>([]);
const selectedFamilyId = ref<number | null>(null);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const dateRange = ref<[string, string] | null>(null);

const filters = ref<FamilyTransactionFilters>({
  memberId: undefined,
  type: undefined,
  startDate: undefined,
  endDate: undefined,
});

async function loadFamilies() {
  try {
    const res = await familyApi.list() as unknown as { success: boolean; data: Family[] };
    if (res.success) {
      families.value = res.data || [];
      if (families.value.length > 0) {
        selectedFamilyId.value = families.value[0].id;
        await Promise.all([loadMembers(), loadTransactions()]);
      }
    }
  } catch (error) {
    console.error('加载家庭列表失败:', error);
  }
}

async function loadMembers() {
  if (!selectedFamilyId.value) return;
  try {
    const res = await familyApi.getMembers(selectedFamilyId.value) as unknown as { success: boolean; data: FamilyMember[] };
    if (res.success) {
      members.value = res.data || [];
    }
  } catch (error) {
    console.error('加载家庭成员失败:', error);
  }
}

async function loadTransactions() {
  if (!selectedFamilyId.value) return;
  loading.value = true;
  try {
    const res = await transactionApi.familyList(selectedFamilyId.value, {
      ...filters.value,
      page: page.value,
      pageSize: pageSize.value,
    }) as unknown as { success: boolean; data: { items: FamilyTransaction[]; total: number } };
    if (res.success && res.data) {
      transactions.value = res.data.items || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('加载家庭账目失败:', error);
    transactions.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function onFamilyChange() {
  page.value = 1;
  filters.value = {
    memberId: undefined,
    type: undefined,
    startDate: undefined,
    endDate: undefined,
  };
  dateRange.value = null;
  Promise.all([loadMembers(), loadTransactions()]);
}

function onFilterChange() {
  page.value = 1;
  loadTransactions();
}

function onDateRangeChange(range: [string, string] | null) {
  if (range) {
    filters.value.startDate = range[0];
    filters.value.endDate = range[1];
  } else {
    filters.value.startDate = undefined;
    filters.value.endDate = undefined;
  }
  page.value = 1;
  loadTransactions();
}

onMounted(loadFamilies);
</script>

<style scoped>
.family-transactions-page {
  padding: 20px;
}

.family-transactions-page--mobile {
  padding: var(--spacing-sm);
}

.page-card {
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  padding: 20px;
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.05));
}

.family-transactions-page--mobile .page-card {
  padding: var(--spacing-md);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary, #303133);
}

.filters-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.family-transactions-page--mobile .filters-section {
  flex-direction: column;
  gap: 8px;
}

.family-transactions-page--mobile .filters-section .el-select,
.family-transactions-page--mobile .filters-section .el-date-picker {
  width: 100%;
}

.loading-state {
  padding: 20px 0;
}

.amount-income {
  color: #67c23a;
  font-weight: 600;
}

.amount-expense {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 移动端卡片列表样式 */
.transaction-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-card {
  background: var(--bg-secondary, #f5f7fa);
  border-radius: 8px;
  padding: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-category {
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-icon {
  font-size: 16px;
}

.category-name {
  font-weight: 500;
  color: var(--text-primary, #303133);
}

.card-amount {
  font-size: 16px;
  font-weight: 600;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.card-info {
  display: flex;
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary, #909399);
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.card-date {
  font-size: 12px;
  color: var(--text-secondary, #909399);
}
</style>
