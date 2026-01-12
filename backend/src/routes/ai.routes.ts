import { Router } from "express";
import { body, query } from "express-validator";
import aiController from "../controllers/ai.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 解析自然语言记账文本
router.post(
  "/parse",
  [
    body("text")
      .trim()
      .notEmpty()
      .withMessage("请输入记账文本")
      .isLength({ max: 500 })
      .withMessage("文本不能超过500字符"),
  ],
  aiController.parse
);

// 分析消费习惯
router.get(
  "/analyze",
  [
    query("months")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("分析月数必须在1-12之间"),
  ],
  aiController.analyze
);

// AI 问答
router.post(
  "/chat",
  [
    body("question")
      .trim()
      .notEmpty()
      .withMessage("请输入问题")
      .isLength({ max: 500 })
      .withMessage("问题不能超过500字符"),
  ],
  aiController.chat
);

export default router;
