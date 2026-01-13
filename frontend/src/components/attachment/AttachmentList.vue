<script setup lang="ts">
import { ref } from "vue";
import type { Attachment } from "@/types";
import AttachmentPreview from "./AttachmentPreview.vue";

// Props
interface Props {
  attachments: Attachment[];
  showDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDelete: false,
});

// Emits
const emit = defineEmits<{
  delete: [attachment: Attachment];
}>();

// 预览状态
const previewVisible = ref(false);
const previewIndex = ref(0);

// 获取文件图标
const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("video/")) return "🎬";
  return "📎";
};

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// 打开预览
const openPreview = (index: number) => {
  previewIndex.value = index;
  previewVisible.value = true;
};

// 删除附件
const handleDelete = (attachment: Attachment, e: Event) => {
  e.stopPropagation();
  emit("delete", attachment);
};
</script>

<template>
  <div v-if="attachments.length > 0" class="attachment-list">
    <div
      v-for="(attachment, index) in attachments"
      :key="attachment.id"
      class="attachment-item"
      @click="openPreview(index)"
    >
      <!-- 缩略图或图标 -->
      <div class="attachment-thumb">
        <img
          v-if="attachment.thumbnailUrl"
          :src="attachment.thumbnailUrl"
          :alt="attachment.filename"
        />
        <span v-else class="file-icon">{{ getFileIcon(attachment.mimeType) }}</span>
      </div>

      <!-- 文件信息 -->
      <div class="attachment-info">
        <span class="filename">{{ attachment.filename }}</span>
        <span class="filesize">{{ formatSize(attachment.size) }}</span>
      </div>

      <!-- 删除按钮 -->
      <button
        v-if="showDelete"
        class="delete-btn"
        @click="(e) => handleDelete(attachment, e)"
      >
        ×
      </button>
    </div>

    <!-- 预览组件 -->
    <AttachmentPreview
      v-model:visible="previewVisible"
      :attachments="attachments"
      :initial-index="previewIndex"
    />
  </div>
</template>

<style scoped>
.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.attachment-item:hover {
  background: var(--el-fill-color);
}

.attachment-thumb {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.attachment-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 18px;
}

.attachment-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 120px;
}

.filename {
  font-size: 12px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filesize {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.delete-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border: none;
  background: var(--el-color-danger);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.attachment-item:hover .delete-btn {
  display: flex;
}
</style>
