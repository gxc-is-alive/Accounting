import { Router } from "express";
import {
  upload,
  uploadAttachment,
  uploadMultipleAttachments,
  getAttachment,
  getTransactionAttachments,
  deleteAttachment,
  linkAttachments,
} from "../controllers/attachment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 上传单个附件
router.post("/upload", upload.single("file"), uploadAttachment);

// 批量上传附件
router.post(
  "/upload-multiple",
  upload.array("files", 5),
  uploadMultipleAttachments
);

// 获取单个附件
router.get("/:id", getAttachment);

// 获取交易的所有附件
router.get("/transaction/:transactionId", getTransactionAttachments);

// 删除附件
router.delete("/:id", deleteAttachment);

// 关联附件到交易
router.post("/link", linkAttachments);

export default router;
