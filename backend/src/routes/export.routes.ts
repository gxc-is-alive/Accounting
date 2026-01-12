/**
 * 数据导出路由
 * Feature: data-export-docker
 */

import { Router } from "express";
import { query, body } from "express-validator";
import exportController from "../controllers/export.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有导出路由都需要认证
router.use(authenticate);

/**
 * GET /api/export/json
 * 导出用户数据为 JSON
 * Query: includeFamily - 是否包含家庭数据
 */
router.get(
  "/json",
  [
    query("includeFamily")
      .optional()
      .isIn(["true", "false"])
      .withMessage("includeFamily 必须是 true 或 false"),
  ],
  exportController.exportJson
);

/**
 * GET /api/export/csv
 * 导出交易记录为 CSV
 * Query: startDate, endDate - 日期范围过滤
 */
router.get(
  "/csv",
  [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("startDate 必须是有效的日期格式"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("endDate 必须是有效的日期格式"),
  ],
  exportController.exportCsv
);

/**
 * POST /api/export/import
 * 导入数据
 * Body: data - 导入的 JSON 数据, mode - 冲突处理模式 (skip/overwrite)
 */
router.post(
  "/import",
  [
    body("data").notEmpty().withMessage("导入数据不能为空"),
    body("mode")
      .optional()
      .isIn(["skip", "overwrite"])
      .withMessage("mode 必须是 skip 或 overwrite"),
  ],
  exportController.importData
);

export default router;
