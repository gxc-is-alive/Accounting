<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h1>家庭记账</h1>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/add">
          <el-icon><Plus /></el-icon>
          <span>记一笔</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><List /></el-icon>
          <span>账单明细</span>
        </el-menu-item>
        <el-sub-menu index="statistics">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>统计报表</span>
          </template>
          <el-menu-item index="/statistics">月度报表</el-menu-item>
          <el-menu-item index="/statistics/yearly">年度报表</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/budget">
          <el-icon><Wallet /></el-icon>
          <span>预算管理</span>
        </el-menu-item>
        <el-sub-menu index="family">
          <template #title>
            <el-icon><User /></el-icon>
            <span>家庭</span>
          </template>
          <el-menu-item index="/family">家庭管理</el-menu-item>
          <el-menu-item index="/family/transactions">家庭账目</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </template>
          <el-menu-item index="/settings/accounts">账户管理</el-menu-item>
          <el-menu-item index="/settings/categories">分类管理</el-menu-item>
          <el-menu-item index="/settings/bill-types">账单类型</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/ai">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 助手</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="nickname">{{ userStore.user?.nickname }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  HomeFilled,
  Plus,
  List,
  DataAnalysis,
  Wallet,
  User,
  Setting,
  ChatDotRound,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

const routeNames: Record<string, string> = {
  '/': '首页',
  '/add': '记一笔',
  '/transactions': '账单明细',
  '/statistics': '月度报表',
  '/statistics/yearly': '年度报表',
  '/budget': '预算管理',
  '/family': '家庭管理',
  '/family/transactions': '家庭账目',
  '/settings/accounts': '账户管理',
  '/settings/categories': '分类管理',
  '/settings/bill-types': '账单类型',
  '/ai': 'AI 助手',
};

const currentRoute = computed(() => routeNames[route.path] || '');

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await userStore.logout();
    router.push('/login');
  }
};
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100%;
}

.main-layout > .el-container {
  flex: 1;
  min-width: 0;
}

.sidebar {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h1 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.nickname {
  margin-left: 8px;
  color: #333;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
