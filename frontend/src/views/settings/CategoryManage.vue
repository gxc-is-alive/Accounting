<template>
  <div class="category-manage-page" :class="{ 'is-mobile': isMobile }">
    <div class="page-card">
      <div class="page-header">
        <h3 class="page-title">分类管理</h3>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          {{ isMobile ? '' : '添加分类' }}
        </el-button>
      </div>

      <!-- 类型切换 -->
      <div class="type-tabs">
        <el-radio-group v-model="currentType" @change="handleTypeChange">
          <el-radio-button value="expense">支出分类</el-radio-button>
          <el-radio-button value="income">收入分类</el-radio-button>
        </el-radio-group>
      </div>

      <el-empty v-if="!filteredCategories.length" description="暂无分类，点击上方按钮添加" />

      <!-- 移动端列表 -->
      <div v-else-if="isMobile" class="category-list-mobile">
        <SwipeAction
          v-for="category in filteredCategories"
          :key="category.id"
          :actions="getSwipeActions(category)"
          @action="(action) => handleSwipeAction(action, category)"
        >
          <div class="category-card-mobile">
            <div class="category-icon" :class="currentType">
              <el-icon size="20"><Folder /></el-icon>
            </div>
            <div class="category-name">{{ category.name }}</div>
            <el-tag v-if="category.isSystem" size="small" type="info">系统</el-tag>
          </div>
        </SwipeAction>
      </div>

      <!-- 桌面端网格 -->
      <div v-else class="category-list">
        <div v-for="category in filteredCategories" :key="category.id" class="category-card">
          <div class="category-info">
            <div class="category-icon" :class="currentType">
              <el-icon size="20"><Folder /></el-icon>
            </div>
            <div class="category-name">{{ category.name }}</div>
          </div>
          <div class="category-actions">
            <el-button type="primary" link @click="handleEdit(category)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(category)" :disabled="category.isSystem">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端对话框 -->
    <el-dialog v-if="!isMobile" v-model="dialogVisible" :title="isEdit ? '编辑分类' : '添加分类'" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="如：餐饮、交通" />
        </el-form-item>
        <el-form-item label="分类类型" prop="type">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%" :disabled="isEdit">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
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
      :title="isEdit ? '编辑分类' : '添加分类'"
    >
      <div class="mobile-form">
        <div class="form-item">
          <label>分类名称</label>
          <el-input v-model="form.name" placeholder="如：餐饮、交通" />
        </div>
        <div class="form-item">
          <label>分类类型</label>
          <el-select v-model="form.type" placeholder="选择类型" :teleported="false" style="width: 100%" :disabled="isEdit">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
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
import { Plus, Folder } from '@element-plus/icons-vue';
import { useCategoryStore } from '@/stores/category';
import { useDevice } from '@/composables/useDevice';
import SwipeAction from '@/components/mobile/SwipeAction.vue';
import BottomSheet from '@/components/mobile/BottomSheet.vue';
import type { Category, CategoryType } from '@/types';

const { isMobile } = useDevice();
const categoryStore = useCategoryStore();
const categories = computed(() => categoryStore.categories);

const currentType = ref<CategoryType>('expense');
const filteredCategories = computed(() => 
  categories.value.filter(c => c.type === currentType.value)
);

// 滑动操作
function getSwipeActions(category: Category) {
  const actions = [{ key: 'edit', text: '编辑', color: '#409eff' }];
  if (!category.isSystem) {
    actions.push({ key: 'delete', text: '删除', color: '#f56c6c' });
  }
  return actions;
}

function handleSwipeAction(action: { key: string }, category: Category) {
  if (action.key === 'edit') {
    handleEdit(category);
  } else if (action.key === 'delete') {
    handleDelete(category);
  }
}

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
  name: '',
  type: 'expense' as CategoryType,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择分类类型', trigger: 'change' }],
};

const handleTypeChange = () => {
  form.type = currentType.value;
};

const showAddDialog = () => {
  isEdit.value = false;
  editId.value = null;
  form.name = '';
  form.type = currentType.value;
  dialogVisible.value = true;
};

const handleEdit = (category: Category) => {
  isEdit.value = true;
  editId.value = category.id;
  form.name = category.name;
  form.type = category.type;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submitting.value = true;
    try {
      if (isEdit.value && editId.value) {
        await categoryStore.updateCategory(editId.value, { name: form.name });
        ElMessage.success('更新成功');
      } else {
        await categoryStore.createCategory({ name: form.name, type: form.type });
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

const handleDelete = async (category: Category) => {
  if (category.isSystem) {
    ElMessage.warning('系统分类不能删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', { type: 'warning' });
    await categoryStore.deleteCategory(category.id);
    ElMessage.success('删除成功');
  } catch {
    // 取消删除
  }
};

onMounted(() => {
  categoryStore.fetchCategories();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.type-tabs {
  margin-bottom: 20px;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.category-info {
  display: flex;
  align-items: center;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #fff;
}

.category-icon.expense {
  background: #f56c6c;
}

.category-icon.income {
  background: #67c23a;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

/* 移动端样式 */
.is-mobile .page-header {
  flex-direction: row;
  justify-content: space-between;
}

.is-mobile .type-tabs {
  overflow-x: auto;
}

.category-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-card-mobile {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  gap: 12px;
}

.category-card-mobile .category-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.category-card-mobile .category-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #303133;
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
  .category-manage-page .page-card {
    padding: 16px;
  }
  
  .category-list {
    grid-template-columns: 1fr;
  }
}
</style>
