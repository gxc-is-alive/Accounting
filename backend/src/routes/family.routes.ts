import { Router } from "express";
import { body, param } from "express-validator";
import familyController from "../controllers/family.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取用户的家庭列表
router.get("/", familyController.list);

// 通过邀请码加入家庭
router.post(
  "/join",
  [
    body("code")
      .trim()
      .notEmpty()
      .withMessage("邀请码不能为空")
      .isLength({ min: 8, max: 8 })
      .withMessage("邀请码格式不正确"),
  ],
  familyController.join
);

// 获取家庭详情
router.get(
  "/:id",
  [param("id").isInt({ min: 1 }).withMessage("无效的家庭ID")],
  familyController.get
);

// 获取家庭成员列表
router.get(
  "/:id/members",
  [param("id").isInt({ min: 1 }).withMessage("无效的家庭ID")],
  familyController.getMembers
);

// 创建家庭
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("家庭名称不能为空")
      .isLength({ max: 100 })
      .withMessage("家庭名称不能超过100个字符"),
  ],
  familyController.create
);

// 更新家庭
router.put(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的家庭ID"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("家庭名称不能为空")
      .isLength({ max: 100 })
      .withMessage("家庭名称不能超过100个字符"),
  ],
  familyController.update
);

// 生成邀请码
router.post(
  "/:id/invite",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的家庭ID"),
    body("expiresInHours")
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage("有效期必须在1-168小时之间"),
  ],
  familyController.createInvite
);

// 移除成员
router.delete(
  "/:id/members/:userId",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的家庭ID"),
    param("userId").isInt({ min: 1 }).withMessage("无效的用户ID"),
  ],
  familyController.removeMember
);

// 退出家庭
router.post(
  "/:id/leave",
  [param("id").isInt({ min: 1 }).withMessage("无效的家庭ID")],
  familyController.leave
);

// 设置成员角色
router.put(
  "/:id/members/:userId/role",
  [
    param("id").isInt({ min: 1 }).withMessage("无效的家庭ID"),
    param("userId").isInt({ min: 1 }).withMessage("无效的用户ID"),
    body("role").isIn(["admin", "member"]).withMessage("无效的角色"),
  ],
  familyController.setMemberRole
);

export default router;
