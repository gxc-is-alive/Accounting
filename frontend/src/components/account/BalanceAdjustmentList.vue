<template>
  <div class="balance-adjustment-list">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-select
        v-model="filters.accountId"
        placeholder="选择账户"
        clearable
        style="width: 150px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="acc in accounts"
          :key="acc.id"
          :label="acc.name"
          :value="acc.id"
        />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 240px"
        @change="handleDateChange"
      />
    </div>

    <!-- 记录列表 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="records.length === 0" class="empty-state">
      <el-empty description="暂无平账记录" />
    </div>

    <div v-else class="record-list">
      <div v-for="record in records" :key="record.id" class="record-item">
        <div class="record-header">
          <span class="account-name">{{ record.accountName }}</span>
          <span class="record-time">{{ formatDate(record.createdAt) }}</span>
        </div>
        <div class="record-body">
          <div class="balance-change">
            <span class="old-balance">¥{{ formatNumber(record.previousBalance) }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            <span class="new-balance">¥{{ formatNumber(record.newBalance) }}</span>
          </div>
          <div :class="['difference', record.differenceType]">
            {{ record.difference >= 0 ? '+' : '' }}¥{{ formatNumber(record.difference) }}
            <el-tag :type="getDifferenceTagType(record.differenceType)" size="small">
              {{ getDifferenceLabel(record.differenceType) }}
            </el-tag>
          </div>
        </div>
        <div v-if="record.note" class="record-note">
          <el-icon><Document /></el-icon>
          {{ record.note }}
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ArrowRight, Document } from '@element-plus/icons-vue';
import { balanceAdjustmentApi, accountApi } from '@/api';
import type { Account, BalanceAdjustmentRecord, DifferenceType } from '@/types';

const props = defineProps<{
  accountId?: number;
}>();

const loading = ref(false);
const records = ref<BalanceAdjustmentRecord[]>([]);
const accounts = ref<Account[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;
const dateRange = ref<[string, string] | null>(null);

const filters = ref({
  accountId: props.accountId,
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined,
});

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const loadAccounts = async () => {
  try {
    const res = await accountApi.list() as unknown as { success: boolean; data: Account[] };
    if (res.success && res.data) {
      accounts.value = res.data;
    }
  } catch (error) {
    console.error('加载账户列表失败:', error);
  }
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const res = await balanceAdjustmentApi.getRecords({
      accountId: filters.value.accountId,
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      page: currentPage.value,
      pageSize,
    }) as unknown as { success: boolean; data: { records: BalanceAdjustmentRecord[]; total: number } };

    if (res.success && res.data) {
      records.value = res.data.records;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error('加载平账记录失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  currentPage.value = 1;
  loadRecords();
};

const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    filters.value.startDate = val[0];
    filters.value.endDate = val[1];
  } else {
    filters.value.startDate = undefined;
    filters.value.endDate = undefined;
  }
  currentPage.value = 1;
  loadRecords();
};

const handlePageChange = () => {
  loadRecords();
};

// 暴露刷新方法
const refresh = () => {
  loadRecords();
};

defineExpose({ refresh });

onMounted(() => {
  loadAccounts();
  loadRecords();
});
</script>

<style scoped>
.balance-adjustment-list {
  padding: 16px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.loading-state,
.empty-state {
  padding: 40px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.account-name {
  font-weight: 600;
  color: #303133;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.record-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-change {
  display: flex;
  align-items: center;
  gap: 8px;
}

.old-balance {
  color: #909399;
  text-decoration: line-through;
}

.arrow-icon {
  color: #c0c4cc;
}

.new-balance {
  color: #303133;
  font-weight: 600;
}

.difference {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.difference.profit {
  color: #67c23a;
}

.difference.loss {
  color: #f56c6c;
}

.difference.none {
  color: #909399;
}

.record-note {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
