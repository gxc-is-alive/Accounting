<template>
  <div class="budget-manage-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">预算管理</h3>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          {{ isMobile ? '' : '添加预算' }}
        </el-button>
      </div>

      <el-empty v-if="!budgets.length" description="暂无预算，点击上方按钮添加" />
      
      <!-- 移动端卡片列表 -->
      <div v-else-if="isMobile" class="budget-list-mobile">
        <BudgetCard
          v-for="budget in budgets"
          :key="budget.budgetId || budget.id"
          :budget="budget"
          @click="showBudgetDetail(budget)"
          @edit="editBudget(budget)"
          @delete="deleteBudget(budget.budgetId || budget.id)"
        />
      </div>

      <!-- 桌面端网格布局 -->
      <div v-else class="budget-list">
        <div v-for="budget in budgets" :key="budget.budgetId || budget.id" class="budget-card">
          <div class="budget-header">
            <span class="budget-name">{{ budget.categoryName || budget.category?.name || '总预算' }}</span>
            <span class="budget-month">{{ budget.month || '' }}</span>
          </div>
          <div class="budget-progress">
            <div class="progress-info">
              <span>已用 ¥{{ ((budget.spentAmount || budget.spent || 0)).toFixed(2) }}</span>
              <span>预算 ¥{{ (budget.budgetAmount || budget.amount || 0).toFixed(2) }}</span>
            </div>
            <el-progress 
              :percentage="Math.min(budget.percentage || (budget.progress || 0) * 100, 100)" 
              :status="getProgressStatus((budget.percentage || 0) / 100)"
            />
          </div>
          <div class="budget-actions">
            <el-button size="small" @click="editBudget(budget)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteBudget(budget.budgetId || budget.id)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端对话框 -->
    <el-dialog 
      v-if="!isMobile"
      v-model="dialogVisible" 
      :title="isEdit ? '编辑预算' : '添加预算'" 
      width="400px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="预算月份">
          <el-date-picker
            v-model="form.month"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类（可选）" clearable style="width: 100%">
            <el-option
              v-for="cat in expenseCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBudget">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移动端底部弹窗表单 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="dialogVisible"
      :title="isEdit ? '编辑预算' : '添加预算'"
      height="auto"
    >
      <div class="mobile-form">
        <div class="form-item">
          <label>预算月份</label>
          <el-date-picker
            v-model="form.month"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :teleported="false"
            style="width: 100%"
          />
        </div>
        <div class="form-item">
          <label>分类</label>
          <el-select 
            v-model="form.categoryId" 
            placeholder="选择分类（可选）" 
            clearable 
            :teleported="false"
            style="width: 100%"
          >
            <el-option
              v-for="cat in expenseCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </div>
        <div class="form-item">
          <label>预算金额</label>
          <el-input
            v-model.number="form.amount"
            type="number"
            inputmode="decimal"
            placeholder="请输入金额"
          />
        </div>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="dialogVisible = false" style="flex: 1">取消</el-button>
          <el-button type="primary" @click="saveBudget" style="flex: 1">确定</el-button>
        </div>
      </template>
    </BottomSheet>

    <!-- 移动端预算详情弹窗 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="detailVisible"
      title="预算详情"
      height="auto"
    >
      <div v-if="selectedBudget" class="budget-detail">
        <div class="detail-item">
          <span class="label">分类</span>
          <span class="value">{{ selectedBudget.categoryName || selectedBudget.category?.name || '总预算' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">月份</span>
          <span class="value">{{ selectedBudget.month }}</span>
        </div>
        <div class="detail-item">
          <span class="label">预算金额</span>
          <span class="value">¥{{ (selectedBudget.budgetAmount || selectedBudget.amount || 0).toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">已使用</span>
          <span class="value expense">¥{{ (selectedBudget.spentAmount || selectedBudget.spent || 0).toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">剩余</span>
          <span class="value" :class="remainingAmount >= 0 ? 'income' : 'expense'">
            ¥{{ remainingAmount.toFixed(2) }}
          </span>
        </div>
        <div class="detail-progress">
          <el-progress
            :percentage="Math.min(selectedBudget.percentage || 0, 100)"
            :stroke-width="12"
            :status="getProgressStatus((selectedBudget.percentage || 0) / 100)"
          />
        </div>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="editBudget(selectedBudget!)" style="flex: 1">编辑</el-button>
          <el-button type="danger" @click="deleteBudget(selectedBudget?.budgetId || selectedBudget?.id)" style="flex: 1">删除</el-button>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { budgetApi, categoryApi } from '@/api';
import { useDevice } from '@/composables/useDevice';
import BudgetCard from '@/components/mobile/BudgetCard.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import type { Budget, Category } from '@/types';

const { isMobile } = useDevice();

const budgets = ref<Budget[]>([]);
const expenseCategories = ref<Category[]>([]);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const selectedBudget = ref<Budget | null>(null);

const form = ref({
  month: getCurrentMonth(),
  categoryId: null as number | null,
  amount: 0,
});

const remainingAmount = computed(() => {
  if (!selectedBudget.value) return 0;
  const budget = selectedBudget.value.budgetAmount || selectedBudget.value.amount || 0;
  const spent = selectedBudget.value.spentAmount || selectedBudget.value.spent || 0;
  return budget - spent;
});

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getProgressStatus(progress: number) {
  if (progress > 1) return 'exception';
  if (progress > 0.8) return 'warning';
  return '';
}

async function loadBudgets() {
  try {
    const res = await budgetApi.status() as unknown as { success: boolean; data: Budget[] };
    if (res.success) {
      budgets.value = res.data || [];
    }
  } catch (error) {
    console.error('加载预算失败:', error);
  }
}

async function loadCategories() {
  try {
    const res = await categoryApi.list() as unknown as { success: boolean; data: Category[] };
    if (res.success) {
      expenseCategories.value = (res.data || []).filter(c => c.type === 'expense');
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

function showAddDialog() {
  isEdit.value = false;
  editId.value = null;
  form.value = { month: getCurrentMonth(), categoryId: null, amount: 0 };
  dialogVisible.value = true;
}

function editBudget(budget: Budget) {
  isEdit.value = true;
  editId.value = budget.id;
  form.value = {
    month: budget.month,
    categoryId: budget.categoryId || null,
    amount: budget.amount,
  };
  detailVisible.value = false;
  dialogVisible.value = true;
}

function showBudgetDetail(budget: Budget) {
  selectedBudget.value = budget;
  detailVisible.value = true;
}

async function saveBudget() {
  if (!form.value.month || form.value.amount <= 0) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  try {
    const data = {
      month: form.value.month,
      categoryId: form.value.categoryId,
      amount: form.value.amount,
    };

    if (isEdit.value && editId.value) {
      await budgetApi.update(editId.value, data);
      ElMessage.success('更新成功');
    } else {
      await budgetApi.create(data);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    await loadBudgets();
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

async function deleteBudget(id: number) {
  try {
    await ElMessageBox.confirm('确定删除该预算吗？', '提示', { type: 'warning' });
    await budgetApi.delete(id);
    ElMessage.success('删除成功');
    detailVisible.value = false;
    await loadBudgets();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

onMounted(() => {
  loadBudgets();
  loadCategories();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.budget-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.budget-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.budget-name {
  font-weight: 600;
  color: #303133;
}

.budget-month {
  color: #909399;
  font-size: 13px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.budget-actions {
  margin-top: 12px;
  text-align: right;
}

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: row;
  justify-content: space-between;
}

.budget-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.budget-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.detail-item:last-of-type {
  border-bottom: none;
}

.detail-item .label {
  color: #909399;
  font-size: 14px;
}

.detail-item .value {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.detail-item .value.income {
  color: #67c23a;
}

.detail-item .value.expense {
  color: #f56c6c;
}

.detail-progress {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .budget-manage-page .page-card {
    padding: 16px;
  }
}
</style>
