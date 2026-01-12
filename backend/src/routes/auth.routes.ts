import { Router } from "express";
import { body } from "express-validator";
import authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// 注册验证规则
const registerValidation = [
  body("email").isEmail().withMessage("请输入有效的邮箱地址").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("密码长度不能少于6位"),
  body("nickname")
    .isLength({ min: 2, max: 20 })
    .withMessage("昵称长度在2-20个字符之间")
    .trim(),
];

// 登录验证规则
const loginValidation = [
  body("email").isEmail().withMessage("请输入有效的邮箱地址").normalizeEmail(),
  body("password").notEmpty().withMessage("请输入密码"),
];

// 注册
router.post("/register", registerValidation, authController.register);

// 登录
router.post("/login", loginValidation, authController.login);

// 退出登录（需要认证）
router.post("/logout", authenticate, authController.logout);

// 获取当前用户信息（需要认证）
router.get("/me", authenticate, authController.me);

export default router;
