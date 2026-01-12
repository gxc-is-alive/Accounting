<template>
  <div class="skeleton" :class="[`skeleton--${variant}`, { 'skeleton--animated': animated }]">
    <!-- 卡片骨架 -->
    <template v-if="variant === 'card'">
      <div class="skeleton-card" v-for="i in count" :key="i">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-title-group">
            <div class="skeleton-title"></div>
            <div class="skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
      </div>
    </template>

    <!-- 列表骨架 -->
    <template v-else-if="variant === 'list'">
      <div class="skeleton-list-item" v-for="i in count" :key="i">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-group">
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--short"></div>
        </div>
        <div class="skeleton-action"></div>
      </div>
    </template>

    <!-- 统计卡片骨架 -->
    <template v-else-if="variant === 'stat'">
      <div class="skeleton-stat" v-for="i in count" :key="i">
        <div class="skeleton-stat-label"></div>
        <div class="skeleton-stat-value"></div>
      </div>
    </template>

    <!-- 图表骨架 -->
    <template v-else-if="variant === 'chart'">
      <div class="skeleton-chart">
        <div class="skeleton-chart-title"></div>
        <div class="skeleton-chart-area"></div>
      </div>
    </template>

    <!-- 文本骨架 -->
    <template v-else>
      <div class="skeleton-line" v-for="i in count" :key="i" :style="getLineStyle(i)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'card' | 'list' | 'stat' | 'chart'
  count?: number
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  count: 3,
  animated: true
})

function getLineStyle(index: number) {
  // 最后一行短一些
  if (index === props.count) {
    return { width: '60%' }
  }
  return {}
}
</script>

<style scoped>
.skeleton {
  width: 100%;
}

/* 动画 */
.skeleton--animated .skeleton-avatar,
.skeleton--animated .skeleton-line,
.skeleton--animated .skeleton-title,
.skeleton--animated .skeleton-subtitle,
.skeleton--animated .skeleton-action,
.skeleton--animated .skeleton-stat-label,
.skeleton--animated .skeleton-stat-value,
.skeleton--animated .skeleton-chart-title,
.skeleton--animated .skeleton-chart-area {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 基础元素 */
.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f0f0f0;
  flex-shrink: 0;
}

.skeleton-line {
  height: 16px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-line--short {
  width: 60%;
}

.skeleton-title {
  height: 18px;
  width: 120px;
  background: #f0f0f0;
  border-radius: 4px;
}

.skeleton-subtitle {
  height: 14px;
  width: 80px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-top: 8px;
}

.skeleton-action {
  width: 60px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
}

/* 卡片骨架 */
.skeleton-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-title-group {
  flex: 1;
}

.skeleton-content .skeleton-line:last-child {
  margin-bottom: 0;
}

/* 列表骨架 */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
}

.skeleton-text-group {
  flex: 1;
}

.skeleton-text-group .skeleton-line {
  margin-bottom: 8px;
}

.skeleton-text-group .skeleton-line:last-child {
  margin-bottom: 0;
}

/* 统计卡片骨架 */
.skeleton--stat {
  display: flex;
  gap: 12px;
}

.skeleton-stat {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.skeleton-stat-label {
  height: 14px;
  width: 60%;
  margin: 0 auto 12px;
  background: #f0f0f0;
  border-radius: 4px;
}

.skeleton-stat-value {
  height: 28px;
  width: 80%;
  margin: 0 auto;
  background: #f0f0f0;
  border-radius: 4px;
}

/* 图表骨架 */
.skeleton-chart {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.skeleton-chart-title {
  height: 20px;
  width: 100px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 16px;
}

.skeleton-chart-area {
  height: 200px;
  background: #f0f0f0;
  border-radius: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .skeleton--stat {
    flex-direction: column;
  }
  
  .skeleton-stat {
    padding: 14px;
  }
}
</style>
