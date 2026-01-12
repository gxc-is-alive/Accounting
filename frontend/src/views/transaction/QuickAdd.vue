<template>
  <div class="quick-add-page" :class="{ 'quick-add-page--mobile': isMobile }">
    <div class="page-card">
      <h3 v-if="!isMobile" class="page-title">记一笔</h3>
      
      <!-- 类型切换 -->
      <div class="type-tabs">
        <div
          class="type-tab"
          :class="{ active: form.type === 'expense' }"
          @click="form.type = 'expense'"
        >
          支出
        </div>
        <div
          class="type-tab"
          :class="{ active: form.type === 'income' }"
          @click="form.type = 'income'"
        >
          收入
        </div>
      </div>

      <!-- 金额输入 -->
      <div class="amount-section">
        <span class="currency">¥</span>
        <input
          v-model="form.amount"
          type="text"
          inputmode="decimal"
          class="amount-input"
          placeholder="0.00"
          @input="handleAmountInput"
        />
      </div>

      <!-- AI 快捷输入 -->
      <div class="ai-input-section">
        <el-input
          v-model="aiText"
          placeholder="试试输入：午餐 25 或 工资 8000"
          @keyup.enter="handleAIParse"
        >
          <template #append>
            <el-button :loading="aiLoading" @click="handleAIParse">
              AI 解析
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 分类选择 -->
      <div class="category-section">
        <div class="section-title">选择分类</div>
        <div class="category-grid">
          <div
            v-for="cat in currentCategories"
            :key="cat.id"
            class="category-item"
            :class="{ active: form.categoryId === cat.id }"
            @click="form.categoryId = cat.id"
          >
            <el-icon><component :is="getIconComponent(cat.icon)" /></el-icon>
            <span>{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <!-- 账户选择 -->
      <div class="form-section">
        <el-form :label-width="isMobile ? '70px' : '80px'">
          <el-form-item label="账户">
            <el-select v-model="form.accountId" placeholder="选择账户" style="width: 100%">
              <el-option
                v-for="acc in accounts"
                :key="acc.id"
                :label="acc.name"
                :value="acc.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账单类型">
            <el-select v-model="form.billTypeId" placeholder="选择账单类型" style="width: 100%">
              <el-option
                v-for="bt in billTypes"
                :key="bt.id"
                :label="bt.name"
                :value="bt.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              :teleported="false"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.note" placeholder="添加备注（可选）" />
          </el-form-item>
          <el-form-item label="家庭账目">
            <el-switch v-model="form.isFamily" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 提交按钮 -->
      <el-button
        type="primary"
        size="large"
        :loading="submitting"
        class="submit-btn"
        @click="handleSubmit"
      >
        保存
      </el-button>
    </div>

    <!-- 成功动画 -->
    <Transition name="success-fade">
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-content">
          <el-icon class="success-icon"><Check /></el-icon>
          <span>记账成功</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Folder, Check } from '@element-plus/icons-vue';
import { useAccountStore } from '@/stores/account';
import { useCategoryStore } from '@/stores/category';
import { useTransactionStore } from '@/stores/transaction';
import { useDevice } from '@/composables/useDevice';
import { getIconComponent } from '@/utils/iconMap';
import { aiApi } from '@/api';
import type { TransactionType } from '@/types';

const router = useRouter();
const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const accountStore = useAccountStore();
const categoryStore = useCategoryStore();
const transactionStore = useTransactionStore();

const accounts = computed(() => accountStore.accounts);
const billTypes = computed(() => categoryStore.billTypes);
const currentCategories = computed(() =>
  form.type === 'income'
    ? categoryStore.incomeCategories
    : categoryStore.expenseCategories
);

const form = reactive({
  type: 'expense' as TransactionType,
  amount: '',
  categoryId: null as number | null,
  accountId: null as number | null,
  billTypeId: null as number | null,
  date: new Date().toISOString().split('T')[0],
  note: '',
  isFamily: false,
});

const aiText = ref('');
const aiLoading = ref(false);
const submitting = ref(false);
const showSuccess = ref(false);

// 处理金额输入（只允许数字和小数点）
const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let value = input.value;
  // 只保留数字和小数点
  value = value.replace(/[^\d.]/g, '');
  // 只保留第一个小数点
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  // 限制小数位数为2位
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  form.amount = value;
};

// AI 解析
const handleAIParse = async () => {
  if (!aiText.value.trim()) return;
  
  aiLoading.value = true;
  try {
    const res = await aiApi.parse(aiText.value) as { data: { amount: number; type: TransactionType; categoryName: string; note: string } };
    const parsed = res.data;
    
    form.amount = String(parsed.amount);
    form.type = parsed.type;
    form.note = parsed.note;
    
    // 尝试匹配分类
    const matchedCat = currentCategories.value.find(
      (c) => c.name === parsed.categoryName
    );
    if (matchedCat) {
      form.categoryId = matchedCat.id;
    }
    
    ElMessage.success('解析成功');
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || 'AI 解析失败');
  } finally {
    aiLoading.value = false;
  }
};

// 提交
const handleSubmit = async () => {
  if (!form.amount || parseFloat(form.amount) <= 0) {
    ElMessage.warning('请输入金额');
    return;
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择分类');
    return;
  }
  if (!form.accountId) {
    ElMessage.warning('请选择账户');
    return;
  }
  if (!form.billTypeId) {
    ElMessage.warning('请选择账单类型');
    return;
  }

  submitting.value = true;
  try {
    await transactionStore.createTransaction({
      type: form.type,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      accountId: form.accountId,
      billTypeId: form.billTypeId,
      date: form.date,
      note: form.note,
      isFamily: form.isFamily,
    });
    
    // 显示成功动画
    if (isMobile.value) {
      showSuccess.value = true;
      setTimeout(() => {
        showSuccess.value = false;
        router.back();
      }, 1000);
    } else {
      ElMessage.success('记账成功');
      // 重置表单
      form.amount = '';
      form.categoryId = null;
      form.note = '';
      aiText.value = '';
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    ElMessage.error(err.message || '记账失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    accountStore.fetchAccounts(),
    categoryStore.init(),
  ]);
  
  // 设置默认值
  if (accounts.value.length > 0) {
    form.accountId = accounts.value[0].id;
  }
  if (billTypes.value.length > 0) {
    form.billTypeId = billTypes.value[0].id;
  }
});
</script>

<style scoped>
.quick-add-page {
  max-width: 600px;
  margin: 0 auto;
}

.quick-add-page--mobile {
  max-width: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quick-add-page--mobile .page-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  box-shadow: none;
}

.type-tabs {
  display: flex;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 24px;
}

.quick-add-page--mobile .type-tabs {
  margin-bottom: var(--spacing-md);
}

.type-tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
  font-weight: 500;
  min-height: var(--touch-target-min);
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-tab.active {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.type-tab:first-child.active {
  color: #f56c6c;
}

.type-tab:last-child.active {
  color: #67c23a;
}

.amount-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.quick-add-page--mobile .amount-section {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md) 0;
}

.currency {
  font-size: 32px;
  color: #303133;
  margin-right: 8px;
}

.quick-add-page--mobile .currency {
  font-size: 28px;
}

.amount-input {
  font-size: 48px;
  font-weight: 600;
  border: none;
  outline: none;
  width: 200px;
  text-align: center;
  background: transparent;
}

.quick-add-page--mobile .amount-input {
  font-size: 40px;
  width: 180px;
}

.amount-input::placeholder {
  color: #c0c4cc;
}

.ai-input-section {
  margin-bottom: 24px;
}

.quick-add-page--mobile .ai-input-section {
  margin-bottom: var(--spacing-md);
}

.category-section {
  margin-bottom: 24px;
}

.quick-add-page--mobile .category-section {
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

/* 移动端分类网格改为4列 */
.quick-add-page--mobile .category-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f5f7fa;
  min-height: var(--touch-target-min);
}

.category-item:hover {
  background: #e6f7ff;
}

.category-item:active {
  transform: scale(0.95);
}

.category-item.active {
  background: #409eff;
  color: #fff;
}

.category-item span {
  font-size: 12px;
  margin-top: 4px;
}

.form-section {
  margin-bottom: 24px;
}

.quick-add-page--mobile .form-section {
  flex: 1;
  margin-bottom: var(--spacing-md);
}

.submit-btn {
  width: 100%;
}

.quick-add-page--mobile .submit-btn {
  height: 48px;
  font-size: 16px;
}

/* 成功动画 */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.success-content {
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.success-icon {
  font-size: 48px;
  color: var(--color-success);
}

.success-content span {
  font-size: 16px;
  color: var(--text-primary);
}

.success-fade-enter-active,
.success-fade-leave-active {
  transition: opacity 0.3s;
}

.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
}
</style>
