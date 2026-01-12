<template>
  <nav class="mobile-tabbar safe-area-bottom">
    <router-link
      v-for="tab in tabs"
      :key="tab.path"
      :to="tab.path"
      class="mobile-tabbar__item touchable"
      :class="{ 
        'mobile-tabbar__item--active': isActive(tab.path),
        'mobile-tabbar__item--center': tab.isCenter
      }"
    >
      <div class="mobile-tabbar__icon" :class="{ 'mobile-tabbar__icon--center': tab.isCenter }">
        <el-icon :size="tab.isCenter ? 28 : 24">
          <component :is="tab.icon" />
        </el-icon>
      </div>
      <span class="mobile-tabbar__label">{{ tab.name }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import {
  HomeFilled,
  Plus,
  List,
  DataAnalysis,
  User,
} from '@element-plus/icons-vue';

interface TabItem {
  name: string;
  path: string;
  icon: typeof HomeFilled;
  /** 匹配的路径前缀，用于高亮 */
  matchPaths?: string[];
  /** 是否是中间突出按钮 */
  isCenter?: boolean;
}

const route = useRoute();

const tabs: TabItem[] = [
  {
    name: '首页',
    path: '/',
    icon: HomeFilled,
    matchPaths: ['/'],
  },
  {
    name: '账单',
    path: '/transactions',
    icon: List,
    matchPaths: ['/transactions'],
  },
  {
    name: '记账',
    path: '/add',
    icon: Plus,
    matchPaths: ['/add'],
    isCenter: true, // 中间突出按钮
  },
  {
    name: '统计',
    path: '/statistics',
    icon: DataAnalysis,
    matchPaths: ['/statistics'],
  },
  {
    name: '我的',
    path: '/profile',
    icon: User,
    matchPaths: ['/profile', '/settings', '/family', '/ai', '/budget'],
  },
];

const isActive = (path: string) => {
  const tab = tabs.find(t => t.path === path);
  if (!tab) return false;
  
  // 首页精确匹配
  if (path === '/') {
    return route.path === '/';
  }
  
  // 其他页面前缀匹配
  if (tab.matchPaths) {
    return tab.matchPaths.some(p => route.path.startsWith(p));
  }
  
  return route.path.startsWith(path);
};
</script>

<style scoped>
.mobile-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--mobile-tabbar-height, 56px);
  background: var(--bg-card, #fff);
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  border-top: 1px solid var(--border-color, #dcdfe6);
  z-index: 100;
  padding-bottom: var(--mobile-safe-area-bottom, 0);
}

.mobile-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target-min, 44px);
  min-height: var(--touch-target-min, 44px);
  text-decoration: none;
  color: var(--text-secondary, #909399);
  transition: color var(--transition-fast, 0.15s);
  -webkit-tap-highlight-color: transparent;
}

.mobile-tabbar__item:active {
  opacity: 0.7;
}

.mobile-tabbar__item--active {
  color: var(--color-primary, #409eff);
}

.mobile-tabbar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.mobile-tabbar__label {
  font-size: 11px;
  line-height: 1.2;
}

/* 中间的记账按钮特殊样式 */
.mobile-tabbar__item--center .mobile-tabbar__icon--center {
  width: 48px;
  height: 48px;
  background: var(--color-primary, #409eff);
  border-radius: 50%;
  color: #fff;
  margin-top: -12px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.mobile-tabbar__item--center {
  color: var(--text-secondary, #909399);
}

.mobile-tabbar__item--center.mobile-tabbar__item--active {
  color: var(--color-primary, #409eff);
}

.mobile-tabbar__item--center .mobile-tabbar__icon--center {
  color: #fff;
}
</style>
