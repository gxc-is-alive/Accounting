<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Close } from "@element-plus/icons-vue";
import type { Attachment } from "@/types";

// Props
interface Props {
  attachments: Attachment[];
  visible: boolean;
  initialIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
});

// Emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  close: [];
}>();

// 状态
const currentIndex = ref(props.initialIndex);

// 监听 initialIndex 变化
watch(
  () => props.initialIndex,
  (val) => {
    currentIndex.value = val;
  }
);

// 当前附件
const currentAttachment = computed(() => props.attachments[currentIndex.value]);

// 是否为图片
const isImage = computed(() =>
  currentAttachment.value?.mimeType.startsWith("image/")
);

// 是否为视频
const isVideo = computed(() =>
  currentAttachment.value?.mimeType.startsWith("video/")
);

// 是否为 PDF
const isPdf = computed(
  () => currentAttachment.value?.mimeType === "application/pdf"
);

// 图片列表（用于图片预览器）
const imageUrls = computed(() =>
  props.attachments
    .filter((a) => a.mimeType.startsWith("image/"))
    .map((a) => a.url)
);

// 关闭预览
const closePreview = () => {
  emit("update:visible", false);
  emit("close");
};

// 上一个
const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

// 下一个
const next = () => {
  if (currentIndex.value < props.attachments.length - 1) {
    currentIndex.value++;
  }
};

// 键盘导航
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return;

  switch (e.key) {
    case "ArrowLeft":
      prev();
      break;
    case "ArrowRight":
      next();
      break;
    case "Escape":
      closePreview();
      break;
  }
};

// 监听键盘事件
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener("keydown", handleKeydown);
    } else {
      document.removeEventListener("keydown", handleKeydown);
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible && currentAttachment" class="preview-overlay">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="closePreview">
          <el-icon><Close /></el-icon>
        </button>

        <!-- 图片预览 -->
        <div v-if="isImage" class="preview-content">
          <img
            :src="currentAttachment.url"
            :alt="currentAttachment.filename"
            class="preview-image"
          />
        </div>

        <!-- 视频预览 -->
        <div v-else-if="isVideo" class="preview-content">
          <video
            :src="currentAttachment.url"
            controls
            autoplay
            class="preview-video"
          />
        </div>

        <!-- PDF 提示 -->
        <div v-else-if="isPdf" class="preview-content pdf-notice">
          <div class="pdf-icon">📄</div>
          <p>{{ currentAttachment.filename }}</p>
          <el-button type="primary" @click="() => window.open(currentAttachment.url, '_blank')">
            在新窗口打开 PDF
          </el-button>
        </div>

        <!-- 导航按钮 -->
        <div v-if="attachments.length > 1" class="nav-buttons">
          <button
            class="nav-btn prev"
            :disabled="currentIndex === 0"
            @click="prev"
          >
            ‹
          </button>
          <span class="nav-indicator">
            {{ currentIndex + 1 }} / {{ attachments.length }}
          </span>
          <button
            class="nav-btn next"
            :disabled="currentIndex === attachments.length - 1"
            @click="next"
          >
            ›
          </button>
        </div>

        <!-- 文件名 -->
        <div class="filename-bar">
          {{ currentAttachment.filename }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.preview-content {
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.preview-video {
  max-width: 100%;
  max-height: 80vh;
}

.pdf-notice {
  flex-direction: column;
  gap: 16px;
  color: white;
  text-align: center;
}

.pdf-icon {
  font-size: 64px;
}

.nav-buttons {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-indicator {
  color: white;
  font-size: 14px;
}

.filename-bar {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
