import { Router } from "express";
import { body, param } from "express-validator";
import refundController from "../controllers/refund.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有退款路由都需要认证
router.use(authenticate);

// 创建退款
router.post(
  "/",
  [
    body("originalTransactionId").isInt({ min: 1 }).withMessage("请选择原交易"),
    body("amount").isFloat({ min: 0.01 }).withMessage("退款金额必须大于0"),
    body("date").isISO8601().withMessage("请输入有效的日期"),
    body("note")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("备注不能超过500个字符"),
  ],
  refundController.create
);

// 获取交易的退款信息（包括退款列表和可退款金额）
router.get(
  "/transaction/:transactionId",
  [param("transactionId").isInt({ min: 1 }).withMessage("无效的交易ID")],
  refundController.getTransactionRefunds
);

// 获取交易的可退款金额
router.get(
  "/transaction/:transactionId/refundable",
  [param("transactionId").isInt({ min: 1 }).withMessage("无效的交易ID")],
  refundController.getRefundableAmount
);

// 更新退款
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的退款ID"),
    body("amount").isFloat({ min: 0.01 }).withMessage("退款金额必须大于0"),
    body("date").optional().isISO8601().withMessage("请输入有效的日期"),
    body("note")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("备注不能超过500个字符"),
  ],
  refundController.update
);

// 删除退款
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的退款ID")],
  refundController.delete
);

export default router;
