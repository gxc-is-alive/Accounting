/**
 * 定投路由
 * /api/auto-investment
 */

import { Router } from "express";
import { body, param, query } from "express-validator";
import autoInvestmentController from "../controllers/autoInvestment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有定投路由都需要认证
router.use(authenticate);

// ========== 定投计划 ==========

// 获取定投计划列表
router.get("/plans", autoInvestmentController.listPlans);

// 获取单个定投计划详情
router.get(
  "/plans/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的计划ID")],
  autoInvestmentController.getPlan
);

// 创建定投计划
router.post(
  "/plans",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("计划名称不能为空")
      .isLength({ max: 100 })
      .withMessage("计划名称不能超过100个字符"),
    body("sourceAccountId")
      .isInt({ min: 1 })
      .withMessage("无效的资金来源账户ID"),
    body("targetAccountId")
      .isInt({ min: 1 })
      .withMessage("无效的目标投资账户ID"),
    body("amount").isFloat({ gt: 0 }).withMessage("定投金额必须大于0"),
    body("frequency")
      .isIn(["daily", "weekly", "monthly"])
      .withMessage("频率必须是 daily、weekly 或 monthly"),
    body("executionDay")
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage("执行日必须在1-31之间"),
    body("executionTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("执行时间格式必须是 HH:mm"),
  ],
  autoInvestmentController.createPlan
);

// 更新定投计划
router.put(
  "/plans/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的计划ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("计划名称不能为空")
      .isLength({ max: 100 })
      .withMessage("计划名称不能超过100个字符"),
    body("sourceAccountId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("无效的资金来源账户ID"),
    body("targetAccountId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("无效的目标投资账户ID"),
    body("amount")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("定投金额必须大于0"),
    body("frequency")
      .optional()
      .isIn(["daily", "weekly", "monthly"])
      .withMessage("频率必须是 daily、weekly 或 monthly"),
    body("executionDay")
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage("执行日必须在1-31之间"),
    body("executionTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("执行时间格式必须是 HH:mm"),
  ],
  autoInvestmentController.updatePlan
);

// 暂停定投计划
router.post(
  "/plans/:id/pause",
  [param("id").isInt({ min: 1 }).withMessage("无效的计划ID")],
  autoInvestmentController.pausePlan
);

// 恢复定投计划
router.post(
  "/plans/:id/resume",
  [param("id").isInt({ min: 1 }).withMessage("无效的计划ID")],
  autoInvestmentController.resumePlan
);

// 删除定投计划
router.delete(
  "/plans/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的计划ID")],
  autoInvestmentController.deletePlan
);

// 获取计划的执行记录
router.get(
  "/plans/:id/records",
  [param("id").isInt({ min: 1 }).withMessage("无效的计划ID")],
  autoInvestmentController.getPlanRecords
);

// ========== 执行记录 ==========

// 获取执行记录列表
router.get(
  "/records",
  [
    query("planId").optional().isInt({ min: 1 }).withMessage("无效的计划ID"),
    query("startDate").optional().isISO8601().withMessage("开始日期格式无效"),
    query("endDate").optional().isISO8601().withMessage("结束日期格式无效"),
    query("status")
      .optional()
      .isIn(["success", "failed"])
      .withMessage("状态必须是 success 或 failed"),
    query("page").optional().isInt({ min: 1 }).withMessage("页码必须大于0"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须在1-100之间"),
  ],
  autoInvestmentController.listRecords
);

// 单次买入转换（支持折扣）
router.post(
  "/one-time-buy",
  [
    body("sourceAccountId")
      .isInt({ min: 1 })
      .withMessage("无效的资金来源账户ID"),
    body("targetAccountId")
      .isInt({ min: 1 })
      .withMessage("无效的目标投资账户ID"),
    body("paidAmount").isFloat({ gt: 0 }).withMessage("实际支付金额必须大于0"),
    body("investedAmount")
      .isFloat({ gt: 0 })
      .withMessage("获得投资金额必须大于0"),
    body("date").optional().isISO8601().withMessage("日期格式无效"),
  ],
  autoInvestmentController.oneTimeBuy
);

// ========== 提醒 ==========

// 获取未读提醒
router.get("/reminders", autoInvestmentController.listReminders);

// 获取未读提醒数量
router.get("/reminders/count", autoInvestmentController.getReminderCount);

// 标记提醒为已读
router.post(
  "/reminders/:id/read",
  [param("id").isInt({ min: 1 }).withMessage("无效的提醒ID")],
  autoInvestmentController.markReminderRead
);

// 标记所有提醒为已读
router.post(
  "/reminders/read-all",
  autoInvestmentController.markAllRemindersRead
);

export default router;
