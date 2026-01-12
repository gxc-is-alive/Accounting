<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div v-if="visible" class="bottom-sheet" @click.self="onOverlayClick">
        <!-- 遮罩层 -->
        <div class="bottom-sheet__overlay" />
        
        <!-- 面板内容 -->
        <div
          class="bottom-sheet__panel"
          :class="{ 'bottom-sheet__panel--round': round }"
          :style="panelStyle"
          ref="panelRef"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- 拖拽指示条 -->
          <div v-if="draggable" class="bottom-sheet__bar">
            <div class="bottom-sheet__bar-inner" />
          </div>
          
          <!-- 头部 -->
          <div v-if="title || closeable" class="bottom-sheet__header">
            <span class="bottom-sheet__title">{{ title }}</span>
            <el-icon
              v-if="closeable"
              class="bottom-sheet__close"
              @click="close"
            >
              <Close />
            </el-icon>
          </div>
          
          <!-- 内容区域 -->
          <div class="bottom-sheet__content" :style="contentStyle">
            <slot></slot>
          </div>
          
          <!-- 底部插槽 -->
          <div v-if="$slots.footer" class="bottom-sheet__footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface Props {
  visible?: boolean
  title?: string
  height?: string | number
  maxHeight?: string | number
  closeable?: boolean
  round?: boolean
  draggable?: boolean
  closeOnClickOverlay?: boolean
  lockScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  height: 'auto',
  maxHeight: '80vh',
  closeable: true,
  round: true,
  draggable: true,
  closeOnClickOverlay: true,
  lockScroll: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  open: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const translateY = ref(0)

// 触摸状态
let startY = 0
let startTranslateY = 0
let isDragging = false

// 面板样式
const panelStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.height !== 'auto') {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (translateY.value !== 0) {
    style.transform = `translateY(${translateY.value}px)`
  }
  
  return style
})

// 内容区域样式
const contentStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.maxHeight) {
    const maxH = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
    style.maxHeight = `calc(${maxH} - 100px)` // 减去头部和底部高度
  }
  
  return style
})

// 关闭面板
const close = () => {
  emit('update:visible', false)
  emit('close')
}

// 点击遮罩层
const onOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    close()
  }
}

// 触摸开始
const onTouchStart = (e: TouchEvent) => {
  if (!props.draggable) return
  
  const touch = e.touches[0]
  startY = touch.clientY
  startTranslateY = translateY.value
  isDragging = true
}

// 触摸移动
const onTouchMove = (e: TouchEvent) => {
  if (!isDragging || !props.draggable) return
  
  const touch = e.touches[0]
  const deltaY = touch.clientY - startY
  
  // 只允许向下拖拽
  if (deltaY < 0) {
    translateY.value = 0
    return
  }
  
  translateY.value = startTranslateY + deltaY
}

// 触摸结束
const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  
  // 如果拖拽距离超过阈值，关闭面板
  if (translateY.value > 100) {
    close()
  }
  
  // 重置位置
  translateY.value = 0
}

// 锁定滚动
const lockBodyScroll = () => {
  if (props.lockScroll) {
    document.body.style.overflow = 'hidden'
  }
}

const unlockBodyScroll = () => {
  document.body.style.overflow = ''
}

// 监听显示状态
watch(() => props.visible, (val) => {
  if (val) {
    lockBodyScroll()
    emit('open')
  } else {
    unlockBodyScroll()
  }
})

// 组件卸载时解锁滚动
onUnmounted(() => {
  unlockBodyScroll()
})

// 暴露方法
defineExpose({
  close
})
</script>

<style scoped>
.bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bottom-sheet__overlay {
  position: absolute;
  inset: 0;
  background-color: var(--bg-overlay);
}

.bottom-sheet__panel {
  position: relative;
  background-color: var(--bg-card);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-normal) ease;
  padding-bottom: var(--mobile-safe-area-bottom);
}

.bottom-sheet__panel--round {
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.bottom-sheet__bar {
  display: flex;
  justify-content: center;
  padding: var(--spacing-sm) 0;
}

.bottom-sheet__bar-inner {
  width: 40px;
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
}

.bottom-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.bottom-sheet__title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.bottom-sheet__close {
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  min-width: var(--touch-target-min);
  min-height: var(--touch-target-min);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-sheet__close:active {
  opacity: 0.7;
}

.bottom-sheet__content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--spacing-md);
}

.bottom-sheet__footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

/* 动画 */
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: opacity var(--transition-normal);
}

.bottom-sheet-enter-active .bottom-sheet__panel,
.bottom-sheet-leave-active .bottom-sheet__panel {
  transition: transform var(--transition-normal) ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

.bottom-sheet-enter-from .bottom-sheet__panel,
.bottom-sheet-leave-to .bottom-sheet__panel {
  transform: translateY(100%);
}
</style>
