<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useDevice } from '@/composables/useDevice';

const { isMobile, isTablet } = useDevice();

// 懒加载布局组件
const MainLayout = defineAsyncComponent(() => import('@/layouts/MainLayout.vue'));
const MobileLayout = defineAsyncComponent(() => import('@/layouts/MobileLayout.vue'));

// 根据设备类型选择布局
const layoutComponent = computed(() => {
  if (isMobile.value || isTablet.value) {
    return MobileLayout;
  }
  return MainLayout;
});
</script>
