import { Router } from "express";
import { body, param, query } from "express-validator";
import transactionController from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取交易列表
router.get(
  "/",
  [
    query("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("无效的交易类型"),
    query("startDate").optional().isISO8601().withMessage("无效的开始日期"),
    query("endDate").optional().isISO8601().withMessage("无效的结束日期"),
    query("page").optional().isInt({ min: 1 }).withMessage("页码必须是正整数"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须在1-100之间"),
  ],
  transactionController.list
);

// 获取月度统计
router.get("/summary/monthly", transactionController.getMonthlySummary);

// 获取单个交易
router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的交易ID")],
  transactionController.get
);

// 创建交易
router.post(
  "/",
  [
    body("accountId").isInt({ min: 1 }).withMessage("请选择账户"),
    body("categoryId").isInt({ min: 1 }).withMessage("请选择分类"),
    body("billTypeId").isInt({ min: 1 }).withMessage("请选择账单类型"),
    body("type").isIn(["income", "expense"]).withMessage("无效的交易类型"),
    body("amount").isFloat({ min: 0.01 }).withMessage("金额必须大于0"),
    body("date").isISO8601().withMessage("无效的日期格式"),
    body("note")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("备注不能超过500字符"),
    body("familyId").optional().isInt({ min: 1 }).withMessage("无效的家庭ID"),
    body("isFamily").optional().isBoolean().withMessage("isFamily必须是布尔值"),
  ],
  transactionController.create
);

// 更新交易
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的交易ID"),
    body("accountId").optional().isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("categoryId").optional().isInt({ min: 1 }).withMessage("无效的分类ID"),
    body("billTypeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("无效的账单类型ID"),
    body("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("无效的交易类型"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("金额必须大于0"),
    body("date").optional().isISO8601().withMessage("无效的日期格式"),
    body("note")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("备注不能超过500字符"),
    body("isFamily").optional().isBoolean().withMessage("isFamily必须是布尔值"),
  ],
  transactionController.update
);

// 删除交易
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的交易ID")],
  transactionController.delete
);

export default router;
