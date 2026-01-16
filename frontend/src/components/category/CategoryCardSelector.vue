<template>
  <div class="category-selector">
    <div class="section-title">选择分类</div>
    <div v-if="sortedCategories.length === 0" class="empty-tip">
      暂无分类
    </div>
    <template v-else>
      <div class="category-grid" :class="{ 'category-grid--mobile': isMobile }">
        <div
          v-for="cat in displayedCategories"
          :key="cat.id"
          class="category-item"
          :class="{ active: modelValue === cat.id }"
          :title="cat.name"
          @click="selectCategory(cat.id)"
        >
          <el-icon><component :is="getIconComponent(cat.icon)" /></el-icon>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
      <!-- 展开/收起按钮 -->
      <div v-if="hasMore" class="expand-btn" @click="toggleExpand">
        <span>{{ isExpanded ? '收起' : `展开全部 (${sortedCategories.length})` }}</span>
        <el-icon :class="{ 'is-expanded': isExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import type { Category } from '@/types';
import { getIconComponent } from '@/utils/iconMap';
import { useDevice } from '@/composables/useDevice';
import { useCategoryUsage } from '@/composables/useCategoryUsage';

interface Props {
  modelValue: number | null;
  categories: Category[];
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);
const { getSortedCategories } = useCategoryUsage();

// 展开状态
const isExpanded = ref(false);

// 默认显示数量：移动端8个（2行x4列），PC端10个（2行x5列）
const defaultVisibleCount = computed(() => isMobile.value ? 8 : 10);

// 排序后的分类列表（最近使用的在前面）
const sortedCategories = computed(() => getSortedCategories(props.categories));

// 是否有更多分类需要展开
const hasMore = computed(() => sortedCategories.value.length > defaultVisibleCount.value);

// 当前显示的分类列表
const displayedCategories = computed(() => {
  if (isExpanded.value || !hasMore.value) {
    return sortedCategories.value;
  }
  return sortedCategories.value.slice(0, defaultVisibleCount.value);
});

const selectCategory = (categoryId: number) => {
  emit('update:modelValue', categoryId);
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 当分类列表变化时，重置展开状态
watch(() => props.categories, () => {
  isExpanded.value = false;
});
</script>

<style scoped>
.category-selector {
  margin-bottom: 24px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.section-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

/* PC端：每行5个 */
.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  width: 100%;
}

/* 移动端：每行4个 */
.category-grid--mobile {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm, 8px);
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
  min-height: var(--touch-target-min, 44px);
  min-width: 0;
  overflow: hidden;
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

.category-name {
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
  line-height: 1.3;
}

/* 展开/收起按钮 */
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  padding: 8px;
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.expand-btn:hover {
  color: #66b1ff;
}

.expand-btn .el-icon {
  transition: transform 0.3s;
}

.expand-btn .el-icon.is-expanded {
  transform: rotate(180deg);
}
</style>
