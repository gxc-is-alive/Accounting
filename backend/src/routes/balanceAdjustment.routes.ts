/**
 * 余额调整路由
 * /api/balance-adjustments
 */

import { Router } from "express";
import { body, query } from "express-validator";
import balanceAdjustmentController from "../controllers/balanceAdjustment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取平账记录列表
router.get(
  "/",
  [
    query("accountId").optional().isInt({ min: 1 }).withMessage("无效的账户ID"),
    query("startDate").optional().isISO8601().withMessage("开始日期格式无效"),
    query("endDate").optional().isISO8601().withMessage("结束日期格式无效"),
    query("page").optional().isInt({ min: 1 }).withMessage("页码必须大于0"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须在1-100之间"),
  ],
  balanceAdjustmentController.getRecords
);

export default router;
