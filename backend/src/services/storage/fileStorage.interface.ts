/**
 * 文件存储接口
 * 支持本地存储和云存储（如 S3）的统一抽象
 */
export interface FileStorage {
  /**
   * 保存文件
   * @param file 文件 Buffer
   * @param filename 原始文件名
   * @param mimeType 文件 MIME 类型
   * @returns 存储路径/key
   */
  save(file: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * 删除文件
   * @param storagePath 存储路径/key
   */
  delete(storagePath: string): Promise<void>;

  /**
   * 生成访问 URL
   * @param storagePath 存储路径/key
   * @param expiresIn 过期时间（秒），默认 3600
   * @returns 访问 URL
   */
  getUrl(storagePath: string, expiresIn?: number): Promise<string>;

  /**
   * 生成缩略图
   * @param storagePath 原文件存储路径
   * @param mimeType 文件 MIME 类型
   * @returns 缩略图存储路径，如果不支持则返回 null
   */
  generateThumbnail(
    storagePath: string,
    mimeType: string
  ): Promise<string | null>;
}

/**
 * 文件验证结果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 支持的文件类型配置
 */
export const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/quicktime"],
};

/**
 * 文件大小限制（字节）
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  pdf: 10 * 1024 * 1024, // 10MB
  video: 50 * 1024 * 1024, // 50MB
};

/**
 * 获取所有允许的 MIME 类型
 */
export const getAllAllowedMimeTypes = (): string[] => {
  return [
    ...ALLOWED_MIME_TYPES.image,
    ...ALLOWED_MIME_TYPES.pdf,
    ...ALLOWED_MIME_TYPES.video,
  ];
};

/**
 * 根据 MIME 类型获取文件大小限制
 */
export const getFileSizeLimit = (mimeType: string): number => {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    return FILE_SIZE_LIMITS.image;
  }
  if (ALLOWED_MIME_TYPES.pdf.includes(mimeType)) {
    return FILE_SIZE_LIMITS.pdf;
  }
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) {
    return FILE_SIZE_LIMITS.video;
  }
  return 0; // 不支持的类型
};

/**
 * 验证文件类型和大小
 */
export const validateFile = (
  mimeType: string,
  size: number
): ValidationResult => {
  const allowedTypes = getAllAllowedMimeTypes();

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: "不支持的文件类型，请上传图片、PDF 或视频",
    };
  }

  const sizeLimit = getFileSizeLimit(mimeType);
  if (size > sizeLimit) {
    const limitMB = sizeLimit / (1024 * 1024);
    return {
      valid: false,
      error: `文件大小超过限制（最大 ${limitMB}MB）`,
    };
  }

  return { valid: true };
};
