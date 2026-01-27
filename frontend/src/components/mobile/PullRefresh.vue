<template>
  <div
    class="pull-refresh"
    ref="containerRef"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 下拉提示区域 -->
    <div
      class="pull-refresh__track"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <div class="pull-refresh__head" :style="{ height: `${headHeight}px` }">
        <div class="pull-refresh__text">
          <template v-if="status === 'pulling'">
            <el-icon class="pull-refresh__icon"><ArrowDown /></el-icon>
            <span>{{ pullText }}</span>
          </template>
          <template v-else-if="status === 'loosing'">
            <el-icon class="pull-refresh__icon rotate"><ArrowUp /></el-icon>
            <span>{{ releaseText }}</span>
          </template>
          <template v-else-if="status === 'loading'">
            <el-icon class="pull-refresh__icon loading"><Loading /></el-icon>
            <span>{{ loadingText }}</span>
          </template>
          <template v-else-if="status === 'success'">
            <el-icon class="pull-refresh__icon success"><Check /></el-icon>
            <span>{{ successText }}</span>
          </template>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="pull-refresh__content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowDown, ArrowUp, Loading, Check } from '@element-plus/icons-vue'

type PullRefreshStatus = 'normal' | 'pulling' | 'loosing' | 'loading' | 'success'

interface Props {
  loading?: boolean
  pullText?: string
  releaseText?: string
  loadingText?: string
  successText?: string
  threshold?: number
  headHeight?: number
  successDuration?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pullText: '下拉刷新',
  releaseText: '释放立即刷新',
  loadingText: '加载中...',
  successText: '刷新成功',
  threshold: 50,
  headHeight: 50,
  successDuration: 500,
  disabled: false
})

const emit = defineEmits<{
  refresh: []
  'update:loading': [value: boolean]
}>()

const containerRef = ref<HTMLElement | null>(null)
const status = ref<PullRefreshStatus>('normal')
const pullDistance = ref(0)

// 触摸状态
let startY = 0
let deltaY = 0
let isTouching = false

// 计算是否可以下拉
const canPull = computed(() => {
  return !props.disabled && !props.loading && status.value !== 'loading'
})

// 检查是否滚动到顶部
const checkReachTop = (): boolean => {
  // 检查所有可能的滚动容器
  let scrollTop = 0
  
  // 1. 检查容器自身的滚动
  if (containerRef.value && containerRef.value.scrollTop > 0) {
    return false
  }
  
  // 2. 检查父元素的滚动（向上查找可滚动的父元素）
  let parent = containerRef.value?.parentElement
  while (parent) {
    const overflow = window.getComputedStyle(parent).overflowY
    if ((overflow === 'auto' || overflow === 'scroll') && parent.scrollTop > 0) {
      return false
    }
    parent = parent.parentElement
  }
  
  // 3. 检查 window/document 的滚动位置
  scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  return scrollTop <= 0
}

// 触摸开始
const onTouchStart = (e: TouchEvent) => {
  if (!canPull.value) return
  
  isTouching = true
  startY = e.touches[0].clientY
  deltaY = 0
}

// 触摸移动
const onTouchMove = (e: TouchEvent) => {
  if (!isTouching || !canPull.value) return
  
  const currentY = e.touches[0].clientY
  deltaY = currentY - startY
  
  // 实时检查是否在顶部
  const atTop = checkReachTop()
  
  // 只有在顶部且向下拉时才触发下拉刷新
  if (!atTop || deltaY <= 0) {
    // 不在顶部或向上滑动，重置状态，允许正常滚动
    if (pullDistance.value > 0) {
      pullDistance.value = 0
      status.value = 'normal'
    }
    return
  }
  
  // 在顶部且向下拉，阻止默认滚动
  e.preventDefault()
  
  // 阻尼效果：下拉距离越大，阻力越大
  const dampingRatio = deltaY > props.threshold ? 0.4 : 0.6
  pullDistance.value = deltaY * dampingRatio
  
  // 更新状态
  if (pullDistance.value >= props.threshold) {
    status.value = 'loosing'
  } else {
    status.value = 'pulling'
  }
}

// 触摸结束
const onTouchEnd = () => {
  if (!isTouching) return
  
  isTouching = false
  
  if (status.value === 'loosing') {
    // 触发刷新
    status.value = 'loading'
    pullDistance.value = props.headHeight
    emit('refresh')
    emit('update:loading', true)
  } else {
    // 回弹
    pullDistance.value = 0
    status.value = 'normal'
  }
}

// 监听 loading 状态变化
watch(() => props.loading, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    // 加载完成，显示成功状态
    status.value = 'success'
    setTimeout(() => {
      pullDistance.value = 0
      status.value = 'normal'
    }, props.successDuration)
  }
})
</script>

<style scoped>
.pull-refresh {
  position: relative;
}

.pull-refresh__track {
  position: relative;
  transition: transform var(--transition-normal, 0.3s) ease;
}

.pull-refresh__head {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  transform: translateY(-100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pull-refresh__text {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 14px;
}

.pull-refresh__icon {
  font-size: 18px;
  transition: transform var(--transition-fast);
}

.pull-refresh__icon.rotate {
  transform: rotate(180deg);
}

.pull-refresh__icon.loading {
  animation: rotate 1s linear infinite;
}

.pull-refresh__icon.success {
  color: var(--color-success);
}

.pull-refresh__content {
  min-height: 100%;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
