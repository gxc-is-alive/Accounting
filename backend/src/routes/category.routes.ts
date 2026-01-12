import { Router } from "express";
import { body, param, query } from "express-validator";
import categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取分类列表
router.get(
  "/",
  [
    query("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("无效的分类类型"),
  ],
  categoryController.list
);

// 创建分类
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("分类名称不能为空")
      .isLength({ max: 50 })
      .withMessage("分类名称不能超过50个字符"),
    body("type").isIn(["income", "expense"]).withMessage("无效的分类类型"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
    body("parentId").optional().isInt({ min: 1 }).withMessage("无效的父分类ID"),
  ],
  categoryController.create
);

// 更新分类
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的分类ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("分类名称不能为空")
      .isLength({ max: 50 })
      .withMessage("分类名称不能超过50个字符"),
    body("icon").optional().isString().withMessage("图标必须是字符串"),
    body("parentId")
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage("无效的父分类ID"),
    body("sortOrder")
      .optional()
      .isInt({ min: 0 })
      .withMessage("排序值必须是非负整数"),
  ],
  categoryController.update
);

// 删除分类
router.delete(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的分类ID")],
  categoryController.delete
);

export default router;
