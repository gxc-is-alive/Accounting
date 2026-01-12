<template>
  <div class="bill-type-manage-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">账单类型管理</h3>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          {{ isMobile ? '' : '添加类型' }}
        </el-button>
      </div>

      <el-empty v-if="!billTypes.length" description="暂无账单类型，点击上方按钮添加" />

      <!-- 移动端列表 -->
      <div v-else-if="isMobile" class="bill-type-list-mobile">
        <SwipeAction
          v-for="billType in billTypes"
          :key="billType.id"
          :actions="getSwipeActions(billType)"
          @action="(action) => handleSwipeAction(action, billType)"
        >
          <div class="bill-type-card-mobile">
            <div class="bill-type-icon">
              <el-icon size="20"><Document /></el-icon>
            </div>
            <div class="bill-type-info">
              <div class="bill-type-name">{{ billType.name }}</div>
              <div class="bill-type-desc" v-if="billType.description">{{ billType.description }}</div>
            </div>
            <el-tag v-if="billType.isSystem" size="small" type="info">系统</el-tag>
          </div>
        </SwipeAction>
      </div>

      <!-- 桌面端列表 -->
      <div v-else class="bill-type-list">
        <div v-for="billType in billTypes" :key="billType.id" class="bill-type-card">
          <div class="bill-type-info">
            <div class="bill-type-icon">
              <el-icon size="20"><Document /></el-icon>
            </div>
            <div class="bill-type-detail">
              <div class="bill-type-name">{{ billType.name }}</div>
              <div class="bill-type-desc" v-if="billType.description">{{ billType.description }}</div>
            </div>
          </div>
          <div class="bill-type-actions">
            <el-button type="primary" link @click="handleEdit(billType)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(billType)" :disabled="billType.isSystem">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端对话框 -->
    <el-dialog v-if="!isMobile" v-model="dialogVisible" :title="isEdit ? '编辑账单类型' : '添加账单类型'" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" placeholder="如：日常消费、工资收入" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="可选描述" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移动端底部弹窗 -->
    <BottomSheet
      v-if="isMobile"
      v-model:visible="dialogVisible"
      :title="isEdit ? '编辑账单类型' : '添加账单类型'"
    >
      <div class="mobile-form">
        <div class="form-item">
          <label>类型名称</label>
          <el-input v-model="form.name" placeholder="如：日常消费、工资收入" />
        </div>
        <div class="form-item">
          <label>描述</label>
          <el-input v-model="form.description" type="textarea" placeholder="可选描述" :rows="2" />
        </div>
      </div>
      <template #footer>
        <div class="mobile-form-footer">
          <el-button @click="dialogVisible = false" style="flex: 1">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" style="flex: 1">确定</el-button>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Document } from '@element-plus/icons-vue';
import { useBillTypeStore } from '@/stores/billType';
import { useDevice } from '@/composables/useDevice';
import SwipeAction from '@/components/mobile/SwipeAction.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import type { BillType } from '@/types';

const { isMobile } = useDevice();
const billTypeStore = useBillTypeStore();
const billTypes = computed(() => billTypeStore.billTypes);

// 滑动操作
function getSwipeActions(billType: BillType) {
  const actions = [{ key: 'edit', text: '编辑', color: '#409eff' }];
  if (!billType.isSystem) {
    actions.push({ key: 'delete', text: '删除', color: '#f56c6c' });
  }
  return actions;
}

function handleSwipeAction(action: { key: string }, billType: BillType) {
  if (action.key === 'edit') {
    handleEdit(billType);
  } else if (action.key === 'delete') {
    handleDelete(billType);
  }
}

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
  name: '',
  description: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
};

const showAddDialog = () => {
  isEdit.value = false;
  editId.value = null;
  form.name = '';
  form.description = '';
  dialogVisible.value = true;
};

const handleEdit = (billType: BillType) => {
  isEdit.value = true;
  editId.value = billType.id;
  form.name = billType.name;
  form.description = billType.description || '';
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitting.value = true;
    try {
      if (isEdit.value && editId.value) {
        await billTypeStore.updateBillType(editId.value, {
          name: form.name,
          description: form.description,
        });
        ElMessage.success('更新成功');
      } else {
        await billTypeStore.createBillType({
          name: form.name,
          description: form.description,
        });
        ElMessage.success('添加成功');
      }
      dialogVisible.value = false;
    } catch (error: unknown) {
      const err = error as { message?: string };
      ElMessage.error(err.message || '操作失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (billType: BillType) => {
  if (billType.isSystem) {
    ElMessage.warning('系统类型不能删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定要删除账单类型"${billType.name}"吗？`, '提示', { type: 'warning' });
    await billTypeStore.deleteBillType(billType.id);
    ElMessage.success('删除成功');
  } catch {
    // 取消删除
  }
};

onMounted(() => {
  billTypeStore.fetchBillTypes();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.bill-type-list {
  display: grid;
  gap: 16px;
}

.bill-type-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.bill-type-info {
  display: flex;
  align-items: center;
}

.bill-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #909399;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.bill-type-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.bill-type-desc {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: row;
  justify-content: space-between;
}

.bill-type-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bill-type-card-mobile {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  gap: 12px;
}

.bill-type-card-mobile .bill-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #909399;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bill-type-card-mobile .bill-type-info {
  flex: 1;
  min-width: 0;
}

.bill-type-card-mobile .bill-type-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.bill-type-card-mobile .bill-type-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

@media (max-width: 768px) {
  .bill-type-manage-page .page-card {
    padding: 16px;
  }
}
</style>
