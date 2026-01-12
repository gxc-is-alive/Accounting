<template>
  <header class="mobile-header" :class="{ 'mobile-header--border': border }">
    <div class="mobile-header__left">
      <slot name="left">
        <button
          v-if="showBack"
          class="mobile-header__back touchable touch-target"
          @click="handleBack"
        >
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </button>
      </slot>
    </div>
    
    <div class="mobile-header__title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    
    <div class="mobile-header__right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';

interface Props {
  /** 标题 */
  title?: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 是否显示底部边框 */
  border?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showBack: true,
  border: true,
});

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const router = useRouter();

const handleBack = () => {
  emit('back');
  // 如果没有监听 back 事件，则默认返回上一页
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--mobile-header-height, 50px);
  background: var(--bg-card, #fff);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-sm, 8px);
  z-index: 100;
  box-shadow: var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05));
}

.mobile-header--border {
  border-bottom: 1px solid var(--border-color, #dcdfe6);
}

.mobile-header__left,
.mobile-header__right {
  flex: 0 0 auto;
  min-width: 60px;
  display: flex;
  align-items: center;
}

.mobile-header__right {
  justify-content: flex-end;
}

.mobile-header__title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
