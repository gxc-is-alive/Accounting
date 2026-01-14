<template>
  <div class="auto-investment-page" :class="{ 'is-mobile': isMobile }">
    <!-- 页面标题 -->
    <div class="page-header">
      <h3 class="page-title">定投管理</h3>
      <InvestmentReminder ref="reminderRef" />
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="investment-tabs">
      <el-tab-pane label="定投计划" name="plans">
        <AutoInvestmentList
          :plans="autoInvestmentPlans"
          :loading="autoInvestmentLoading"
          @add="showAutoInvestmentForm()"
          @edit="showAutoInvestmentForm"
          @pause="handlePausePlan"
          @resume="handleResumePlan"
          @delete="handleDeletePlan"
          @records="showPlanRecords"
        />
      </el-tab-pane>

      <el-tab-pane label="执行记录" name="records">
        <div class="records-header">
          <el-button type="primary" @click="showOneTimeBuyForm = true">
            <el-icon><ShoppingCart /></el-icon>
            单次转账
          </el-button>
        </div>
        <ExecutionRecordList
          :records="executionRecords"
          :loading="recordsLoading"
          :show-filters="true"
          :show-pagination="true"
          :total="recordsTotal"
          :page-size="recordsPageSize"
          @filter="handleRecordsFilter"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 定投计划表单 -->
    <AutoInvestmentForm
      v-model="showAutoInvestmentFormDialog"
      :plan="editingPlan"
      @success="loadAutoInvestmentPlans"
    />

    <!-- 单次转账表单 -->
    <OneTimeBuyForm
      v-model="showOneTimeBuyForm"
      @success="handleOneTimeBuySuccess"
    />

    <!-- 计划执行记录对话框 -->
    <el-dialog
      v-model="showPlanRecordsDialog"
      :title="`${selectedPlan?.name || ''} - 执行记录`"
      :width="isMobile ? '90%' : '600px'"
    >
      <ExecutionRecordList
        :records="planRecords"
        :loading="planRecordsLoading"
        title=""
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ShoppingCart } from '@element-plus/icons-vue';
import { useDevice } from '@/composables/useDevice';
import { autoInvestmentApi } from '@/api';
import {
  AutoInvestmentList,
  AutoInvestmentForm,
  OneTimeBuyForm,
  ExecutionRecordList,
  InvestmentReminder,
} from '@/components/investment';
import type {
  AutoInvestmentPlan,
  ExecutionRecord,
} from '@/types';

const { isMobile } = useDevice();

// Tab 状态
const activeTab = ref('plans');

// 提醒组件引用
const reminderRef = ref<InstanceType<typeof InvestmentReminder> | null>(null);

// 定投计划相关
const autoInvestmentPlans = ref<AutoInvestmentPlan[]>([]);
const autoInvestmentLoading = ref(false);
const showAutoInvestmentFormDialog = ref(false);
const editingPlan = ref<AutoInvestmentPlan | undefined>();

// 执行记录相关
const executionRecords = ref<ExecutionRecord[]>([]);
const recordsLoading = ref(false);
const recordsTotal = ref(0);
const recordsPageSize = ref(20);
const recordsFilters = ref<{
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  page?: number;
}>({});

// 单次转账
const showOneTimeBuyForm = ref(false);

// 计划执行记录
const showPlanRecordsDialog = ref(false);
const selectedPlan = ref<AutoInvestmentPlan | null>(null);
const planRecords = ref<ExecutionRecord[]>([]);
const planRecordsLoading = ref(false);

const loadAutoInvestmentPlans = async () => {
  autoInvestmentLoading.value = true;
  try {
    const res = await autoInvestmentApi.listPlans() as unknown as {
      success: boolean;
      data: AutoInvestmentPlan[];
    };
    if (res.success && res.data) {
      autoInvestmentPlans.value = res.data;
    }
  } catch (error) {
    console.error('加载定投计划失败:', error);
  } finally {
    autoInvestmentLoading.value = false;
  }
};

const loadExecutionRecords = async () => {
  recordsLoading.value = true;
  try {
    const res = await autoInvestmentApi.listRecords({
      ...recordsFilters.value,
      pageSize: recordsPageSize.value,
    }) as unknown as {
      success: boolean;
      data: { records: ExecutionRecord[]; total: number };
    };
    if (res.success && res.data) {
      executionRecords.value = res.data.records;
      recordsTotal.value = res.data.total;
    }
  } catch (error) {
    console.error('加载执行记录失败:', error);
  } finally {
    recordsLoading.value = false;
  }
};

// 定投计划操作
const showAutoInvestmentForm = (plan?: AutoInvestmentPlan) => {
  editingPlan.value = plan;
  showAutoInvestmentFormDialog.value = true;
};

const handlePausePlan = async (plan: AutoInvestmentPlan) => {
  try {
    await autoInvestmentApi.pausePlan(plan.id);
    ElMessage.success('定投计划已暂停');
    await loadAutoInvestmentPlans();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '操作失败');
  }
};

const handleResumePlan = async (plan: AutoInvestmentPlan) => {
  try {
    await autoInvestmentApi.resumePlan(plan.id);
    ElMessage.success('定投计划已恢复');
    await loadAutoInvestmentPlans();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '操作失败');
  }
};

const handleDeletePlan = async (plan: AutoInvestmentPlan) => {
  try {
    await ElMessageBox.confirm(
      '删除后历史执行记录将保留，确定要删除该定投计划吗？',
      '确认删除',
      { type: 'warning' }
    );
  } catch {
    return;
  }

  try {
    await autoInvestmentApi.deletePlan(plan.id);
    ElMessage.success('定投计划已删除');
    await loadAutoInvestmentPlans();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ElMessage.error(err.response?.data?.message || '删除失败');
  }
};

const showPlanRecords = async (plan: AutoInvestmentPlan) => {
  selectedPlan.value = plan;
  showPlanRecordsDialog.value = true;
  planRecordsLoading.value = true;

  try {
    const res = await autoInvestmentApi.getPlanRecords(plan.id) as unknown as {
      success: boolean;
      data: ExecutionRecord[];
    };
    if (res.success && res.data) {
      planRecords.value = res.data;
    }
  } catch (error) {
    console.error('加载执行记录失败:', error);
  } finally {
    planRecordsLoading.value = false;
  }
};

const handleRecordsFilter = (filters: { status?: string; startDate?: string; endDate?: string; page?: number }) => {
  recordsFilters.value = {
    ...filters,
    status: filters.status as 'success' | 'failed' | undefined,
  };
  loadExecutionRecords();
};

const handleOneTimeBuySuccess = () => {
  loadExecutionRecords();
  reminderRef.value?.refresh();
};

onMounted(() => {
  loadAutoInvestmentPlans();
  loadExecutionRecords();
});
</script>

<style scoped>
.auto-investment-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.auto-investment-page.is-mobile {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.investment-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.records-header {
  margin-bottom: 16px;
}
</style>
