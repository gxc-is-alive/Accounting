import { Request, Response } from "express";
import multer from "multer";
import { attachmentService } from "../services/attachment.service";
import {
  getAllAllowedMimeTypes,
  FILE_SIZE_LIMITS,
} from "../services/storage/fileStorage.interface";

// 配置 Multer - 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = getAllAllowedMimeTypes();
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("不支持的文件类型，请上传图片、PDF 或视频"));
  }
};

// 创建 Multer 实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // 使用最大限制，具体验证在服务层
    files: 5, // 最多 5 个文件
  },
});

/**
 * 上传单个附件
 * POST /api/attachments/upload
 */
export const uploadAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "请选择要上传的文件" });
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    const attachment = await attachmentService.upload(req.file, userId);
    const url = await attachmentService.getAccessUrl(attachment);
    const thumbnailUrl = await attachmentService.getThumbnailUrl(attachment);

    res.status(201).json({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url,
      thumbnailUrl,
      createdAt: attachment.createdAt,
    });
  } catch (error) {
    console.error("上传附件失败:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "上传失败",
    });
  }
};

/**
 * 批量上传附件
 * POST /api/attachments/upload-multiple
 */
export const uploadMultipleAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "请选择要上传的文件" });
      return;
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    const attachments = await attachmentService.uploadMultiple(files, userId);
    const results = await Promise.all(
      attachments.map(async (attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: await attachmentService.getAccessUrl(attachment),
        thumbnailUrl: await attachmentService.getThumbnailUrl(attachment),
        createdAt: attachment.createdAt,
      }))
    );

    res.status(201).json(results);
  } catch (error) {
    console.error("批量上传附件失败:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "上传失败",
    });
  }
};

/**
 * 获取单个附件信息
 * GET /api/attachments/:id
 */
export const getAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const attachmentId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    const attachment = await attachmentService.getById(attachmentId, userId);
    if (!attachment) {
      res.status(404).json({ error: "附件不存在或无权访问" });
      return;
    }

    const url = await attachmentService.getAccessUrl(attachment);
    const thumbnailUrl = await attachmentService.getThumbnailUrl(attachment);

    res.json({
      id: attachment.id,
      transactionId: attachment.transactionId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url,
      thumbnailUrl,
      createdAt: attachment.createdAt,
    });
  } catch (error) {
    console.error("获取附件失败:", error);
    res.status(500).json({ error: "获取附件失败" });
  }
};

/**
 * 获取交易的所有附件
 * GET /api/attachments/transaction/:transactionId
 */
export const getTransactionAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactionId = parseInt(req.params.transactionId, 10);
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    const attachments = await attachmentService.getByTransactionId(
      transactionId,
      userId
    );

    const results = await Promise.all(
      attachments.map(async (attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: await attachmentService.getAccessUrl(attachment),
        thumbnailUrl: await attachmentService.getThumbnailUrl(attachment),
        createdAt: attachment.createdAt,
      }))
    );

    res.json(results);
  } catch (error) {
    console.error("获取交易附件失败:", error);
    res.status(500).json({ error: "获取附件失败" });
  }
};

/**
 * 删除附件
 * DELETE /api/attachments/:id
 */
export const deleteAttachment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const attachmentId = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    await attachmentService.delete(attachmentId, userId);
    res.status(204).send();
  } catch (error) {
    console.error("删除附件失败:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "删除失败",
    });
  }
};

/**
 * 关联附件到交易
 * POST /api/attachments/link
 */
export const linkAttachments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { attachmentIds, transactionId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: "未授权" });
      return;
    }

    if (!attachmentIds || !Array.isArray(attachmentIds)) {
      res.status(400).json({ error: "请提供附件 ID 列表" });
      return;
    }

    if (!transactionId) {
      res.status(400).json({ error: "请提供交易 ID" });
      return;
    }

    await attachmentService.linkToTransaction(
      attachmentIds,
      transactionId,
      userId
    );

    res.json({ success: true });
  } catch (error) {
    console.error("关联附件失败:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "关联失败",
    });
  }
};
