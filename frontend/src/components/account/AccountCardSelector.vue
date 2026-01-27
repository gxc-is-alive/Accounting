<template>
  <div class="account-selector">
    <div class="section-title">选择账户</div>
    <div v-if="sortedAccounts.length === 0" class="empty-tip">
      暂无账户，请先创建账户
    </div>
    <template v-else>
      <!-- 搜索框 -->
      <el-input
        v-model="searchQuery"
        placeholder="搜索账户..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <!-- 空搜索结果提示 -->
      <div v-if="filteredAccounts.length === 0 && searchQuery.trim()" class="empty-tip">
        未找到匹配的账户
      </div>
      <div v-else class="account-grid" :class="{ 'account-grid--mobile': isMobile }">
        <div
          v-for="account in displayedAccounts"
          :key="account.id"
          class="account-item"
          :class="{ active: modelValue === account.id }"
          :title="`${getAccountTypeName(account.type)} - ${account.name}`"
          @click="selectAccount(account.id)"
        >
          <el-icon><component :is="getAccountIcon(account)" /></el-icon>
          <span class="account-type">{{ getAccountTypeName(account.type) }}</span>
          <span class="account-name">{{ account.name }}</span>
        </div>
      </div>
      <!-- 展开/收起按钮 -->
      <div v-if="hasMore && filteredAccounts.length > 0" class="expand-btn" @click="toggleExpand">
        <span>{{ isExpanded ? '收起' : `展开全部 (${filteredAccounts.length})` }}</span>
        <el-icon :class="{ 'is-expanded': isExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowDown, Search } from '@element-plus/icons-vue';
import type { Account } from '@/types';
import { getAccountIcon } from '@/utils/iconMap';
import { useDevice } from '@/composables/useDevice';

interface Props {
  modelValue: number | null;
  accounts: Account[];
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

// 搜索关键词
const searchQuery = ref('');

// 展开状态
const isExpanded = ref(false);

// 默认显示数量：移动端4个（2行x2列），PC端6个（2行x3列）
const defaultVisibleCount = computed(() => isMobile.value ? 4 : 6);

// 账户类型名称映射
const accountTypeNames: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  alipay: '支付宝',
  wechat: '微信',
  credit: '信用卡',
  investment: '投资',
  other: '其他',
};

const getAccountTypeName = (type: string): string => {
  return accountTypeNames[type] || type;
};

// 直接使用传入的账户列表（排序由父组件处理）
const sortedAccounts = computed(() => props.accounts);

// 搜索过滤后的账户列表
const filteredAccounts = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedAccounts.value;
  }
  const query = searchQuery.value.toLowerCase();
  return sortedAccounts.value.filter((account) =>
    account.name.toLowerCase().includes(query)
  );
});

// 是否有更多账户需要展开
const hasMore = computed(() => filteredAccounts.value.length > defaultVisibleCount.value);

// 当前显示的账户列表
const displayedAccounts = computed(() => {
  if (isExpanded.value || !hasMore.value) {
    return filteredAccounts.value;
  }
  return filteredAccounts.value.slice(0, defaultVisibleCount.value);
});

const selectAccount = (accountId: number) => {
  emit('update:modelValue', accountId);
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.account-selector {
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

.search-input {
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

/* PC端：每行3个 */
.account-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

/* 移动端：每行2个 */
.account-grid--mobile {
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm, 8px);
}

.account-item {
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

.account-item:hover {
  background: #e6f7ff;
}

.account-item:active {
  transform: scale(0.95);
}

.account-item.active {
  background: #409eff;
  color: #fff;
}

.account-item.active .account-type {
  color: rgba(255, 255, 255, 0.8);
}

.account-type {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
}

.account-name {
  font-size: 12px;
  margin-top: 2px;
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
