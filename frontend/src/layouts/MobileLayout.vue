<template>
  <div class="mobile-layout">
    <!-- 顶部栏 -->
    <MobileHeader
      v-if="showHeader"
      :title="pageTitle"
      :show-back="showBack"
      :border="headerBorder"
      @back="handleBack"
    >
      <template #left>
        <slot name="header-left">
          <button
            v-if="showBack"
            class="mobile-header__back touchable touch-target"
            @click="handleBack"
          >
            <el-icon :size="20"><ArrowLeft /></el-icon>
          </button>
        </slot>
      </template>
      <template #title>
        <slot name="header-title">{{ pageTitle }}</slot>
      </template>
      <template #right>
        <slot name="header-right"></slot>
      </template>
    </MobileHeader>

    <!-- 主内容区域 -->
    <main
      class="mobile-layout__content scroll-container"
      :class="{
        'mobile-layout__content--with-header': showHeader,
        'mobile-layout__content--with-tabbar': showTabBar,
      }"
    >
      <slot></slot>
    </main>

    <!-- 底部标签栏 -->
    <MobileTabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import MobileHeader from '@/components/mobile/MobileHeader.vue';
import MobileTabBar from '@/components/mobile/MobileTabBar.vue';

interface Props {
  /** 页面标题，默认从路由 meta 获取 */
  title?: string;
  /** 是否显示顶部栏 */
  showHeader?: boolean;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 是否显示底部标签栏 */
  showTabBar?: boolean;
  /** 顶部栏是否显示边框 */
  headerBorder?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showHeader: true,
  showBack: true,
  showTabBar: true,
  headerBorder: true,
});

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const route = useRoute();
const router = useRouter();

// 路由名称映射
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
  '/investment': '定投管理',
  '/ai': 'AI 助手',
  '/profile': '我的',
};

const pageTitle = computed(() => {
  if (props.title) return props.title;
  return routeNames[route.path] || (route.meta?.title as string) || '';
});

const handleBack = () => {
  emit('back');
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// 阻止下拉刷新
let startY = 0;

const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  const target = e.currentTarget as HTMLElement;
  const scrollTop = target.scrollTop;
  const deltaY = e.touches[0].clientY - startY;
  
  // 如果在顶部且向下滑动，阻止默认行为（下拉刷新）
  if (scrollTop === 0 && deltaY > 0) {
    e.preventDefault();
  }
  
  // 如果在底部且向上滑动，阻止默认行为
  const isAtBottom = scrollTop + target.clientHeight >= target.scrollHeight;
  if (isAtBottom && deltaY < 0) {
    e.preventDefault();
  }
};

onMounted(() => {
  const content = document.querySelector('.mobile-layout__content');
  if (content) {
    content.addEventListener('touchstart', handleTouchStart as any, { passive: false });
    content.addEventListener('touchmove', handleTouchMove as any, { passive: false });
  }
});

onUnmounted(() => {
  const content = document.querySelector('.mobile-layout__content');
  if (content) {
    content.removeEventListener('touchstart', handleTouchStart as any);
    content.removeEventListener('touchmove', handleTouchMove as any);
  }
});
</script>

<style scoped>
.mobile-layout {
  height: 100vh;
  background: var(--bg-page, #f5f7fa);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: none;
}

.mobile-layout__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding: var(--spacing-md, 16px);
  box-sizing: border-box;
}

.mobile-layout__content--with-header {
  padding-top: calc(var(--mobile-header-height, 50px) + var(--spacing-md, 16px));
}

.mobile-layout__content--with-tabbar {
  padding-bottom: calc(var(--mobile-tabbar-height, 56px) + var(--mobile-safe-area-bottom, 0px) + var(--spacing-md, 16px));
}

/* 返回按钮样式 */
.mobile-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min, 44px);
  height: var(--touch-target-min, 44px);
  border: none;
  background: transparent;
  color: var(--text-primary, #303133);
  cursor: pointer;
  border-radius: var(--border-radius-sm, 4px);
}

.mobile-header__back:active {
  background: var(--bg-page, #f5f7fa);
}
</style>
