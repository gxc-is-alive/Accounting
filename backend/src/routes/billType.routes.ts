import { Router } from "express";
import { body, param } from "express-validator";
import billTypeController from "../controllers/billType.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取账单类型列表
router.get("/", billTypeController.list);

// 创建账单类型
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("账单类型名称不能为空")
      .isLength({ max: 50 })
      .withMessage("账单类型名称不能超过50个字符"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("描述不能超过200个字符"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
  ],
  billTypeController.create
);

// 更新账单类型
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的账单类型ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("账单类型名称不能为空")
      .isLength({ max: 50 })
      .withMessage("账单类型名称不能超过50个字符"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 200 })
      .withMessage("描述不能超过200个字符"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
    body("sortOrder")
      .optional()
      .isInt({ min: 0 })
      .withMessage("排序值必须是非负整数"),
  ],
  billTypeController.update
);

// 删除账单类型
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的账单类型ID")],
  billTypeController.delete
);

export default router;
