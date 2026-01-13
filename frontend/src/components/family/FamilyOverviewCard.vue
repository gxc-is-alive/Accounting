<template>
  <div class="family-overview-card" :class="{ 'family-overview-card--mobile': isMobile }">
    <div class="card-header">
      <div class="header-left">
        <el-icon size="20"><House /></el-icon>
        <span class="family-name">{{ overview?.familyName || '家庭概览' }}</span>
      </div>
      <div class="header-right">
        <el-select
          v-if="families.length > 1"
          v-model="selectedFamilyId"
          size="small"
          placeholder="选择家庭"
          @change="onFamilyChange"
        >
          <el-option
            v-for="family in families"
            :key="family.id"
            :label="family.name"
            :value="family.id"
          />
        </el-select>
        <el-button
          type="primary"
          link
          size="small"
          @click="$emit('viewDetail')"
        >
          查看详情
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <template v-else-if="overview">
      <!-- 收支概览 -->
      <div class="stat-row">
        <div class="stat-item income">
          <span class="stat-label">家庭收入</span>
          <span class="stat-value">¥{{ formatAmount(overview.totalIncome) }}</span>
        </div>
        <div class="stat-item expense">
          <span class="stat-label">家庭支出</span>
          <span class="stat-value">¥{{ formatAmount(overview.totalExpense) }}</span>
        </div>
        <div class="stat-item balance">
          <span class="stat-label">本月结余</span>
          <span class="stat-value" :class="overview.balance >= 0 ? 'positive' : 'negative'">
            ¥{{ formatAmount(overview.balance) }}
          </span>
        </div>
      </div>

      <!-- 总资产 -->
      <div class="assets-row">
        <div class="assets-info">
          <el-icon><Wallet /></el-icon>
          <span>家庭总资产</span>
        </div>
        <span class="assets-value">¥{{ formatAmount(overview.totalAssets) }}</span>
      </div>

      <!-- 成员贡献 -->
      <div class="members-section">
        <div class="section-title">
          <span>成员贡献 ({{ overview.memberCount }}人)</span>
        </div>
        <div class="member-list">
          <div
            v-for="member in overview.memberContributions"
            :key="member.userId"
            class="member-item"
          >
            <div class="member-info">
              <el-avatar :size="isMobile ? 28 : 32">
                {{ member.nickname.charAt(0) }}
              </el-avatar>
              <span class="member-name">{{ member.nickname }}</span>
            </div>
            <div class="member-stats">
              <span class="member-expense">
                支出 {{ member.expensePercentage.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无家庭数据" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { House, Wallet } from '@element-plus/icons-vue';
import type { Family, FamilyOverview } from '@/types';
import { familyApi, statisticsApi } from '@/api';
import { useDevice } from '@/composables/useDevice';

const props = defineProps<{
  initialFamilyId?: number;
}>();

const emit = defineEmits<{
  viewDetail: [];
  familyChange: [familyId: number];
}>();

const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

const loading = ref(false);
const families = ref<Family[]>([]);
const selectedFamilyId = ref<number | null>(null);
const overview = ref<FamilyOverview | null>(null);

const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const loadFamilies = async () => {
  try {
    const res = await familyApi.list() as unknown as { success: boolean; data: Family[] };
    if (res.success && res.data) {
      families.value = res.data;
      if (families.value.length > 0) {
        selectedFamilyId.value = props.initialFamilyId || families.value[0].id;
      }
    }
  } catch (error) {
    console.error('加载家庭列表失败:', error);
  }
};

const loadOverview = async () => {
  if (!selectedFamilyId.value) return;

  loading.value = true;
  try {
    const month = getCurrentMonth();
    const res = await statisticsApi.familyOverview(selectedFamilyId.value, month) as unknown as {
      success: boolean;
      data: FamilyOverview;
    };
    if (res.success && res.data) {
      overview.value = res.data;
    }
  } catch (error) {
    console.error('加载家庭概览失败:', error);
    overview.value = null;
  } finally {
    loading.value = false;
  }
};

const onFamilyChange = (familyId: number) => {
  emit('familyChange', familyId);
  loadOverview();
};

// 暴露刷新方法
const refresh = async () => {
  await loadOverview();
};

defineExpose({ refresh });

watch(() => props.initialFamilyId, (newId) => {
  if (newId && newId !== selectedFamilyId.value) {
    selectedFamilyId.value = newId;
    loadOverview();
  }
});

onMounted(async () => {
  await loadFamilies();
  if (selectedFamilyId.value) {
    await loadOverview();
  }
});
</script>


<style scoped>
.family-overview-card {
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  padding: 20px;
  box-shadow: var(--shadow-sm, 0 2px 12px rgba(0, 0, 0, 0.05));
}

.family-overview-card--mobile {
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

.family-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-state {
  padding: 20px 0;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.family-overview-card--mobile .stat-row {
  grid-template-columns: 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-secondary, #f5f7fa);
}

.family-overview-card--mobile .stat-item {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
}

.stat-item.income {
  background: rgba(103, 194, 58, 0.1);
}

.stat-item.expense {
  background: rgba(245, 108, 108, 0.1);
}

.stat-item.balance {
  background: rgba(64, 158, 255, 0.1);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin-bottom: 4px;
}

.family-overview-card--mobile .stat-label {
  margin-bottom: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.family-overview-card--mobile .stat-value {
  font-size: 16px;
}

.stat-value.positive {
  color: var(--color-success, #67c23a);
}

.stat-value.negative {
  color: var(--color-danger, #f56c6c);
}

.assets-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  color: #fff;
}

.assets-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.assets-value {
  font-size: 20px;
  font-weight: 600;
}

.family-overview-card--mobile .assets-value {
  font-size: 18px;
}

.members-section {
  margin-top: 12px;
}

.section-title {
  font-size: 14px;
  color: var(--text-secondary, #909399);
  margin-bottom: 12px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
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

.member-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.member-expense {
  color: var(--color-danger, #f56c6c);
}
</style>
