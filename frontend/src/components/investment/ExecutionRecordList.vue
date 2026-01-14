<template>
  <div class="execution-record-list">
    <div class="list-header">
      <span class="title">{{ title }}</span>
      <div class="filters" v-if="showFilters">
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          size="small"
          style="width: 100px"
          @change="handleFilterChange"
        >
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始"
          end-placeholder="结束"
          format="MM-DD"
          value-format="YYYY-MM-DD"
          size="small"
          style="width: 200px"
          @change="handleDateChange"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="records.length === 0" class="empty-state">
      <el-empty description="暂无执行记录" />
    </div>

    <div v-else class="record-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-card"
        :class="{ failed: record.status === 'failed' }"
      >
        <div class="record-header">
          <span class="record-time">{{ formatDate(record.executedAt) }}</span>
          <el-tag :type="record.status === 'success' ? 'success' : 'danger'" size="small">
            {{ record.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </div>

        <div class="record-info">
          <div class="info-row">
            <span class="label">实际支付</span>
            <span class="value">¥ {{ record.paidAmount.toFixed(2) }}</span>
          </div>
          <div class="info-row">
            <span class="label">获得金额</span>
            <span class="value">¥ {{ record.investedAmount.toFixed(2) }}</span>
          </div>
          <div v-if="record.discountRate < 1" class="info-row">
            <span class="label">折扣率</span>
            <span class="value discount">{{ (record.discountRate * 100).toFixed(2) }}%</span>
          </div>
          <div class="info-row">
            <span class="label">买入份额</span>
            <span class="value">{{ record.shares.toFixed(4) }}</span>
          </div>
          <div class="info-row">
            <span class="label">买入净值</span>
            <span class="value">{{ record.netValue.toFixed(4) }}</span>
          </div>
        </div>

        <div v-if="record.failReason" class="fail-reason">
          <el-icon><Warning /></el-icon>
          {{ record.failReason }}
        </div>

        <div v-if="record.plan" class="record-plan">
          <el-icon><Connection /></el-icon>
          {{ record.plan.name }}
        </div>
      </div>
    </div>

    <div v-if="showPagination && total > pageSize" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Warning, Connection } from '@element-plus/icons-vue';
import type { ExecutionRecord } from '@/types';

const props = withDefaults(defineProps<{
  records: ExecutionRecord[];
  loading?: boolean;
  title?: string;
  showFilters?: boolean;
  showPagination?: boolean;
  total?: number;
  pageSize?: number;
}>(), {
  title: '执行记录',
  showFilters: false,
  showPagination: false,
  total: 0,
  pageSize: 20,
});

const emit = defineEmits<{
  filter: [filters: { status?: string; startDate?: string; endDate?: string; page?: number }];
}>();

const currentPage = ref(1);
const dateRange = ref<[string, string] | null>(null);
const filters = ref({
  status: undefined as string | undefined,
});

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

const handleFilterChange = () => {
  currentPage.value = 1;
  emitFilter();
};

const handleDateChange = () => {
  currentPage.value = 1;
  emitFilter();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  emitFilter();
};

const emitFilter = () => {
  emit('filter', {
    status: filters.value.status,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    page: currentPage.value,
  });
};

watch(() => props.records, () => {
  // 当记录变化时，可能需要重置分页
}, { deep: true });
</script>

<style scoped>
.execution-record-list {
  padding: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-state,
.empty-state {
  padding: 32px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.record-card.failed {
  border-left: 3px solid #f56c6c;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-time {
  font-size: 13px;
  color: #909399;
}

.record-info {
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.info-row .label {
  font-size: 13px;
  color: #909399;
}

.info-row .value {
  font-size: 13px;
  color: #606266;
}

.info-row .value.discount {
  color: #67c23a;
  font-weight: 500;
}

.fail-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 6px;
  font-size: 12px;
  color: #f56c6c;
  margin-top: 8px;
}

.record-plan {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
