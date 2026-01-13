import Attachment, { AttachmentCreationAttributes } from "../models/Attachment";
import { LocalFileStorage } from "./storage/localStorage";
import {
  FileStorage,
  ValidationResult,
  validateFile,
} from "./storage/fileStorage.interface";

/**
 * 附件服务
 * 处理附件的上传、关联、查询和删除
 */
export class AttachmentService {
  private storage: FileStorage;

  constructor(storage?: FileStorage) {
    this.storage = storage || new LocalFileStorage();
  }

  /**
   * 验证文件
   */
  validateFile(file: Express.Multer.File): ValidationResult {
    return validateFile(file.mimetype, file.size);
  }

  /**
   * 上传附件
   */
  async upload(file: Express.Multer.File, userId: number): Promise<Attachment> {
    // 验证文件
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 保存文件到存储
    const storagePath = await this.storage.save(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // 生成缩略图（如果是图片）
    let thumbnailPath: string | null = null;
    if (file.mimetype.startsWith("image/")) {
      thumbnailPath = await this.storage.generateThumbnail(
        storagePath,
        file.mimetype
      );
    }

    // 创建数据库记录
    const attachmentData: AttachmentCreationAttributes = {
      userId,
      filename: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
      thumbnailPath,
    };

    const attachment = await Attachment.create(attachmentData);
    return attachment;
  }

  /**
   * 批量上传附件
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    userId: number
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    for (const file of files) {
      const attachment = await this.upload(file, userId);
      attachments.push(attachment);
    }

    return attachments;
  }

  /**
   * 关联附件到交易
   */
  async linkToTransaction(
    attachmentIds: number[],
    transactionId: number,
    userId: number
  ): Promise<void> {
    // 验证所有附件属于当前用户且未关联其他交易
    const attachments = await Attachment.findAll({
      where: {
        id: attachmentIds,
        userId,
      },
    });

    if (attachments.length !== attachmentIds.length) {
      throw new Error("部分附件不存在或无权访问");
    }

    // 检查是否有附件已关联到其他交易
    const alreadyLinked = attachments.filter(
      (a) => a.transactionId !== null && a.transactionId !== transactionId
    );
    if (alreadyLinked.length > 0) {
      throw new Error("部分附件已关联到其他交易");
    }

    // 更新附件的交易 ID
    await Attachment.update(
      { transactionId },
      {
        where: {
          id: attachmentIds,
          userId,
        },
      }
    );
  }

  /**
   * 获取交易的附件列表
   */
  async getByTransactionId(
    transactionId: number,
    userId: number
  ): Promise<Attachment[]> {
    const attachments = await Attachment.findAll({
      where: {
        transactionId,
        userId,
      },
      order: [["createdAt", "ASC"]],
    });

    return attachments;
  }

  /**
   * 获取单个附件
   */
  async getById(
    attachmentId: number,
    userId: number
  ): Promise<Attachment | null> {
    const attachment = await Attachment.findOne({
      where: {
        id: attachmentId,
        userId,
      },
    });

    return attachment;
  }

  /**
   * 删除附件
   */
  async delete(attachmentId: number, userId: number): Promise<void> {
    const attachment = await Attachment.findOne({
      where: {
        id: attachmentId,
        userId,
      },
    });

    if (!attachment) {
      throw new Error("附件不存在或无权访问");
    }

    // 删除存储中的文件
    await this.storage.delete(attachment.storagePath);

    // 删除数据库记录
    await attachment.destroy();
  }

  /**
   * 删除交易的所有附件
   */
  async deleteByTransactionId(
    transactionId: number,
    userId?: number
  ): Promise<void> {
    const whereClause: { transactionId: number; userId?: number } = {
      transactionId,
    };
    if (userId) {
      whereClause.userId = userId;
    }

    const attachments = await Attachment.findAll({
      where: whereClause,
    });

    // 删除所有文件
    for (const attachment of attachments) {
      await this.storage.delete(attachment.storagePath);
    }

    // 删除数据库记录
    await Attachment.destroy({
      where: whereClause,
    });
  }

  /**
   * 生成访问 URL
   */
  async getAccessUrl(attachment: Attachment): Promise<string> {
    return this.storage.getUrl(attachment.storagePath);
  }

  /**
   * 获取缩略图 URL
   */
  async getThumbnailUrl(attachment: Attachment): Promise<string | null> {
    if (!attachment.thumbnailPath) {
      return null;
    }
    return this.storage.getUrl(attachment.thumbnailPath);
  }

  /**
   * 获取用户未关联的附件（用于清理）
   */
  async getUnlinkedAttachments(
    userId: number,
    olderThanHours: number = 24
  ): Promise<Attachment[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const { Op } = await import("sequelize");

    return Attachment.findAll({
      where: {
        userId,
        transactionId: null,
        createdAt: {
          [Op.lt]: cutoffDate,
        },
      },
    });
  }

  /**
   * 清理未关联的附件
   */
  async cleanupUnlinkedAttachments(
    userId: number,
    olderThanHours: number = 24
  ): Promise<number> {
    const attachments = await this.getUnlinkedAttachments(
      userId,
      olderThanHours
    );

    for (const attachment of attachments) {
      await this.storage.delete(attachment.storagePath);
      await attachment.destroy();
    }

    return attachments.length;
  }
}

// 导出默认实例
export const attachmentService = new AttachmentService();
