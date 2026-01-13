<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete, ZoomIn, Camera, Picture } from "@element-plus/icons-vue";
import type { UploadFile, UploadUserFile } from "element-plus";
import { attachmentApi } from "@/api";
import type { Attachment } from "@/types";
import {
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  MAX_ATTACHMENTS,
} from "@/types";
import { useDevice } from "@/composables/useDevice";

// Props
interface Props {
  modelValue?: Attachment[];
  maxCount?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxCount: MAX_ATTACHMENTS,
  disabled: false,
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [attachments: Attachment[]];
  "upload-success": [attachment: Attachment];
  "upload-error": [error: string];
}>();

// 状态
const uploading = ref(false);
const fileList = ref<UploadUserFile[]>([]);
const previewVisible = ref(false);
const previewUrl = ref("");
const cameraInputRef = ref<HTMLInputElement | null>(null);
const galleryInputRef = ref<HTMLInputElement | null>(null);

// 设备检测
const { device } = useDevice();
const isMobile = computed(() => device.value.isMobile);

// 计算属性
const allowedTypes = computed(() => [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.pdf,
  ...ALLOWED_MIME_TYPES.video,
]);

const acceptTypes = computed(() => allowedTypes.value.join(","));

const canUpload = computed(
  () => props.modelValue.length < props.maxCount && !props.disabled
);

// 文件验证
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件类型
  if (!allowedTypes.value.includes(file.type)) {
    return {
      valid: false,
      error: "不支持的文件类型，请上传图片、PDF 或视频",
    };
  }

  // 检查文件大小
  let maxSize = FILE_SIZE_LIMITS.image;
  if (file.type.startsWith("video/")) {
    maxSize = FILE_SIZE_LIMITS.video;
  } else if (file.type === "application/pdf") {
    maxSize = FILE_SIZE_LIMITS.pdf;
  }

  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `文件大小超过限制（最大 ${limitMB}MB）`,
    };
  }

  return { valid: true };
};

// 上传前验证
const beforeUpload = (file: File) => {
  const validation = validateFile(file);
  if (!validation.valid) {
    ElMessage.error(validation.error!);
    return false;
  }

  if (props.modelValue.length >= props.maxCount) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 个附件`);
    return false;
  }

  return true;
};

// 自定义上传
const customUpload = async (options: { file: File }) => {
  uploading.value = true;

  try {
    const response = await attachmentApi.upload(options.file);

    if (response.data.data) {
      const attachment: Attachment = {
        id: response.data.data.id,
        filename: response.data.data.filename,
        mimeType: response.data.data.mimeType,
        size: response.data.data.size,
        url: response.data.data.url,
        thumbnailUrl: response.data.data.thumbnailUrl,
        createdAt: response.data.data.createdAt,
      };

      const newList = [...props.modelValue, attachment];
      emit("update:modelValue", newList);
      emit("upload-success", attachment);
      ElMessage.success("上传成功");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "上传失败";
    emit("upload-error", errorMsg);
    ElMessage.error(errorMsg);
  } finally {
    uploading.value = false;
  }
};

// 删除附件
const handleRemove = async (attachment: Attachment) => {
  try {
    await attachmentApi.delete(attachment.id);
    const newList = props.modelValue.filter((a) => a.id !== attachment.id);
    emit("update:modelValue", newList);
    ElMessage.success("删除成功");
  } catch {
    ElMessage.error("删除失败");
  }
};

// 预览附件
const handlePreview = (attachment: Attachment) => {
  if (attachment.mimeType.startsWith("image/")) {
    previewUrl.value = attachment.url;
    previewVisible.value = true;
  } else if (attachment.mimeType === "application/pdf") {
    window.open(attachment.url, "_blank");
  } else if (attachment.mimeType.startsWith("video/")) {
    window.open(attachment.url, "_blank");
  }
};

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// 获取文件图标
const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("video/")) return "🎬";
  return "📎";
};

// 移动端：打开相机
const openCamera = () => {
  cameraInputRef.value?.click();
};

// 移动端：打开相册
const openGallery = () => {
  galleryInputRef.value?.click();
};

// 处理移动端文件选择
const handleMobileFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 验证文件
  const validation = validateFile(file);
  if (!validation.valid) {
    ElMessage.error(validation.error!);
    input.value = "";
    return;
  }

  if (props.modelValue.length >= props.maxCount) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 个附件`);
    input.value = "";
    return;
  }

  // 压缩图片（如果是图片且大于 1MB）
  let fileToUpload = file;
  if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
    try {
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.warn("图片压缩失败，使用原图:", e);
    }
  }

  // 上传
  await customUpload({ file: fileToUpload });
  input.value = "";
};

// 图片压缩
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      // 计算压缩后的尺寸（最大 1920px）
      const maxSize = 1920;
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("压缩失败"));
          }
        },
        "image/jpeg",
        0.8 // 压缩质量
      );
    };

    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = URL.createObjectURL(file);
  });
};
</script>

<template>
  <div class="attachment-upload">
    <!-- 已上传的附件列表 -->
    <div v-if="modelValue.length > 0" class="attachment-list">
      <div
        v-for="attachment in modelValue"
        :key="attachment.id"
        class="attachment-item"
      >
        <!-- 缩略图或图标 -->
        <div class="attachment-preview" @click="handlePreview(attachment)">
          <img
            v-if="attachment.thumbnailUrl"
            :src="attachment.thumbnailUrl"
            :alt="attachment.filename"
            class="thumbnail"
          />
          <span v-else class="file-icon">{{ getFileIcon(attachment.mimeType) }}</span>
        </div>

        <!-- 文件信息 -->
        <div class="attachment-info">
          <span class="filename" :title="attachment.filename">
            {{ attachment.filename }}
          </span>
          <span class="filesize">{{ formatSize(attachment.size) }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="attachment-actions">
          <el-button
            type="primary"
            :icon="ZoomIn"
            circle
            size="small"
            @click="handlePreview(attachment)"
          />
          <el-button
            v-if="!disabled"
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="handleRemove(attachment)"
          />
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <template v-if="canUpload">
      <!-- 移动端：拍照和相册按钮 -->
      <div v-if="isMobile" class="mobile-upload-buttons">
        <div class="upload-button" @click="openCamera">
          <el-icon><Camera /></el-icon>
          <span>拍照</span>
        </div>
        <div class="upload-button" @click="openGallery">
          <el-icon><Picture /></el-icon>
          <span>相册</span>
        </div>
        <!-- 隐藏的文件输入 -->
        <input
          ref="cameraInputRef"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="handleMobileFileSelect"
        />
        <input
          ref="galleryInputRef"
          type="file"
          :accept="acceptTypes"
          style="display: none"
          @change="handleMobileFileSelect"
        />
      </div>

      <!-- 桌面端：拖拽上传 -->
      <el-upload
        v-else
        class="upload-area"
        :accept="acceptTypes"
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="customUpload"
        :disabled="uploading || disabled"
        drag
      >
        <div class="upload-content">
          <el-icon v-if="!uploading" class="upload-icon"><Plus /></el-icon>
          <el-icon v-else class="upload-icon is-loading">
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 832a384 384 0 1 0 0-768 384 384 0 0 0 0 768z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M512 128a384 384 0 0 1 384 384h-64a320 320 0 0 0-320-320V128z"
                fill="currentColor"
              />
            </svg>
          </el-icon>
          <div class="upload-text">
            <span v-if="!uploading">点击或拖拽上传</span>
            <span v-else>上传中...</span>
          </div>
          <div class="upload-tip">
            支持图片、PDF、视频，单个文件最大
            {{ FILE_SIZE_LIMITS.video / (1024 * 1024) }}MB
          </div>
        </div>
      </el-upload>
    </template>

    <!-- 上传数量提示 -->
    <div v-if="modelValue.length > 0" class="upload-count">
      {{ modelValue.length }} / {{ maxCount }} 个附件
    </div>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped>
.attachment-upload {
  width: 100%;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  max-width: 280px;
}

.attachment-preview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 24px;
}

.attachment-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filename {
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filesize {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.attachment-actions {
  display: flex;
  gap: 4px;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px;
  border-radius: 8px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
}

.upload-icon.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.upload-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.upload-count {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: right;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .attachment-item {
    max-width: 100%;
    width: 100%;
  }

  .upload-area :deep(.el-upload-dragger) {
    padding: 16px;
  }
}

/* 移动端上传按钮 */
.mobile-upload-buttons {
  display: flex;
  gap: 12px;
}

.upload-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
}

.upload-button:active {
  transform: scale(0.98);
  background: var(--el-fill-color);
}

.upload-button .el-icon {
  font-size: 24px;
  color: var(--el-text-color-secondary);
}

.upload-button span {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
</style>
