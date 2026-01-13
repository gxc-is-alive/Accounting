import { Router } from "express";
import { body, param, query } from "express-validator";
import repaymentController from "../controllers/repayment.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有还款路由都需要认证
router.use(authenticate);

// 创建还款
router.post(
  "/",
  [
    body("creditAccountId").isInt({ min: 1 }).withMessage("请选择信用账户"),
    body("sourceAccountId").isInt({ min: 1 }).withMessage("请选择还款来源账户"),
    body("amount").isFloat({ min: 0.01 }).withMessage("还款金额必须大于0"),
    body("date").isISO8601().withMessage("请输入有效的日期"),
    body("categoryId").isInt({ min: 1 }).withMessage("请选择分类"),
    body("note")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("备注不能超过500个字符"),
  ],
  repaymentController.create
);

// 获取还款历史
router.get(
  "/",
  [
    query("accountId").optional().isInt({ min: 1 }).withMessage("无效的账户ID"),
    query("page").optional().isInt({ min: 1 }).withMessage("页码必须大于0"),
    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("每页数量必须在1-100之间"),
  ],
  repaymentController.list
);

// 删除还款记录
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的还款记录ID")],
  repaymentController.delete
);

// 获取还款提醒
router.get("/reminders", repaymentController.getReminders);

export default router;
