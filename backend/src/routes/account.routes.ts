import { Router } from "express";
import { body, param } from "express-validator";
import accountController from "../controllers/account.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有账户路由都需要认证
router.use(authenticate);

// 账户类型枚举
const accountTypes = ["cash", "bank", "alipay", "wechat", "credit", "other"];

// 获取账户列表
router.get("/", accountController.list);

// 创建账户
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("账户名称不能为空")
      .isLength({ max: 50 })
      .withMessage("账户名称不能超过50个字符"),
    body("type").isIn(accountTypes).withMessage("无效的账户类型"),
    body("initialBalance")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("初始余额必须是非负数"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
    // 信用账户扩展字段
    body("creditLimit")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("信用额度必须是非负数"),
    body("billingDay")
      .optional()
      .isInt({ min: 1, max: 28 })
      .withMessage("账单日必须在1-28之间"),
    body("dueDay")
      .optional()
      .isInt({ min: 1, max: 28 })
      .withMessage("还款日必须在1-28之间"),
  ],
  accountController.create
);

// 更新账户
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账户ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("账户名称不能为空")
      .isLength({ max: 50 })
      .withMessage("账户名称不能超过50个字符"),
    body("type").optional().isIn(accountTypes).withMessage("无效的账户类型"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
    // 信用账户扩展字段
    body("creditLimit")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("信用额度必须是非负数"),
    body("billingDay")
      .optional()
      .isInt({ min: 1, max: 28 })
      .withMessage("账单日必须在1-28之间"),
    body("dueDay")
      .optional()
      .isInt({ min: 1, max: 28 })
      .withMessage("还款日必须在1-28之间"),
  ],
  accountController.update
);

// 删除账户
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的账户ID")],
  accountController.delete
);

// 获取信用账户详情（包含计算字段）
router.get(
  "/:id/credit",
  [param("id").isInt({ min: 1 }).withMessage("无效的账户ID")],
  accountController.getCreditDetails
);

// 获取用户信用账户汇总
router.get("/credit/summary", accountController.getCreditSummary);

export default router;
