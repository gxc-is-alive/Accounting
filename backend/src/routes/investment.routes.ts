/**
 * 投资路由
 * /api/investment
 */

import { Router } from "express";
import { body, param } from "express-validator";
import investmentController from "../controllers/investment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有投资路由都需要认证
router.use(authenticate);

// 获取投资账户列表（含汇总）
router.get("/accounts", investmentController.list);

// 获取投资概览统计
router.get("/summary", investmentController.getSummary);

// 获取单个投资账户详情
router.get(
  "/accounts/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的账户ID")],
  investmentController.getById
);

// 创建投资账户
router.post(
  "/accounts",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("产品名称不能为空")
      .isLength({ max: 50 })
      .withMessage("产品名称不能超过50个字符"),
    body("shares").isFloat({ min: 0 }).withMessage("份额必须是非负数"),
    body("costPrice").isFloat({ min: 0 }).withMessage("成本价必须是非负数"),
    body("currentNetValue").isFloat({ gt: 0 }).withMessage("当前净值必须大于0"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
  ],
  investmentController.create
);

// 更新投资账户
router.put(
  "/accounts/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("产品名称不能为空")
      .isLength({ max: 50 })
      .withMessage("产品名称不能超过50个字符"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
  ],
  investmentController.update
);

// 删除投资账户
router.delete(
  "/accounts/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的账户ID")],
  investmentController.delete
);

// 买入份额
router.post(
  "/accounts/:id/buy",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("shares").isFloat({ gt: 0 }).withMessage("买入份额必须大于0"),
    body("price").isFloat({ gt: 0 }).withMessage("买入价格必须大于0"),
    body("date").optional().isISO8601().withMessage("日期格式无效"),
    body("sourceAccountId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("无效的资金来源账户ID"),
  ],
  investmentController.buy
);

// 卖出份额
router.post(
  "/accounts/:id/sell",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("shares").isFloat({ gt: 0 }).withMessage("卖出份额必须大于0"),
    body("price").isFloat({ gt: 0 }).withMessage("卖出价格必须大于0"),
    body("date").optional().isISO8601().withMessage("日期格式无效"),
    body("targetAccountId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("无效的目标账户ID"),
  ],
  investmentController.sell
);

// 更新净值
router.post(
  "/accounts/:id/valuation",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("netValue").isFloat({ gt: 0 }).withMessage("净值必须大于0"),
    body("date").optional().isISO8601().withMessage("日期格式无效"),
  ],
  investmentController.updateNetValue
);

// 批量更新净值
router.post(
  "/valuations/batch",
  [
    body("valuations").isArray({ min: 1 }).withMessage("估值列表不能为空"),
    body("valuations.*.accountId")
      .isInt({ min: 1 })
      .withMessage("无效的账户ID"),
    body("valuations.*.netValue")
      .isFloat({ gt: 0 })
      .withMessage("净值必须大于0"),
    body("date").optional().isISO8601().withMessage("日期格式无效"),
  ],
  investmentController.updateNetValueBatch
);

export default router;
