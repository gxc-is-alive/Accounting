import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { FileStorage } from "./fileStorage.interface";

/**
 * 本地文件存储实现
 */
export class LocalFileStorage implements FileStorage {
  private uploadDir: string;
  private thumbnailDir: string;
  private baseUrl: string;

  constructor(options?: { uploadDir?: string; baseUrl?: string }) {
    this.uploadDir = options?.uploadDir || path.join(process.cwd(), "uploads");
    this.thumbnailDir = path.join(this.uploadDir, "thumbnails");
    this.baseUrl = options?.baseUrl || "/uploads";
  }

  /**
   * 确保目录存在
   */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * 生成唯一的存储路径
   */
  private generateStoragePath(filename: string, mimeType: string): string {
    const ext =
      path.extname(filename) || this.getExtensionFromMimeType(mimeType);
    const uuid = uuidv4();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // 格式: YYYY/MM/uuid.ext
    return `${year}/${month}/${uuid}${ext}`;
  }

  /**
   * 根据 MIME 类型获取文件扩展名
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
      "video/mp4": ".mp4",
      "video/quicktime": ".mov",
    };
    return mimeToExt[mimeType] || "";
  }

  /**
   * 保存文件
   */
  async save(
    file: Buffer,
    filename: string,
    mimeType: string
  ): Promise<string> {
    const storagePath = this.generateStoragePath(filename, mimeType);
    const fullPath = path.join(this.uploadDir, storagePath);

    // 确保目录存在
    await this.ensureDir(path.dirname(fullPath));

    // 写入文件
    await fs.writeFile(fullPath, file);

    return storagePath;
  }

  /**
   * 删除文件
   */
  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // 文件不存在时忽略错误
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    // 尝试删除缩略图
    const thumbnailPath = this.getThumbnailPath(storagePath);
    if (thumbnailPath) {
      const fullThumbnailPath = path.join(this.uploadDir, thumbnailPath);
      try {
        await fs.unlink(fullThumbnailPath);
      } catch {
        // 忽略缩略图删除错误
      }
    }
  }

  /**
   * 生成访问 URL
   */
  async getUrl(storagePath: string, _expiresIn?: number): Promise<string> {
    // 本地存储直接返回静态文件 URL
    return `${this.baseUrl}/${storagePath}`;
  }

  /**
   * 获取缩略图路径
   */
  private getThumbnailPath(storagePath: string): string {
    const ext = path.extname(storagePath);
    const baseName = storagePath.slice(0, -ext.length);
    return `thumbnails/${baseName}_thumb.jpg`;
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    storagePath: string,
    mimeType: string
  ): Promise<string | null> {
    // 只为图片生成缩略图
    if (!mimeType.startsWith("image/")) {
      return null;
    }

    try {
      // 动态导入 sharp（可选依赖）
      const sharp = await import("sharp").catch(() => null);
      if (!sharp) {
        console.warn("sharp 未安装，跳过缩略图生成");
        return null;
      }

      const sourcePath = path.join(this.uploadDir, storagePath);
      const thumbnailPath = this.getThumbnailPath(storagePath);
      const fullThumbnailPath = path.join(this.uploadDir, thumbnailPath);

      // 确保缩略图目录存在
      await this.ensureDir(path.dirname(fullThumbnailPath));

      // 生成缩略图（最大宽度 200px，保持比例）
      await sharp
        .default(sourcePath)
        .resize(200, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(fullThumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error("生成缩略图失败:", error);
      return null;
    }
  }
}

// 导出默认实例
export const localStorage = new LocalFileStorage();
