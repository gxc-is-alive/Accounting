<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <div class="profile-card">
      <div class="profile-avatar">
        <el-avatar :size="64" icon="UserFilled" />
      </div>
      <div class="profile-info">
        <div class="profile-name">{{ userStore.user?.nickname || '未登录' }}</div>
        <div class="profile-email">{{ userStore.user?.email || '' }}</div>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="profile-section">
      <div class="section-title">家庭</div>
      <div class="mobile-list">
        <router-link to="/family" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><House /></el-icon>
          <span class="item-text">家庭管理</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
        <router-link to="/family/transactions" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><Tickets /></el-icon>
          <span class="item-text">家庭账目</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
      </div>
    </div>

    <div class="profile-section">
      <div class="section-title">财务</div>
      <div class="mobile-list">
        <router-link to="/budget" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><Wallet /></el-icon>
          <span class="item-text">预算管理</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
        <router-link to="/ai" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><ChatDotRound /></el-icon>
          <span class="item-text">AI 助手</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
      </div>
    </div>

    <div class="profile-section">
      <div class="section-title">设置</div>
      <div class="mobile-list">
        <router-link to="/settings/accounts" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><CreditCard /></el-icon>
          <span class="item-text">账户管理</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
        <router-link to="/settings/categories" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><Grid /></el-icon>
          <span class="item-text">分类管理</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
        <router-link to="/settings/bill-types" class="mobile-list-item touchable">
          <el-icon :size="20" class="item-icon"><Document /></el-icon>
          <span class="item-text">账单类型</span>
          <el-icon :size="16" class="item-arrow"><ArrowRight /></el-icon>
        </router-link>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="profile-section">
      <div class="mobile-list">
        <button class="mobile-list-item touchable logout-btn" @click="handleLogout">
          <el-icon :size="20" class="item-icon item-icon--danger"><SwitchButton /></el-icon>
          <span class="item-text item-text--danger">退出登录</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import {
  House,
  Tickets,
  Wallet,
  ChatDotRound,
  CreditCard,
  Grid,
  Document,
  SwitchButton,
  ArrowRight,
} from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await userStore.logout();
    router.push('/login');
  } catch {
    // 取消退出
  }
};
</script>

<style scoped>
.profile-page {
  padding-bottom: var(--spacing-lg, 24px);
}

.profile-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg, 24px);
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  margin-bottom: var(--spacing-md, 16px);
}

.profile-avatar {
  margin-right: var(--spacing-md, 16px);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  margin-bottom: 4px;
}

.profile-email {
  font-size: 14px;
  color: var(--text-secondary, #909399);
}

.profile-section {
  margin-bottom: var(--spacing-md, 16px);
}

.section-title {
  font-size: 13px;
  color: var(--text-secondary, #909399);
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
}

.mobile-list {
  background: var(--bg-card, #fff);
  border-radius: var(--border-radius-md, 8px);
  overflow: hidden;
}

.mobile-list-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md, 16px);
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  text-decoration: none;
  color: var(--text-primary, #303133);
  min-height: var(--touch-target-min, 44px);
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.mobile-list-item:last-child {
  border-bottom: none;
}

.mobile-list-item:active {
  background: var(--bg-page, #f5f7fa);
}

.item-icon {
  margin-right: var(--spacing-md, 16px);
  color: var(--text-secondary, #909399);
}

.item-icon--danger {
  color: var(--color-danger, #f56c6c);
}

.item-text {
  flex: 1;
  font-size: 15px;
}

.item-text--danger {
  color: var(--color-danger, #f56c6c);
}

.item-arrow {
  color: var(--text-placeholder, #c0c4cc);
}

.logout-btn {
  justify-content: flex-start;
}
</style>
