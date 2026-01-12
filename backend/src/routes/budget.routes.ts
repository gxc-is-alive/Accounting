import { Router } from "express";
import { body, param, query } from "express-validator";
import budgetController from "../controllers/budget.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取预算列表
router.get(
  "/",
  [
    query("month")
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("月份格式必须是YYYY-MM"),
  ],
  budgetController.list
);

// 获取预算执行状态
router.get(
  "/status",
  [
    query("month")
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("月份格式必须是YYYY-MM"),
  ],
  budgetController.getStatus
);

// 获取预算预警
router.get(
  "/warnings",
  [
    query("month")
      .optional()
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("月份格式必须是YYYY-MM"),
  ],
  budgetController.getWarnings
);

// 创建或更新预算
router.post(
  "/",
  [
    body("categoryId").optional().isInt({ min: 1 }).withMessage("无效的分类ID"),
    body("amount").isFloat({ min: 0.01 }).withMessage("预算金额必须大于0"),
    body("month")
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("月份格式必须是YYYY-MM"),
  ],
  budgetController.upsert
);

// 删除预算
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的预算ID")],
  budgetController.delete
);

export default router;
