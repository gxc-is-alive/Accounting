<template>
  <div class="swipe-action" ref="containerRef">
    <!-- 左侧操作按钮 -->
    <div
      v-if="leftActions.length"
      class="swipe-action__left"
      ref="leftRef"
      :style="{ width: `${leftWidth}px` }"
    >
      <div
        v-for="(action, index) in leftActions"
        :key="`left-${index}`"
        class="swipe-action__btn"
        :style="{
          backgroundColor: action.backgroundColor,
          color: action.color
        }"
        @click="onActionClick(action, 'left')"
      >
        <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
        <span v-if="action.text">{{ action.text }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div
      class="swipe-action__content"
      :style="{ transform: `translateX(${offset}px)` }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="onContentClick"
    >
      <slot></slot>
    </div>

    <!-- 右侧操作按钮 -->
    <div
      v-if="rightActions.length"
      class="swipe-action__right"
      ref="rightRef"
      :style="{ width: `${rightWidth}px` }"
    >
      <div
        v-for="(action, index) in rightActions"
        :key="`right-${index}`"
        class="swipe-action__btn"
        :style="{
          backgroundColor: action.backgroundColor,
          color: action.color
        }"
        @click="onActionClick(action, 'right')"
      >
        <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
        <span v-if="action.text">{{ action.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SwipeActionItem {
  text?: string
  icon?: any
  color?: string
  backgroundColor?: string
  onClick?: () => void
}

interface Props {
  leftActions?: SwipeActionItem[]
  rightActions?: SwipeActionItem[]
  threshold?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  leftActions: () => [],
  rightActions: () => [],
  threshold: 30,
  disabled: false
})

const emit = defineEmits<{
  open: [position: 'left' | 'right']
  close: []
  click: [e: MouseEvent]
}>()

const containerRef = ref<HTMLElement | null>(null)
const leftRef = ref<HTMLElement | null>(null)
const rightRef = ref<HTMLElement | null>(null)

const offset = ref(0)
const opened = ref<'left' | 'right' | null>(null)

// 按钮宽度
const leftWidth = computed(() => props.leftActions.length * 70)
const rightWidth = computed(() => props.rightActions.length * 70)

// 触摸状态
let startX = 0
let startY = 0
let startOffset = 0
let isDragging = false
let isVertical: boolean | null = null

// 触摸开始
const onTouchStart = (e: TouchEvent) => {
  if (props.disabled) return
  
  const touch = e.touches[0]
  startX = touch.clientX
  startY = touch.clientY
  startOffset = offset.value
  isDragging = true
  isVertical = null
}

// 触摸移动
const onTouchMove = (e: TouchEvent) => {
  if (!isDragging || props.disabled) return
  
  const touch = e.touches[0]
  const deltaX = touch.clientX - startX
  const deltaY = touch.clientY - startY
  
  // 判断滑动方向
  if (isVertical === null) {
    isVertical = Math.abs(deltaY) > Math.abs(deltaX)
  }
  
  // 垂直滑动时不处理
  if (isVertical) return
  
  e.preventDefault()
  
  let newOffset = startOffset + deltaX
  
  // 限制滑动范围
  const maxLeft = leftWidth.value
  const maxRight = -rightWidth.value
  
  // 添加阻尼效果
  if (newOffset > maxLeft) {
    newOffset = maxLeft + (newOffset - maxLeft) * 0.3
  } else if (newOffset < maxRight) {
    newOffset = maxRight + (newOffset - maxRight) * 0.3
  }
  
  offset.value = newOffset
}

// 触摸结束
const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  
  const threshold = props.threshold
  
  // 判断最终位置
  if (offset.value > threshold && props.leftActions.length) {
    // 打开左侧
    open('left')
  } else if (offset.value < -threshold && props.rightActions.length) {
    // 打开右侧
    open('right')
  } else {
    // 关闭
    close()
  }
}

// 打开操作区域
const open = (position: 'left' | 'right') => {
  if (position === 'left') {
    offset.value = leftWidth.value
  } else {
    offset.value = -rightWidth.value
  }
  opened.value = position
  emit('open', position)
}

// 关闭操作区域
const close = () => {
  offset.value = 0
  opened.value = null
  emit('close')
}

// 点击操作按钮
const onActionClick = (action: SwipeActionItem, position: 'left' | 'right') => {
  action.onClick?.()
  close()
}

// 点击内容区域
const onContentClick = (e: MouseEvent) => {
  if (opened.value) {
    // 如果已打开，点击关闭
    close()
    e.stopPropagation()
  } else {
    emit('click', e)
  }
}

// 暴露方法
defineExpose({
  open,
  close
})
</script>

<style scoped>
.swipe-action {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-card);
}

.swipe-action__content {
  position: relative;
  z-index: 1;
  background-color: var(--bg-card);
  transition: transform 0.3s ease;
}

.swipe-action__left,
.swipe-action__right {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  z-index: 0;
}

.swipe-action__left {
  left: 0;
}

.swipe-action__right {
  right: 0;
}

.swipe-action__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 70px;
  height: 100%;
  padding: 0 var(--spacing-md);
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.swipe-action__btn:active {
  opacity: 0.8;
}

.swipe-action__btn .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}
</style>
