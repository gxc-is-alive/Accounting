import { Router } from "express";
import { query, param } from "express-validator";
import statisticsController from "../controllers/statistics.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取月度统计
router.get(
  "/monthly",
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("无效的年份"),
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("无效的月份"),
  ],
  statisticsController.getMonthly
);

// 获取分类统计
router.get(
  "/category",
  [
    query("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("无效的类型"),
    query("startDate").optional().isISO8601().withMessage("无效的开始日期"),
    query("endDate").optional().isISO8601().withMessage("无效的结束日期"),
  ],
  statisticsController.getCategory
);

// 获取趋势数据
router.get(
  "/trend",
  [
    query("months")
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage("月数必须在1-24之间"),
  ],
  statisticsController.getTrend
);

// 获取年度统计
router.get(
  "/yearly",
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("无效的年份"),
  ],
  statisticsController.getYearly
);

// 获取家庭统计
router.get(
  "/family/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的家庭ID"),
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("无效的年份"),
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("无效的月份"),
  ],
  statisticsController.getFamily
);

export default router;
