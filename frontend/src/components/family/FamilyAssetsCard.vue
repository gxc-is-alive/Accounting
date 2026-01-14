<template>
  <div class="family-assets-card" :class="{ 'family-assets-card--mobile': isMobile }">
    <div class="card-header">
      <div class="header-left">
        <el-icon size="20"><Wallet /></el-icon>
        <span class="card-title">家庭资产</span>
      </div>
      <el-button type="primary" link size="small" @click="$emit('viewDetail')">
        查看详情
      </el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <template v-else-if="assets">
      <!-- 总资产 -->
      <div class="total-assets">
        <span class="total-label">家庭总资产</span>
        <span class="total-value">¥{{ formatAmount(assets.totalAssets) }}</span>
      </div>

      <!-- 按账户类型汇总 -->
      <div class="type-summary">
        <div
          v-for="item in assets.byAccountType"
          :key="item.type"
          class="type-item"
        >
          <span class="type-name">{{ item.typeName }}</span>
          <span class="type-amount">¥{{ formatAmount(item.total) }}</span>
        </div>
      </div>

      <!-- 按成员分组 -->
      <div class="member-assets">
        <div class="section-title">成员资产</div>
        <div
          v-for="member in assets.byMember"
          :key="member.userId"
          class="member-item"
        >
          <div class="member-header" @click="toggleMember(member.userId)">
            <div class="member-info">
              <el-avatar :size="isMobile ? 28 : 32">
                {{ member.nickname.charAt(0) }}
              </el-avatar>
              <span class="member-name">{{ member.nickname }}</span>
            </div>
            <div class="member-total">
              <span class="member-balance">¥{{ formatAmount(member.totalBalance) }}</span>
              <el-icon :class="{ 'is-expanded': expandedMembers.has(member.userId) }">
                <ArrowDown />
              </el-icon>
            </div>
          </div>
          <div v-if="expandedMembers.has(member.userId)" class="member-accounts">
            <div
              v-for="account in member.accounts"
              :key="account.id"
              class="account-item"
            >
              <span class="account-name">{{ account.name }}</span>
              <span class="account-balance">¥{{ formatAmount(account.balance) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无资产数据" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Wallet, ArrowDown } from '@element-plus/icons-vue';
import type { FamilyAssets } from '@/types';
import { statisticsApi } from '@/api';
import { useDevice } from '@/composables/useDevice';

const props = defineProps<{
  familyId: number;
}>();

defineEmits<{
  viewDetail: [];
}>();

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const loading = ref(false);
const assets = ref<FamilyAssets | null>(null);
const expandedMembers = ref<Set<number>>(new Set());

const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

const toggleMember = (userId: number) => {
  if (expandedMembers.value.has(userId)) {
    expandedMembers.value.delete(userId);
  } else {
    expandedMembers.value.add(userId);
  }
};

const loadAssets = async () => {
  if (!props.familyId) return;

  loading.value = true;
  try {
    const res = await statisticsApi.familyAssets(props.familyId) as unknown as {
      success: boolean;
      data: FamilyAssets;
    };
    if (res.success && res.data) {
      assets.value = res.data;
    }
  } catch (error) {
    console.error('加载家庭资产失败:', error);
    assets.value = null;
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  await loadAssets();
};

defineExpose({ refresh });

watch(() => props.familyId, () => {
  loadAssets();
});

onMounted(() => {
  loadAssets();
});
</script>

<style scoped>
.family-assets-card {
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  padding: 20px;
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.05));
}

.family-assets-card--mobile {
  padding: var(--spacing-md, 16px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary, #409eff);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.loading-state {
  padding: 20px 0;
}

.total-assets {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  color: #fff;
}

.total-label {
  font-size: 14px;
}

.total-value {
  font-size: 24px;
  font-weight: 600;
}

.family-assets-card--mobile .total-value {
  font-size: 20px;
}

.type-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.type-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--bg-secondary, #f5f7fa);
  border-radius: 8px;
}

.type-name {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-bottom: 4px;
}

.type-amount {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.member-assets {
  margin-top: 16px;
}

.section-title {
  font-size: 14px;
  color: var(--text-secondary, #909399);
  margin-bottom: 12px;
}

.member-item {
  margin-bottom: 8px;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 8px;
  overflow: hidden;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-header:hover {
  background: var(--bg-secondary, #f5f7fa);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-name {
  font-size: 14px;
  color: var(--text-primary, #303133);
}

.member-total {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-balance {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.member-total .el-icon {
  transition: transform 0.2s;
  color: var(--text-secondary, #909399);
}

.member-total .el-icon.is-expanded {
  transform: rotate(180deg);
}

.member-accounts {
  padding: 0 12px 12px;
  background: var(--bg-secondary, #f5f7fa);
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.account-item:last-child {
  border-bottom: none;
}

.account-name {
  font-size: 13px;
  color: var(--text-secondary, #909399);
}

.account-balance {
  font-size: 13px;
  color: var(--text-primary, #303133);
}
</style>
